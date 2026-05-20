const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const CREDS_PATH = path.resolve(__dirname, '..', 'credentials', 'smtp.json');

let creds = null;
function loadCreds() {
  if (creds) return creds;
  if (!fs.existsSync(CREDS_PATH)) {
    throw new Error(`SMTP credentials not found at ${CREDS_PATH}. See CREDENTIALS_SETUP.md.`);
  }
  creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
  return creds;
}

const transporters = new Map();
function getTransporter(smtpKey, globals) {
  if (transporters.has(smtpKey)) return transporters.get(smtpKey);
  const c = loadCreds();
  if (!c[smtpKey]) throw new Error(`No SMTP creds for key '${smtpKey}'`);
  const t = nodemailer.createTransport({
    host: globals.smtp_host,
    port: globals.smtp_port,
    secure: globals.smtp_secure,
    auth: { user: c[smtpKey].user, pass: c[smtpKey].pass }
  });
  transporters.set(smtpKey, t);
  return t;
}

async function sendMail(industry, globals, email) {
  const t = getTransporter(industry.smtp_key, globals);
  const info = await t.sendMail({
    from: `"${globals.sender_ime}" <${industry.sender_email}>`,
    to: email.to,
    replyTo: globals.reply_to,
    subject: email.subject,
    text: email.body
  });
  return info;
}

async function verifyAll(globals) {
  const c = loadCreds();
  const results = {};
  for (const key of Object.keys(c)) {
    try {
      const t = nodemailer.createTransport({
        host: globals.smtp_host,
        port: globals.smtp_port,
        secure: globals.smtp_secure,
        auth: { user: c[key].user, pass: c[key].pass }
      });
      await t.verify();
      results[key] = 'OK';
    } catch (e) {
      results[key] = 'ERR: ' + e.message;
    }
  }
  return results;
}

module.exports = { sendMail, verifyAll };
