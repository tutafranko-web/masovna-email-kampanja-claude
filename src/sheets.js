const { GoogleSpreadsheet } = require('google-spreadsheet');
const { OAuth2Client, JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.resolve(__dirname, '..', 'credentials', 'service-account.json');
const OAUTH_PATH = path.resolve(__dirname, '..', 'credentials', 'oauth.json');

let authClient = null;
function getAuth() {
  if (authClient) return authClient;
  if (fs.existsSync(OAUTH_PATH)) {
    const c = JSON.parse(fs.readFileSync(OAUTH_PATH, 'utf8'));
    const oauth = new OAuth2Client(c.client_id, c.client_secret);
    oauth.setCredentials({ refresh_token: c.refresh_token });
    authClient = oauth;
    return authClient;
  }
  if (fs.existsSync(SA_PATH)) {
    const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
    authClient = new JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return authClient;
  }
  throw new Error(`No Google credentials found. Expected one of:\n  - ${OAUTH_PATH} (OAuth2 refresh token)\n  - ${SA_PATH} (Service Account JSON)\nSee CREDENTIALS_SETUP.md.`);
}

const docCache = new Map();

async function getSheet(sheetId, gid) {
  const cacheKey = `${sheetId}:${gid}`;
  if (docCache.has(cacheKey)) {
    const cached = docCache.get(cacheKey);
    if (Date.now() - cached.t < 60_000) return cached.sheet;
  }
  const doc = new GoogleSpreadsheet(sheetId, getAuth());
  await doc.loadInfo();
  const sheet = doc.sheetsById[Number(gid)];
  if (!sheet) {
    const available = Object.keys(doc.sheetsById).join(', ');
    throw new Error(`Sheet with gid ${gid} not found in document ${sheetId}. Available gids: ${available}`);
  }
  await sheet.loadHeaderRow();
  docCache.set(cacheKey, { sheet, t: Date.now() });
  return sheet;
}

async function readRows(sheetId, gid) {
  const sheet = await getSheet(sheetId, gid);
  const rows = await sheet.getRows();
  return rows.map(r => {
    const obj = {};
    for (const h of sheet.headerValues) obj[h] = r.get(h);
    obj.__rowIndex = r.rowNumber;
    obj.__row = r;
    return obj;
  });
}

async function updateRow(row, updates) {
  for (const [k, v] of Object.entries(updates)) row.set(k, v);
  await row.save();
}

module.exports = { readRows, updateRow, getSheet };
