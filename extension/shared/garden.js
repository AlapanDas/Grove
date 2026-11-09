// Garden: an isometric island that fills with the plants from a time period.
import { speciesById } from './species.js';
import { renderPlant } from './plant.js';

const DAY = 86400000;
const MAX_SIDE = 20; // at most 400 plots

// Scene colors read CSS variables from ui.css (so the garden follows light/dark mode), with fallbacks for standalone SVGs.
const GRASS_A = 'fill="#9ad985" style="fill:var(--grass-a,#9ad985)"';
const GRASS_B = 'fill="#8fd07a" style="fill:var(--grass-b,#8fd07a)"';
const STARS = [[60, 40, 1.6], [120, 110, 1.2], [210, 30, 1.8], [300, 80, 1.1], [380, 26, 1.5], [460, 64, 1.3], [520, 20, 1.1],
  [610, 120, 1.4], [760, 140, 1.2], [770, 30, 1.6], [40, 150, 1.1], [250, 140, 1.3]];

// ---------- periods ----------
export const RANGES = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', all: 'All time' };

// Returns { from, to, label } for a range shifted by `offset` periods (0 = current, -1 = previous, ...).
export function periodBounds(range, offset = 0, now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  let from, to, label;
  if (range === 'day') {
    from = new Date(y, m, d + offset); to = new Date(y, m, d + offset + 1);
    label = offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : from.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } else if (range === 'week') {
    const monday = d - ((now.getDay() + 6) % 7);
    from = new Date(y, m, monday + offset * 7); to = new Date(y, m, monday + offset * 7 + 7);
    const fmt = (t) => t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    label = offset === 0 ? 'This week' : `${fmt(from)} – ${fmt(new Date(to - DAY))}`;
  } else if (range === 'month') {
    from = new Date(y, m + offset, 1); to = new Date(y, m + offset + 1, 1);
    label = from.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } else if (range === 'year') {
    from = new Date(y + offset, 0, 1); to = new Date(y + offset + 1, 0, 1);
    label = String(y + offset);
  } else {
    return { from: -Infinity, to: Infinity, label: 'All time' };
  }
  return { from: +from, to: +to, label };
}

export const sessionsIn = (sessions, { from, to }) => sessions.filter((s) => s.end >= from && s.end < to);

// ---------- scene ----------
// Renders the island as an SVG string. opts.minSide sets the smallest grid (an empty garden still shows plots).
export function renderGarden(sessions, opts = {}) {
  const W = 800, H = opts.height || 470;
  const list = sessions.slice(-MAX_SIDE * MAX_SIDE);
  const n = Math.min(MAX_SIDE, Math.max(opts.minSide || 4, Math.ceil(Math.sqrt(list.length))));
  const tw = Math.min(120, 640 / n), th = tw / 2, depth = Math.max(10, tw * .28);
  const cx = W / 2, top = (H - n * th - depth) / 2 + (opts.compact ? 10 : 30);
  const pos = (i, j) => [cx + (i - j) * tw / 2, top + (i + j) * th / 2];

  // Island body: two side faces under the diamond.
  const [lx, ly] = pos(0, n), [bx, by] = pos(n, n), [rx, ry] = pos(n, 0);
  let svg = `
    <defs>
      <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe6ff" style="stop-color:var(--sky-top,#bfe6ff)"/><stop offset="1" stop-color="#f4f1e8" style="stop-color:var(--sky-bottom,#f4f1e8)"/></linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#gsky)"/>
    <g fill="#fff" style="opacity:var(--stars,0)">${STARS.map(([x, y, r]) => `<circle cx="${x}" cy="${y * (opts.compact ? .6 : 1)}" r="${r}"/>`).join('')}</g>
    ${opts.compact ? '' : `<circle cx="700" cy="70" r="34" fill="#ffe28a" style="fill:var(--sun,#ffe28a)"/><circle cx="700" cy="70" r="48" fill="#ffe28a" style="fill:var(--sun,#ffe28a);opacity:var(--halo,.3)"/>
    <g fill="#fff" opacity=".85" style="fill:var(--cloud,#fff);opacity:var(--cloud-op,.85)"><ellipse cx="140" cy="70" rx="46" ry="16"/><ellipse cx="170" cy="60" rx="30" ry="16"/><ellipse cx="560" cy="110" rx="38" ry="12"/><ellipse cx="586" cy="102" rx="24" ry="12"/></g>`}
    <polygon points="${lx},${ly} ${bx},${by} ${bx},${by + depth} ${lx},${ly + depth}" fill="#a87b52" style="fill:var(--soil-a,#a87b52)"/>
    <polygon points="${bx},${by} ${rx},${ry} ${rx},${ry + depth} ${bx},${by + depth}" fill="#8a6142" style="fill:var(--soil-b,#8a6142)"/>
    <path d="M${lx} ${ly + depth * .45} L${bx} ${by + depth * .45} L${rx} ${ry + depth * .45}" stroke="#6e4a30" stroke-width="2" fill="none" opacity=".35"/>`;

  // Grass tiles, checkerboard.
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const [x, y] = pos(i, j);
    svg += `<polygon points="${x},${y} ${x + tw / 2},${y + th / 2} ${x},${y + th} ${x - tw / 2},${y + th / 2}" ${(i + j) % 2 ? GRASS_B : GRASS_A}/>`;
  }

  // Plots in back-to-front order, so later (front) plants overlap earlier ones correctly.
  const cells = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cells.push([i, j]);
  cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);

  const size = tw * 1.35;
  list.forEach((s, k) => {
    const [i, j] = cells[k];
    const [x, y] = pos(i, j);
    const baseY = y + th / 2;
    const sp = speciesById(s.species);
    const plant = renderPlant(sp, 1, s.status === 'success' ? 'grown' : 'withered', { ground: false })
      .replace('<svg ', `<svg x="${x - size / 2}" y="${baseY - size * 172 / 200}" width="${size}" height="${size}" `);
    const when = new Date(s.end).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    svg += `<g class="gplant"><title>${sp.name} · ${s.minutes} min${s.tag ? ` · ${s.tag}` : ''} · ${s.status === 'success' ? 'grown' : 'withered'} · ${when}</title>
      <ellipse cx="${x}" cy="${baseY}" rx="${tw * .22}" ry="${th * .2}" fill="#000" opacity=".12"/>${plant}</g>`;
  });

  if (!list.length) svg += `<text x="${cx}" y="${top + n * th / 2 + 6}" text-anchor="middle" font-size="${opts.compact ? 26 : 20}" fill="#2f6e3c" style="fill:var(--scene-text,#2f6e3c)" font-family="system-ui, sans-serif" font-weight="600">${opts.emptyText || 'Nothing planted yet'}</text>`;

  return `<svg class="garden-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Garden with ${list.length} plants">${svg}</svg>`;
}
