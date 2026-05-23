// Reply monitor: polls IMAP for all 12 mailboxes, sends gmail notification
// to NOTIFY_TO when new unread replies arrive.
//
// State (state/reply_seen.json): {<mailbox_user>: <max_uid_seen>}
// IMAP UIDs are monotonically increasing, so we only fetch UIDs > max_uid_seen.
//
// env vars:
//   NOTIFY_TO=tutafranko@gmail.com (default)
//   DRY_RUN=true        - log only, don't send notification
//   INIT=true           - mark current max UID per mailbox, no notification (run once at setup)

const fs = require('fs');
const path = require('path');
const imaps = require('imap-simple');
const nodemailer = require('nodemailer');

const NOTIFY_TO = process.env.NOTIFY_TO || 'tutafranko@gmail.com';
const DRY_RUN = process.env.DRY_RUN === 'true';
const INIT = process.env.INIT === 'true';
const IMAP_HOST = 'mail.privateemail.com';
const IMAP_PORT = 993;

const STATE_PATH = path.resolve(__dirname, '..', 'state', 'reply_seen.json');
const SMTP_PATH = path.resolve(__dirname, '..', 'credentials', 'smtp.json');

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); }
  catch { return {}; }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function checkMailbox(user, pass, sinceUid) {
  const cfg = {
    imap: {
      user, password: pass,
      host: IMAP_HOST, port: IMAP_PORT, tls: true,
      authTimeout: 15000, connTimeout: 15000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };
  const conn = await imaps.connect(cfg);
  await conn.openBox('INBOX');
  // UID range: sinceUid+1 to *
  const range = `${sinceUid + 1}:*`;
  const messages = await conn.search([['UID', range]], {
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)'],
    struct: false,
    markSeen: false
  });
  const result = messages.map(m => {
    const hdr = m.parts.find(p => p.which.includes('HEADER')) || {};
    const h = hdr.body || {};
    return {
      uid: m.attributes.uid,
      from: (h.from || ['?'])[0],
      subject: (h.subject || ['(no subject)'])[0],
      date: (h.date || ['?'])[0],
      messageId: (h['message-id'] || ['?'])[0]
    };
  }).filter(m => m.uid > sinceUid); // belt-and-suspenders: IMAP servers sometimes include sinceUid itself
  await conn.end();
  return result;
}

async function getMaxUid(user, pass) {
  const cfg = {
    imap: {
      user, password: pass,
      host: IMAP_HOST, port: IMAP_PORT, tls: true,
      authTimeout: 15000, connTimeout: 15000,
      tlsOptions: { rejectUnauthorized: false }
    }
  };
  const conn = await imaps.connect(cfg);
  const box = await conn.openBox('INBOX');
  await conn.end();
  return box.uidnext - 1;
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
    `📨 ${r.mailbox}\n   FROM: ${r.from}\n   SUBJECT: ${r.subject}\n   DATE: ${r.date}\n   UID: ${r.uid}`
  ).join('\n\n');
  const subject = `🔔 ${replies.length} NOVI ODGOVOR${replies.length > 1 ? 'A' : ''} — Opsis outreach`;
  const body = `Stigli su novi mailovi u Privatemail mailboxove:\n\n${lines}\n\n---\nOtvori webmail: https://privateemail.com\nLogin s odgovarajucim mailboxom + sifra Ftmj16..`;
  if (DRY_RUN) {
    log('DRY_RUN — would notify:');
    console.log(body);
    return;
  }
  const info = await t.sendMail({
    from: sender.user,
    to: NOTIFY_TO,
    subject,
    text: body
  });
  log(`✅ notified ${NOTIFY_TO} (messageId=${info.messageId})`);
}

async function main() {
  log(`reply_monitor start. NOTIFY_TO=${NOTIFY_TO} DRY_RUN=${DRY_RUN} INIT=${INIT}`);
  const smtps = JSON.parse(fs.readFileSync(SMTP_PATH, 'utf8'));
  const state = loadState();
  const newReplies = [];

  for (const [key, c] of Object.entries(smtps)) {
    try {
      if (INIT) {
        const maxUid = await getMaxUid(c.user, c.pass);
        state[c.user] = maxUid;
        log(`[${key}] ${c.user}: maxUid=${maxUid} (marked as baseline)`);
        continue;
      }
      const sinceUid = state[c.user] || 0;
      const msgs = await checkMailbox(c.user, c.pass, sinceUid);
      // Filter noise — warmup service, bounces, auto-replies, OOO
      const real = msgs.filter(m => {
        const from = (m.from || '').toLowerCase();
        const subj = (m.subject || '').toLowerCase();
        if (from.includes('mailer-daemon') || from.includes('postmaster')) return false;
        if (subj.startsWith('undelivered') || subj.startsWith('delivery status')) return false;
        if (subj.includes('desert__ranch') || subj.includes('warmup')) return false;
        if (subj.startsWith('out of office') || subj.startsWith('automatic reply')) return false;
        if (subj.startsWith('auto:') || subj.startsWith('autoreply')) return false;
        if (subj.includes('vacation') && subj.includes('reply')) return false;
        return true;
      });
      log(`[${key}] ${c.user}: sinceUid=${sinceUid}, ${msgs.length} new, ${real.length} actionable`);
      for (const r of real) newReplies.push({ ...r, mailbox: c.user });
      // Update high watermark
      if (msgs.length > 0) {
        state[c.user] = Math.max(state[c.user] || 0, ...msgs.map(m => m.uid));
      }
    } catch (e) {
      log(`[${key}] ERROR ${c.user}: ${e.message.slice(0, 100)}`);
    }
  }

  if (INIT) {
    saveState(state);
    log('INIT done — baseline saved, run again to start monitoring');
    return;
  }

  log(`Total actionable replies: ${newReplies.length}`);

  if (newReplies.length > 0) {
    await notify(newReplies);
  }

  saveState(state);
  log('done');
}

if (require.main === module) {
  main().catch(e => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main, checkMailbox };
