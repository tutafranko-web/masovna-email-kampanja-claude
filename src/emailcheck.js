const https = require('https');
const path = require('path');
const fs = require('fs');

const API_CREDS_PATH = path.resolve(__dirname, '..', 'credentials', 'bulkemailchecker.json');
const API_URL = 'https://api.bulkemailchecker.com/real-time/';

let apiKey = null;
function getKey() {
  if (apiKey) return apiKey;
  if (process.env.BULKEMAILCHECKER_KEY) {
    apiKey = process.env.BULKEMAILCHECKER_KEY;
    return apiKey;
  }
  if (fs.existsSync(API_CREDS_PATH)) {
    const c = JSON.parse(fs.readFileSync(API_CREDS_PATH, 'utf8'));
    apiKey = c.api_key;
    return apiKey;
  }
  throw new Error(`BulkEmailChecker API key not found. Expected ${API_CREDS_PATH} or BULKEMAILCHECKER_KEY env var.`);
}

const sessionCache = new Map();

function httpsGetJson(url, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`Non-JSON response (HTTP ${res.statusCode}): ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
    });
  });
}

async function verify(email) {
  if (!email || !email.includes('@')) {
    return { status: 'failed', event: 'invalid_input', email };
  }
  if (sessionCache.has(email)) return sessionCache.get(email);

  const key = getKey();
  const url = `${API_URL}?key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}`;

  let result;
  try {
    const r = await httpsGetJson(url);
    if (r.status !== 200) {
      result = { status: 'unknown', event: 'http_error', http_status: r.status, email };
    } else {
      result = {
        status: r.body.status,
        event: r.body.event,
        email,
        isFreeService: r.body.isFreeService || false,
        isRoleAccount: r.body.isRoleAccount || false,
        isDisposable: r.body.isDisposable || false,
        creditsRemaining: r.body.creditsRemaining
      };
    }
  } catch (e) {
    result = { status: 'unknown', event: 'request_error', error: e.message, email };
  }

  sessionCache.set(email, result);
  return result;
}

function clearCache() { sessionCache.clear(); }
function getCacheSize() { return sessionCache.size; }

module.exports = { verify, clearCache, getCacheSize };
