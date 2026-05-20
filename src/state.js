const fs = require('fs');
const path = require('path');

const STATE_PATH = path.resolve(__dirname, '..', 'state', 'today.json');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function load(industryKeys) {
  let data = { date: todayStr(), sent: {} };
  if (fs.existsSync(STATE_PATH)) {
    try {
      data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      console.warn('State file corrupted, resetting:', e.message);
    }
  }
  if (data.date !== todayStr()) {
    data = { date: todayStr(), sent: {} };
  }
  for (const k of industryKeys) {
    if (typeof data.sent[k] !== 'number') data.sent[k] = 0;
  }
  return data;
}

function save(data) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(data, null, 2));
}

function increment(data, industryKey) {
  data.sent[industryKey] = (data.sent[industryKey] || 0) + 1;
  save(data);
}

module.exports = { load, save, increment };
