// Reply monitor: polls IMAP for all 12 mailboxes, classifies each new UNSEEN,
// appends to ReplyLog sheet, handles STOP HRVATSKA unsubscribes, sends Gmail
// notification for genuine replies. Uses IMAP \Seen flag as state — no local state.
//
// env vars:
//   NOTIFY_TO=tutafranko@gmail.com  default
//   DRY_RUN=true                    log only, don't send notif, don't mark seen, don't write
//   INIT=true                       mark all UNSEEN as Seen without notifying (baseline)

const fs = require('fs');
const path = require('path');
const imaps = require('imap-simple');
const nodemailer = require('nodemailer');

const NOTIFY_TO = process.env.NOTIFY_TO || 'tutafranko@gmail.com';
const DRY_RUN = process.env.DRY_RUN === 'true';
const INIT = process.env.INIT === 'true';
const IMAP_HOST = 'mail.privateemail.com';
const IMAP_PORT = 993;

const SMTP_PATH = path.resolve(__dirname, '..', 'credentials', 'smtp.json');

// ReplyLog config — uses existing psihijatrija doc, new tab
const REPLY_LOG_SHEET_ID = '1eMoz0BTb9KNjtwFG9Xyz6Cl5XAlRJqdw7aK2oyK-VG8';
const REPLY_LOG_TAB = 'ReplyLog';
const REPLY_LOG_HEADERS = ['received_at', 'mailbox', 'from_email', 'from_name', 'subject', 'type', 'snippet', 'message_id', 'industry_mapped'];

let sheetsModule;
function getSheets() { if (!sheetsModule) sheetsModule = require('./sheets'); return sheetsModule; }
let industriesConfig;
function getIndustries() { if (!industriesConfig) industriesConfig = require('../industries.json'); return industriesConfig; }

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

async function withConnection(user, pass, fn) {
  const cfg = {
    imap: {
      user, password: pass,
      host: IMAP_HOST, port: IMAP_PORT, tls: true,
      authTimeout: 15000, connTimeout: 15000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };
  const conn = await imaps.connect(cfg);
  try {
    await conn.openBox('INBOX');
    return await fn(conn);
  } finally {
    try { await conn.end(); } catch {}
  }
}

async function fetchUnseen(conn) {
  const messages = await conn.search(['UNSEEN'], {
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)', 'TEXT'],
    struct: false,
    markSeen: false
  });
  return messages.map(m => {
    const hdr = m.parts.find(p => p.which.includes('HEADER')) || {};
    const h = hdr.body || {};
    const textPart = m.parts.find(p => p.which === 'TEXT');
    const bodyText = textPart ? String(textPart.body || '').slice(0, 3000) : '';
    return {
      uid: m.attributes.uid,
      from: (h.from || ['?'])[0],
      subject: (h.subject || ['(no subject)'])[0],
      date: (h.date || ['?'])[0],
      messageId: (h['message-id'] || ['?'])[0],
      bodyText
    };
  });
}

async function markSeen(conn, uids) {
  if (!uids.length) return;
  await conn.addFlags(uids, '\\Seen');
}

function extractEmail(fromField) {
  // "Name <user@domain.com>" or "user@domain.com" or "<user@domain.com>"
  const m = String(fromField || '').match(/<([^>]+@[^>]+)>/);
  if (m) return m[1].toLowerCase().trim();
  const m2 = String(fromField || '').match(/([\w.+-]+@[\w.-]+\.[a-z]{2,})/i);
  return m2 ? m2[1].toLowerCase().trim() : '';
}

function extractName(fromField) {
  const m = String(fromField || '').match(/^([^<]+)</);
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}

function classify(msg) {
  const from = (msg.from || '').toLowerCase();
  const subj = (msg.subject || '').toLowerCase();
  const body = (msg.bodyText || '').toLowerCase();

  // STOP HRVATSKA — check FIRST (overrides everything)
  if (/stop\s+hrvatska/i.test(body) || /stop\s+hrvatska/i.test(subj)) return 'stop';

  // Bounces
  if (from.includes('mailer-daemon') || from.includes('postmaster')) return 'bounce';
  if (subj.startsWith('undelivered') || subj.startsWith('delivery status')) return 'bounce';

  // DMARC/SPF reports
  if (from.includes('dmarc') || subj.includes('dmarc')) return 'report';
  if (/report.?(domain|id)/i.test(subj)) return 'report';
  if (subj.startsWith('[preview]')) return 'report';

  // Auto-responders
  if (subj.startsWith('out of office') || subj.startsWith('automatic reply')) return 'autoresponder';
  if (subj.startsWith('auto:') || subj.startsWith('autoreply')) return 'autoresponder';
  if (subj.includes('vacation') && subj.includes('reply')) return 'autoresponder';
  if (/thanks for (your|the) message|we (will|shall) respond/i.test(subj)) return 'autoresponder';
  if (/we have received your|automatic.{0,10}response/i.test(body.slice(0, 500))) return 'autoresponder';

  // Warmup / self-test
  if (/__/.test(subj)) return 'warmup';
  if (subj.includes('warmup') || subj.includes('warm-up')) return 'warmup';
  if (subj.includes('happy-money')) return 'warmup';
  if (subj.includes('test email to check account')) return 'warmup';

  return 'reply';  // actionable human reply
}

// Find which industry sheet contains this email (returns array of industry keys)
async function findIndustriesForEmail(email) {
  const config = getIndustries();
  const sheets = getSheets();
  const hits = [];
  for (const ind of config.industries) {
    try {
      const rows = await sheets.readRows(ind.sheet_id, ind.gid);
      const found = rows.find(r => {
        const allE = String(r.all_emails || '').toLowerCase();
        return allE.split(/[,;\s]+/).map(e => e.trim()).includes(email);
      });
      if (found) hits.push({ industry: ind.key, sheet_id: ind.sheet_id, gid: ind.gid, row: found });
    } catch (e) {
      log(`WARN read ${ind.key} for lookup failed: ${e.message}`);
    }
  }
  return hits;
}

async function markUnsubscribed(email) {
  const sheets = getSheets();
  const hits = await findIndustriesForEmail(email);
  if (!hits.length) {
    log(`STOP: no sheet contains ${email} — nothing to mark`);
    return 0;
  }
  let marked = 0;
  for (const h of hits) {
    try {
      const writes = new Map();
      writes.set(h.row.__rowIndex, 'unsubscribed');
      await sheets.bulkUpdateColumn(h.sheet_id, h.gid, 'email_status', writes);
      marked++;
      log(`STOP: marked ${email} unsubscribed in ${h.industry} (row ${h.row.__rowIndex})`);
    } catch (e) {
      log(`STOP ERROR marking ${email} in ${h.industry}: ${e.message}`);
    }
  }
  return marked;
}

async function ensureReplyLogTab() {
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const sheets = getSheets();
  const doc = new GoogleSpreadsheet(REPLY_LOG_SHEET_ID, sheets.getAuth());
  await doc.loadInfo();
  let tab = doc.sheetsByTitle[REPLY_LOG_TAB];
  if (!tab) {
    tab = await doc.addSheet({ title: REPLY_LOG_TAB, headerValues: REPLY_LOG_HEADERS });
    log(`Created ReplyLog tab in ${REPLY_LOG_SHEET_ID}`);
  } else {
    await tab.loadHeaderRow();
    const missing = REPLY_LOG_HEADERS.filter(h => !tab.headerValues.includes(h));
    if (missing.length) {
      const newHeaders = [...tab.headerValues, ...missing];
      await tab.setHeaderRow(newHeaders);
      log(`Added missing headers to ReplyLog: ${missing.join(', ')}`);
    }
  }
  return tab;
}

async function appendToReplyLog(tab, replies) {
  if (!replies.length) return;
  const rows = replies.map(r => ({
    received_at: new Date().toISOString(),
    mailbox: r.mailbox,
    from_email: r.fromEmail,
    from_name: r.fromName,
    subject: r.subject,
    type: r.type,
    snippet: String(r.bodyText || '').slice(0, 200).replace(/[\r\n\t]+/g, ' '),
    message_id: r.messageId,
    industry_mapped: r.industryMapped || ''
  }));
  await tab.addRows(rows);
  log(`appended ${rows.length} rows to ReplyLog`);
}

async function notify(replies) {
  if (replies.length === 0) return;
  const smtps = JSON.parse(fs.readFileSync(SMTP_PATH, 'utf8'));
  const sender = smtps.b1;
  const t = nodemailer.createTransport({
    host: 'mail.privateemail.com', port: 465, secure: true,
    auth: { user: sender.user, pass: sender.pass }
  });
  const lines = replies.map(r =>
    `📨 ${r.mailbox}\n   FROM: ${r.from}\n   SUBJECT: ${r.subject}\n   DATE: ${r.date}`
  ).join('\n\n');
  const subject = `🔔 ${replies.length} NOVI ODGOVOR${replies.length > 1 ? 'A' : ''} — Opsis outreach`;
  const body = `Stigli su novi mailovi u Privatemail mailboxove:\n\n${lines}\n\n---\nOtvori webmail: https://privateemail.com`;
  const info = await t.sendMail({
    from: sender.user, to: NOTIFY_TO, subject, text: body
  });
  log(`✅ notified ${NOTIFY_TO} (messageId=${info.messageId})`);
}

async function notifyStop(email, marked) {
  const smtps = JSON.parse(fs.readFileSync(SMTP_PATH, 'utf8'));
  const sender = smtps.b1;
  const t = nodemailer.createTransport({
    host: 'mail.privateemail.com', port: 465, secure: true,
    auth: { user: sender.user, pass: sender.pass }
  });
  await t.sendMail({
    from: sender.user, to: NOTIFY_TO,
    subject: `🚫 STOP HRVATSKA — ${email}`,
    text: `Unsubscribed: ${email}\nMarked in ${marked} sheet(s) as email_status=unsubscribed.\nNeće više dobivati mailove.`
  });
}

async function main() {
  log(`reply_monitor start. NOTIFY_TO=${NOTIFY_TO} DRY_RUN=${DRY_RUN} INIT=${INIT}`);
  const smtps = JSON.parse(fs.readFileSync(SMTP_PATH, 'utf8'));
  const allClassified = []; // {mailbox, uid, type, ...}
  let totalUnseen = 0;

  for (const [key, c] of Object.entries(smtps)) {
    try {
      await withConnection(c.user, c.pass, async (conn) => {
        const unseen = await fetchUnseen(conn);
        totalUnseen += unseen.length;
        if (INIT) {
          if (!DRY_RUN && unseen.length > 0) await markSeen(conn, unseen.map(m => m.uid));
          log(`[${key}] INIT: ${unseen.length} marked seen`);
          return;
        }
        for (const m of unseen) {
          allClassified.push({
            ...m,
            mailbox: c.user,
            mailboxKey: key,
            fromEmail: extractEmail(m.from),
            fromName: extractName(m.from),
            type: classify(m)
          });
        }
        log(`[${key}] ${c.user}: ${unseen.length} unseen`);
      });
    } catch (e) {
      log(`[${key}] ERROR ${c.user}: ${e.message.slice(0, 100)}`);
    }
  }

  if (INIT) { log('INIT done'); return; }

  // Group by type for reporting
  const byType = {};
  for (const m of allClassified) byType[m.type] = (byType[m.type] || 0) + 1;
  log(`Classification: ${JSON.stringify(byType)} (total ${allClassified.length})`);

  // Process STOPs first
  const stops = allClassified.filter(m => m.type === 'stop');
  for (const s of stops) {
    if (DRY_RUN) {
      log(`DRY_RUN: would unsubscribe ${s.fromEmail}`);
    } else {
      const marked = await markUnsubscribed(s.fromEmail);
      if (marked > 0) {
        try { await notifyStop(s.fromEmail, marked); } catch (e) { log(`notifyStop err: ${e.message}`); }
      }
    }
  }

  // Append ALL to ReplyLog (even noise, for full audit)
  if (!DRY_RUN && allClassified.length > 0) {
    try {
      const tab = await ensureReplyLogTab();
      await appendToReplyLog(tab, allClassified);
    } catch (e) {
      log(`ReplyLog write ERROR (continuing): ${e.message}`);
    }
  }

  // Notify only for genuine replies (not noise, not stops which have their own notify)
  const realReplies = allClassified.filter(m => m.type === 'reply');
  if (realReplies.length > 0 && !DRY_RUN) {
    try { await notify(realReplies); } catch (e) { log(`notify err: ${e.message}`); }
  }

  // Mark all as Seen (we processed them all)
  if (!DRY_RUN) {
    const byMailboxKey = {};
    for (const m of allClassified) {
      byMailboxKey[m.mailboxKey] = byMailboxKey[m.mailboxKey] || { user: m.mailbox, uids: [] };
      byMailboxKey[m.mailboxKey].uids.push(m.uid);
    }
    for (const [key, { user, uids }] of Object.entries(byMailboxKey)) {
      const cred = smtps[key];
      try {
        await withConnection(cred.user, cred.pass, async (conn) => { await markSeen(conn, uids); });
        log(`marked ${uids.length} Seen in ${user}`);
      } catch (e) {
        log(`WARN markSeen failed for ${user}: ${e.message}`);
      }
    }
  } else if (allClassified.length > 0) {
    log('DRY_RUN — would process these:');
    for (const m of allClassified.slice(0, 20)) console.log(`  [${m.type}] ${m.mailbox} | FROM: ${m.from} | SUBJECT: ${m.subject}`);
  }

  log('done');
}

if (require.main === module) {
  main().catch(e => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
