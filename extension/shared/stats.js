const DAY = 86400000;
export const dayKey = (t) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function summarize(sessions, now = Date.now()) {
  const grown = sessions.filter((s) => s.status === 'success');
  const byDay = {};
  const byTag = {};
  let totalMinutes = 0;
  for (const s of grown) {
    totalMinutes += s.minutes;
    const k = dayKey(s.end);
    byDay[k] = (byDay[k] || 0) + s.minutes;
    const t = s.tag || 'Untagged';
    byTag[t] = (byTag[t] || 0) + s.minutes;
  }
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const t = now - i * DAY;
    last7.push({ label: new Date(t).toLocaleDateString(undefined, { weekday: 'short' }), minutes: byDay[dayKey(t)] || 0 });
  }
  let streak = 0;
  let t = now;
  if (!byDay[dayKey(t)]) t -= DAY; // today not done yet doesn't break the streak
  while (byDay[dayKey(t)]) { streak++; t -= DAY; }

  // Best streak ever: walk forward from every day whose previous day is empty.
  const nextKey = (k, delta) => { const [y, m, d] = k.split('-').map(Number); return dayKey(new Date(y, m - 1, d + delta)); };
  let bestStreak = 0;
  for (const k of Object.keys(byDay)) {
    if (byDay[nextKey(k, -1)]) continue;
    let n = 0, cur = k;
    while (byDay[cur]) { n++; cur = nextKey(cur, 1); }
    bestStreak = Math.max(bestStreak, n);
  }
  const longestSession = grown.reduce((m, s) => Math.max(m, s.minutes), 0);

  return { totalMinutes, grownCount: grown.length, witheredCount: sessions.length - grown.length, byTag, last7, streak, bestStreak, longestSession };
}

export const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
export const fmtClock = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
