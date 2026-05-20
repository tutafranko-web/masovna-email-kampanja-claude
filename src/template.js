const path = require('path');

const TEMPLATES = {};
function loadTemplates(industryKey) {
  if (!TEMPLATES[industryKey]) {
    TEMPLATES[industryKey] = require(path.resolve(__dirname, '..', 'templates', `${industryKey}.js`));
  }
  return TEMPLATES[industryKey];
}

function interpolate(tpl, vars) {
  return String(tpl).replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] !== undefined ? String(vars[k]) : m);
}

function buildEmail(row, industry, globals) {
  const T = loadTemplates(industry.key);
  const step = Number(row.email_step || 0);
  const variant = row.email_variant || 'V9';
  const emailKey = ['E1', 'E2', 'E3', 'E4'][step];

  let tpl;
  if (emailKey === 'E1') tpl = T.E1[variant] || T.E1.V9;
  else if (emailKey === 'E2') tpl = T.E2.DEFAULT;
  else if (emailKey === 'E3') tpl = T.E3[variant] || T.E3.V9;
  else if (emailKey === 'E4') tpl = T.E4.DEFAULT;
  else throw new Error('Invalid step: ' + step);

  const phone = String(row.phone || '').replace(/[\s-]/g, '');
  const phoneIntl = phone.startsWith('+')
    ? phone.substring(1)
    : phone.startsWith('00')
      ? phone.substring(2)
      : '385' + (phone.startsWith('0') ? phone.substring(1) : phone);

  const vars = {
    title: row.title || '',
    website: row.website || '',
    website_status: row.website_status || '',
    Grad: row.Grad || '',
    Kategorija_lc: String(row.Kategorija || industry.label).toLowerCase(),
    review_count: row.review_count || '',
    review_rating: row.review_rating || '',
    phone: row.phone || '',
    phone_clean: phone,
    phone_intl: phoneIntl,
    pagespeed_mobile: row.pagespeed_mobile || '',
    sender_ime: globals.sender_ime,
    industry_label: industry.label,
    calendly_url: globals.calendly_url
  };

  const emails = String(row.all_emails || '').split(',').map(e => e.trim()).filter(Boolean);
  const toEmail = emails[0] || '';

  return {
    to: toEmail,
    subject: interpolate(tpl.subject, vars),
    body: interpolate(tpl.body, vars),
    emailKey,
    nextStep: step + 1
  };
}

module.exports = { buildEmail };
