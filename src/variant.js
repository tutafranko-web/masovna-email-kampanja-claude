const CHATBOT_INDUSTRIES = ['hotel', 'restoran', 'klinika', 'salon', 'autosalon', 'stomatologija', 'estetska', 'beauty', 'liecnicke', 'hoteli'];

function num(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function pickVariant(r, industry) {
  let variant = 'V9';
  const pagespeed = num(r.pagespeed_mobile);
  const health = num(r.health_score);
  if (r.website_status && String(r.website_status) !== '200') variant = 'V1';
  else if (r.has_website === 'no') variant = 'V2';
  else if (r.is_https === 'no' && pagespeed !== null && pagespeed < 30) variant = 'V3';
  else if (r.has_sitemap === 'no') variant = 'V4';
  else if (r.has_ga === 'no' && r.has_pixel === 'no') variant = 'V5';
  else if (r.has_chatbot === 'no' && CHATBOT_INDUSTRIES.includes(String(industry).toLowerCase())) variant = 'V6';
  else if (pagespeed !== null && pagespeed < 50 && health !== null && health < 60) variant = 'V7';
  else if (r.has_meta_desc === 'no' || r.has_og_tags === 'no' || r.has_schema === 'no') variant = 'V8';
  return variant;
}

module.exports = { pickVariant };
