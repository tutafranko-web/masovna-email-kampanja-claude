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

async function ensureColumn(sheetId, gid, columnName) {
  const sheet = await getSheet(sheetId, gid);
  if (sheet.headerValues.includes(columnName)) return sheet.headerValues.indexOf(columnName);
  const newColIndex = sheet.headerValues.length;
  if (sheet.columnCount < newColIndex + 1) {
    await sheet.resize({ rowCount: sheet.rowCount, columnCount: newColIndex + 1 });
  }
  const newHeaders = [...sheet.headerValues, columnName];
  await sheet.setHeaderRow(newHeaders);
  docCache.delete(`${sheetId}:${gid}`);
  const fresh = await getSheet(sheetId, gid);
  return fresh.headerValues.indexOf(columnName);
}

async function bulkUpdateColumn(sheetId, gid, columnName, rowValues) {
  // rowValues: Map<rowNumber (1-indexed), string value>
  const colIndex = await ensureColumn(sheetId, gid, columnName);
  const sheet = await getSheet(sheetId, gid);
  const rowNums = Array.from(rowValues.keys()).sort((a, b) => a - b);
  if (!rowNums.length) return 0;
  const minRow = rowNums[0];
  const maxRow = rowNums[rowNums.length - 1];
  await sheet.loadCells({
    startRowIndex: minRow - 1,
    endRowIndex: maxRow,
    startColumnIndex: colIndex,
    endColumnIndex: colIndex + 1
  });
  let updated = 0;
  for (const [rowNum, value] of rowValues.entries()) {
    const cell = sheet.getCell(rowNum - 1, colIndex);
    if (cell.value !== value) {
      cell.value = value;
      updated++;
    }
  }
  if (updated > 0) await sheet.saveUpdatedCells();
  return updated;
}

module.exports = { readRows, updateRow, getSheet, ensureColumn, bulkUpdateColumn, getAuth };
