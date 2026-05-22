const DELAY_DAYS = [0, 3, 4, 7];

function filterEligible(rows, dailyLimit) {
  const now = new Date();
  const eligible = rows.filter(r => {
    const emailFound = String(r.email_found || '').trim();
    if (!emailFound || emailFound.toLowerCase() === 'no') return false;
    const verified = String(r.email_verified || '').trim().toLowerCase();
    if (verified === 'no') return false;
    const allEmails = String(r.all_emails || '').trim();
    if (!allEmails.includes('@')) return false;
    const status = String(r.email_status || 'active').toLowerCase();
    if (status !== 'active' && status !== '') return false;
    const step = Number(r.email_step || 0);
    if (step >= 4) return false;
    if (r.email_last_sent_at) {
      const lastSent = new Date(r.email_last_sent_at);
      const daysSince = (now - lastSent) / (1000 * 60 * 60 * 24);
      if (daysSince < DELAY_DAYS[step]) return false;
    }
    return true;
  });

  const newE1s = eligible.filter(r => Number(r.email_step || 0) === 0);
  const followUps = eligible.filter(r => Number(r.email_step || 0) >= 1);
  const cappedE1 = newE1s.slice(0, dailyLimit);
  return [...followUps, ...cappedE1];
}

module.exports = { filterEligible };
