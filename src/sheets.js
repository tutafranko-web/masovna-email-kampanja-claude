const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.resolve(__dirname, '..', 'credentials', 'service-account.json');

let jwtClient = null;
function getAuth() {
  if (jwtClient) return jwtClient;
  if (!fs.existsSync(SA_PATH)) {
    throw new Error(`Service account JSON not found at ${SA_PATH}. See CREDENTIALS_SETUP.md.`);
  }
  const sa = JSON.parse(fs.readFileSync(SA_PATH, 'utf8'));
  jwtClient = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  return jwtClient;
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
