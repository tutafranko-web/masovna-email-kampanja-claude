// Weekly reputation report. Reads ReplyLog + industry sheets and computes
// per-mailbox metrics (sent, replies, autoresponders, bounces, stops, reply_rate).
// Sends report via Gmail to NOTIFY_TO.
//
// env:
//   NOTIFY_TO=tutafranko@gmail.com
//   PERIOD_DAYS=7 (default)
//   DRY_RUN=true to print only

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const NOTIFY_TO = process.env.NOTIFY_TO || 'tutafranko@gmail.com';
const PERIOD_DAYS = Number(process.env.PERIOD_DAYS || 7);
const DRY_RUN = process.env.DRY_RUN === 'true';

const SMTP_PATH = path.resolve(__dirname, '..', 'credentials', 'smtp.json');
const OAUTH_PATH = path.resolve(__dirname, '..', 'credentials', 'oauth.json');
const REPLY_LOG_SHEET_ID = '1eMoz0BTb9KNjtwFG9Xyz6Cl5XAlRJqdw7aK2oyK-VG8';
const REPLY_LOG_TAB = 'ReplyLog';

const sheets = require('./sheets');
const config = require('../industries.json');

function log(...args) { console.log(`[${new Date().toISOString()}]`, ...args); }

async function readReplyLog(sinceIso) {
  const doc = new GoogleSpreadsheet(REPLY_LOG_SHEET_ID, sheets.getAuth());
  await doc.loadInfo();
  const tab = doc.sheetsByTitle[REPLY_LOG_TAB];
  if (!tab) { log('ReplyLog tab does not exist yet — no replies data'); return []; }
  await tab.loadHeaderRow();
  const rows = await tab.getRows();
  return rows
    .map(r => ({
      received_at: r.get('received_at'),
      mailbox: r.get('mailbox'),
      from_email: r.get('from_email'),
      subject: r.get('subject'),
      type: r.get('type'),
      industry_mapped: r.get('industry_mapped')
    }))
    .filter(r => r.received_at && r.received_at >= sinceIso);
}

async function gatherSentByMailbox(sinceIso) {
  const sentByMailbox = {};
  const sentByIndustry = {};
  for (const ind of config.industries) {
    sentByIndustry[ind.key] = 0;
    sentByMailbox[ind.sender_email] = sentByMailbox[ind.sender_email] || { sent: 0, industries: [] };
    sentByMailbox[ind.sender_email].industries.push(ind.key);
    const rows = await sheets.readRows(ind.sheet_id, ind.gid);
    for (const r of rows) {
      const last = r.email_last_sent_at;
      if (last && last >= sinceIso) {
        sentByMailbox[ind.sender_email].sent += Number(r.email_step || 1) > 0 ? 1 : 0;
        sentByIndustry[ind.key]++;
      }
    }
  }
  // Simpler accurate sent count: # rows touched in period
  return { sentByMailbox, sentByIndustry };
}

async function sendReport(report) {
  const smtps = JSON.parse(fs.readFileSync(SMTP_PATH, 'utf8'));
  const sender = smtps.b1;
  const t = nodemailer.createTransport({
    host: 'mail.privateemail.com', port: 465, secure: true,
    auth: { user: sender.user, pass: sender.pass }
  });
  const subject = `📊 Reputation Report — Opsis (zadnjih ${PERIOD_DAYS} dana)`;
  await t.sendMail({ from: sender.user, to: NOTIFY_TO, subject, text: report });
  log(`Sent report to ${NOTIFY_TO}`);
}

async function main() {
  log(`Reputation report start. PERIOD_DAYS=${PERIOD_DAYS} DRY_RUN=${DRY_RUN}`);
  const sinceDate = new Date(Date.now() - PERIOD_DAYS * 86400000);
  const sinceIso = sinceDate.toISOString();
  log(`Window: from ${sinceIso}`);

  const replies = await readReplyLog(sinceIso);
  log(`ReplyLog rows in window: ${replies.length}`);

  const { sentByMailbox, sentByIndustry } = await gatherSentByMailbox(sinceIso);

  // Aggregate replies per mailbox + type
  const repliesByMailbox = {};
  for (const r of replies) {
    if (!r.mailbox) continue;
    const m = repliesByMailbox[r.mailbox] = repliesByMailbox[r.mailbox] || {
      reply: 0, autoresponder: 0, bounce: 0, stop: 0, report: 0, warmup: 0
    };
    m[r.type] = (m[r.type] || 0) + 1;
  }

  // Build report
  const lines = [];
  lines.push(`Reputation Report — zadnjih ${PERIOD_DAYS} dana (od ${sinceIso.slice(0,10)})`);
  lines.push('='.repeat(60));
  lines.push('');
  lines.push('--- Per Mailbox ---');
  lines.push('Mailbox                                          | Sent | Reply | AutoR | Bounce | Stop | RR%');
  lines.push('-'.repeat(105));
  const allMailboxes = new Set([...Object.keys(sentByMailbox), ...Object.keys(repliesByMailbox)]);
  for (const mailbox of [...allMailboxes].sort()) {
    const sent = sentByMailbox[mailbox]?.sent || 0;
    const r = repliesByMailbox[mailbox] || {};
    const rr = sent > 0 ? ((r.reply || 0) / sent * 100).toFixed(1) : '-';
    lines.push(
      mailbox.padEnd(50) +
      ' | ' + String(sent).padStart(4) +
      ' | ' + String(r.reply || 0).padStart(5) +
      ' | ' + String(r.autoresponder || 0).padStart(5) +
      ' | ' + String(r.bounce || 0).padStart(6) +
      ' | ' + String(r.stop || 0).padStart(4) +
      ' | ' + String(rr).padStart(4) + (rr !== '-' ? '%' : '')
    );
  }
  lines.push('');
  lines.push('--- Per Industry ---');
  for (const [ind, sent] of Object.entries(sentByIndustry).sort((a,b) => b[1] - a[1])) {
    lines.push(`  ${ind.padEnd(15)}: ${sent} sent`);
  }
  lines.push('');
  lines.push('--- Total ---');
  const totals = {
    sent: Object.values(sentByMailbox).reduce((a,b) => a + b.sent, 0),
    reply: replies.filter(r => r.type === 'reply').length,
    autoresponder: replies.filter(r => r.type === 'autoresponder').length,
    bounce: replies.filter(r => r.type === 'bounce').length,
    stop: replies.filter(r => r.type === 'stop').length
  };
  lines.push(`  Sent: ${totals.sent}`);
  lines.push(`  Real replies: ${totals.reply}`);
  lines.push(`  Autoresponders: ${totals.autoresponder}`);
  lines.push(`  Bounces: ${totals.bounce}  ⚠️ visok bounce rate = mailbox u problemu`);
  lines.push(`  STOP unsubscribes: ${totals.stop}`);
  lines.push(`  Overall Reply Rate: ${totals.sent > 0 ? (totals.reply / totals.sent * 100).toFixed(2) : 0}%`);
  lines.push('');
  lines.push('💡 Healthy benchmarks:');
  lines.push('   - Reply rate: 1-3% (cold outreach)');
  lines.push('   - Bounce rate: <2% (>5% = SMTP problem ili truli sheet)');
  lines.push('   - STOP rate: <0.5% (>2% = previše agresivni copy)');

  const report = lines.join('\n');
  console.log(report);

  if (!DRY_RUN) await sendReport(report);
  log('done');
}

if (require.main === module) {
  main().catch(e => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
