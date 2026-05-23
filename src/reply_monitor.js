// Reply monitor: polls IMAP for all 12 mailboxes, sends gmail notification
// to NOTIFY_TO when new UNSEEN replies arrive. Uses IMAP \Seen flag as state —
// no local state file needed, survives cloud routine restarts.
//
// env vars:
//   NOTIFY_TO=tutafranko@gmail.com (default)
//   DRY_RUN=true        - log only, don't send notification, don't mark seen
//   INIT=true           - mark ALL UNSEEN mails as Seen without notifying (baseline)

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
    bodies: ['HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID)'],
    struct: false,
    markSeen: false
  });
  return messages.map(m => {
    const hdr = m.parts.find(p => p.which.includes('HEADER')) || {};
    const h = hdr.body || {};
    return {
      uid: m.attributes.uid,
      from: (h.from || ['?'])[0],
      subject: (h.subject || ['(no subject)'])[0],
      date: (h.date || ['?'])[0],
      messageId: (h['message-id'] || ['?'])[0]
    };
  });
}

async function markSeen(conn, uids) {
  if (!uids.length) return;
  // imap-simple expects an array of UIDs; addFlags adds \Seen
  await conn.addFlags(uids, '\\Seen');
}

function isNoise(msg) {
  const from = (msg.from || '').toLowerCase();
  const subj = (msg.subject || '').toLowerCase();
  // Bounces / system
  if (from.includes('mailer-daemon') || from.includes('postmaster')) return true;
  if (subj.startsWith('undelivered') || subj.startsWith('delivery status')) return true;
  // DMARC / SPF / DKIM reports
  if (from.includes('dmarc') || subj.includes('dmarc')) return true;
  if (/report.?(domain|id)/i.test(subj)) return true;
  if (subj.startsWith('[preview]')) return true;
  // Self-test emails (warmup tools send from mailbox to itself)
  if (from === 'opsisdalmatia' || /opsisdalmatia[a-c]\d@opsisdalmatiaoutreachseria[a-c]\.com/i.test(from)) return true;
  if (subj.includes('test email to check account')) return true;
  // Email warmup services (use double-underscore tag patterns)
  if (/__/.test(subj)) return true;
  if (subj.includes('warmup') || subj.includes('warm-up')) return true;
  if (subj.includes('happy-money')) return true;
  // Auto-replies / OOO
  if (subj.startsWith('out of office') || subj.startsWith('automatic reply')) return true;
  if (subj.startsWith('auto:') || subj.startsWith('autoreply')) return true;
  if (subj.includes('vacation') && subj.includes('reply')) return true;
  return false;
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
  const newReplies = [];
  let totalUnseen = 0, totalNoise = 0, totalReal = 0;

  for (const [key, c] of Object.entries(smtps)) {
    try {
      await withConnection(c.user, c.pass, async (conn) => {
        const unseen = await fetchUnseen(conn);
        totalUnseen += unseen.length;
        const noise = unseen.filter(isNoise);
        const real = unseen.filter(m => !isNoise(m));
        totalNoise += noise.length;
        totalReal += real.length;

        log(`[${key}] ${c.user}: ${unseen.length} unseen, ${noise.length} noise, ${real.length} actionable`);

        if (INIT) {
          // Mark everything seen, don't notify
          if (!DRY_RUN && unseen.length > 0) {
            await markSeen(conn, unseen.map(m => m.uid));
          }
          return;
        }

        // Mark noise as seen so we don't process again
        if (!DRY_RUN && noise.length > 0) {
          await markSeen(conn, noise.map(m => m.uid));
        }

        for (const r of real) newReplies.push({ ...r, mailbox: c.user });

        // Mark real replies as seen AFTER we successfully notify
        // (done below in main, not here, so we don't mark-seen if notify fails)
      });
    } catch (e) {
      log(`[${key}] ERROR ${c.user}: ${e.message.slice(0, 100)}`);
    }
  }

  log(`Totals: ${totalUnseen} unseen, ${totalNoise} noise, ${totalReal} actionable`);

  if (INIT) {
    log('INIT done — all current unseen marked as Seen baseline');
    return;
  }

  if (newReplies.length > 0 && !DRY_RUN) {
    await notify(newReplies);
    // After successful notify, mark them as Seen so next run doesn't re-notify
    // Re-connect per mailbox to mark
    const byMailbox = {};
    for (const r of newReplies) {
      byMailbox[r.mailbox] = byMailbox[r.mailbox] || [];
      byMailbox[r.mailbox].push(r.uid);
    }
    for (const [mailbox, uids] of Object.entries(byMailbox)) {
      const cred = Object.values(smtps).find(s => s.user === mailbox);
      try {
        await withConnection(cred.user, cred.pass, async (conn) => {
          await markSeen(conn, uids);
        });
        log(`marked ${uids.length} as Seen in ${mailbox}`);
      } catch (e) {
        log(`WARN markSeen failed for ${mailbox}: ${e.message}`);
      }
    }
  } else if (newReplies.length > 0 && DRY_RUN) {
    log('DRY_RUN — would notify these:');
    for (const r of newReplies) {
      console.log(`  ${r.mailbox} | FROM: ${r.from} | SUBJECT: ${r.subject}`);
    }
  }

  log('done');
}

if (require.main === module) {
  main().catch(e => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
