const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

const CREDS_PATH = path.resolve(__dirname, '..', 'credentials', 'smtp.json');

// DNS workaround: nodemailer's verify() triggers EDNS queryA timeouts on
// some Windows/VPN networks. Resolve hostname → IPv4 ONCE via OS getaddrinfo
// (dns.lookup, same path as nslookup), then point transport at the IP and use
// TLS servername to preserve cert verification.
const ipCache = new Map();
function resolveOnce(hostname) {
  if (ipCache.has(hostname)) return Promise.resolve(ipCache.get(hostname));
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) return reject(err);
      ipCache.set(hostname, address);
      resolve(address);
    });
  });
}

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
async function getTransporter(smtpKey, globals) {
  if (transporters.has(smtpKey)) return transporters.get(smtpKey);
  const c = loadCreds();
  if (!c[smtpKey]) throw new Error(`No SMTP creds for key '${smtpKey}'`);
  const ip = await resolveOnce(globals.smtp_host);
  const t = nodemailer.createTransport({
    host: ip,
    port: globals.smtp_port,
    secure: globals.smtp_secure,
    tls: { servername: globals.smtp_host },
    connectionTimeout: 30000,
    auth: { user: c[smtpKey].user, pass: c[smtpKey].pass }
  });
  transporters.set(smtpKey, t);
  return t;
}

async function sendMail(industry, globals, email) {
  const t = await getTransporter(industry.smtp_key, globals);
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
  const ip = await resolveOnce(globals.smtp_host);
  for (const key of Object.keys(c)) {
    try {
      const t = nodemailer.createTransport({
        host: ip,
        port: globals.smtp_port,
        secure: globals.smtp_secure,
        tls: { servername: globals.smtp_host },
        connectionTimeout: 30000,
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
