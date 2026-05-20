const CHATBOT_INDUSTRIES = ['hotel', 'restoran', 'klinika', 'salon', 'autosalon', 'stomatologija', 'estetska', 'beauty', 'liecnicke', 'hoteli'];

function pickVariant(r, industry) {
  let variant = 'V9';
  if (r.website_status && String(r.website_status) !== '200') variant = 'V1';
  else if (r.has_website === 'no') variant = 'V2';
  else if (r.is_https === 'no' && Number(r.pagespeed_mobile) < 30) variant = 'V3';
  else if (Number(r.total_pages) === 0 || r.has_sitemap === 'no') variant = 'V4';
  else if (r.has_ga === 'no' && r.has_pixel === 'no') variant = 'V5';
  else if (r.has_chatbot === 'no' && CHATBOT_INDUSTRIES.includes(String(industry).toLowerCase())) variant = 'V6';
  else if (Number(r.pagespeed_mobile) < 50 && Number(r.health_score) < 60) variant = 'V7';
  else if (r.has_meta_desc === 'no' || r.has_og_tags === 'no' || r.has_schema === 'no') variant = 'V8';
  return variant;
}

module.exports = { pickVariant };
