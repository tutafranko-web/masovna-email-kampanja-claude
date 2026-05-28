const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

const CREDS_PATH = path.resolve(__dirname, '..', 'credentials', 'smtp.json');

// Custom DNS lookup: nodemailer/net.Socket calls getaddrinfo by default which
// uses the OS resolver. On some Windows machines that resolver flakes out and
// returns ETIMEOUT. Bypass it by resolving via Cloudflare (1.1.1.1) directly.
const dnsCache = new Map();
function customLookup(hostname, options, callback) {
  // signature: (hostname, options, cb) — options can be {family} or just cb
  if (typeof options === 'function') { callback = options; options = {}; }
  const cached = dnsCache.get(hostname);
  if (cached && Date.now() - cached.ts < 300000) {
    return callback(null, cached.address, 4);
  }
  const resolver = new dns.promises.Resolver({ timeout: 10000, tries: 2 });
  resolver.setServers(['1.1.1.1', '8.8.8.8']);
  resolver.resolve4(hostname).then(addrs => {
    if (!addrs.length) return callback(new Error('No A records for ' + hostname));
    dnsCache.set(hostname, { address: addrs[0], ts: Date.now() });
    callback(null, addrs[0], 4);
  }).catch(e => callback(e));
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
function getTransporter(smtpKey, globals) {
  if (transporters.has(smtpKey)) return transporters.get(smtpKey);
  const c = loadCreds();
  if (!c[smtpKey]) throw new Error(`No SMTP creds for key '${smtpKey}'`);
  const t = nodemailer.createTransport({
    host: globals.smtp_host,
    port: globals.smtp_port,
    secure: globals.smtp_secure,
    auth: { user: c[smtpKey].user, pass: c[smtpKey].pass },
    dnsTimeout: 15000,
    connectionTimeout: 30000,
    lookup: customLookup
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
        auth: { user: c[key].user, pass: c[key].pass },
        dnsTimeout: 15000,
        connectionTimeout: 30000,
        lookup: customLookup
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
