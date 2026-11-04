// Renders original, procedurally drawn SVG plants.
// renderPlant(species, progress 0..1, state 'growing' | 'grown' | 'withered')
// Coordinates inside shapes: origin at the base of the plant, negative y is up (max height ~150).

let uid = 0;
const BASE = { stem: '#4f9e5c', seed: '#8a5a3b', center: '#6b4426' };
const DEAD = { dead: true, leaf: '#a39478', leaf2: '#7d705a', trunk: '#6b5a48', accent: '#8c7f6a', fruit: '#8f826c',
  petal: '#9b8d74', center: '#5e5040', glow: '#b5a88f', stem: '#857660', seed: '#6b5a48' };

// ---------- primitives ----------
const circ = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const ell = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const hl = (x, y, r) => circ(x, y, r, '#fff', 'opacity=".25"');
const leaf = (x, y, a, len, w, fill) =>
  `<path d="M0 0 Q ${len / 2} ${-w} ${len} 0 Q ${len / 2} ${w} 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="${fill}"/>`;
const line = (d, stroke, w, extra = '') => `<path d="${d}" stroke="${stroke}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const trunk = (c, h = 62, w = 12) => `<path d="M${-w / 2} 0 L${-w / 2 + 2} ${-h} L${w / 2 - 2} ${-h} L${w / 2} 0Z" fill="${c.trunk}"/>`;
const star = (x, y, r, fill) =>
  `<path d="M${x} ${y - r}L${x + r * .3} ${y - r * .3}L${x + r} ${y}L${x + r * .3} ${y + r * .3}L${x} ${y + r}L${x - r * .3} ${y + r * .3}L${x - r} ${y}L${x - r * .3} ${y - r * .3}Z" fill="${fill}"/>`;
const pot = (c) => `<path d="M-30 0 L-35 -20 L35 -20 L30 0Z" fill="${c.accent}"/><rect x="-38" y="-26" width="76" height="8" rx="3" fill="${c.accent}"/><rect x="-38" y="-26" width="76" height="3" rx="1.5" fill="#fff" opacity=".25"/>`;

function cloud(c, y = -92, s = 1, front = c.leaf, back = c.leaf2) {
  const P = [[-30, 12, 28, 1], [30, 12, 28, 1], [0, 26, 30, 1], [0, 0, 38, 0], [-22, -22, 24, 0], [22, -20, 24, 0]];
  return P.map(([x, dy, r, b]) => circ(x * s, y + dy * s, r * s, b ? back : front)).join('') + hl(-14 * s, y - 20 * s, 11 * s);
}
const tiersPath = (c, top = c.accent) => `
  <polygon points="0,-90 -52,-24 52,-24" fill="${c.leaf2}"/>
  <polygon points="0,-120 -42,-62 42,-62" fill="${c.leaf}"/>
  <polygon points="0,-148 -30,-98 30,-98" fill="${top}"/>`;
function shroom(c, x, s, cap = c.leaf) {
  return `<g transform="translate(${x} 0) scale(${s})">
    <rect x="-13" y="-62" width="26" height="62" rx="9" fill="${c.trunk}"/>
    <path d="M-58 -56 Q 0 -138 58 -56 Z" fill="${cap}"/>
    ${line('M-58 -56 Q 0 -64 58 -56', c.leaf2, 4)}
    ${circ(-22, -82, 8, c.accent)}${circ(16, -96, 6, c.accent)}${circ(30, -70, 5, c.accent)}</g>`;
}

// ---------- shapes ----------
const SHAPES = {
  round: (c) => trunk(c) + circ(-26, -70, 26, c.leaf2) + circ(26, -70, 26, c.leaf2) + circ(0, -92, 40, c.leaf) + hl(-14, -104, 10),

  cloud: (c) => trunk(c, 60) + line('M0 -40 L-18 -62', c.trunk, 6) + cloud(c),

  fruit: (c) => trunk(c, 60) + cloud(c) +
    [[-28, -80], [18, -106], [32, -74], [-6, -68], [-16, -112], [8, -88], [-38, -100]]
      .map(([x, y]) => circ(x, y, 6.5, c.fruit) + circ(x - 2, y - 2, 2, '#fff', 'opacity=".5"')).join(''),

  maple: (c) => trunk(c, 60) + cloud(c, -92, 1, c.leaf, c.leaf2) + circ(10, -112, 14, c.accent) + circ(-30, -78, 12, c.accent) +
    leaf(-56, -22, 30, 13, 5, c.leaf2) + leaf(48, -40, -40, 12, 5, c.accent) + leaf(60, -10, 10, 11, 4, c.leaf),

  tiers: (c) => `<rect x="-6" y="-28" width="12" height="28" rx="3" fill="${c.trunk}"/>` + tiersPath(c) + hl(-8, -120, 6),

  snowy: (c) => `<rect x="-6" y="-28" width="12" height="28" rx="3" fill="${c.trunk}"/>` + tiersPath(c, c.leaf) + `
    <polygon points="0,-148 -11,-130 -4,-133 0,-128 5,-133 11,-130" fill="${c.accent}"/>
    <polygon points="0,-120 -14,-101 -6,-104 1,-99 7,-104 14,-101" fill="${c.accent}"/>
    <polygon points="0,-90 -17,-68 -8,-72 0,-66 8,-72 17,-68" fill="${c.accent}"/>
    ${circ(-34, -30, 3, c.accent)}${circ(28, -66, 3, c.accent)}${circ(-20, -104, 2.5, c.accent)}`,

  festive: (c) => `<rect x="-6" y="-28" width="12" height="28" rx="3" fill="${c.trunk}"/>` + tiersPath(c, c.leaf) +
    line('M-38 -40 Q 0 -30 34 -52', c.accent, 3) + line('M-28 -78 Q 0 -70 26 -88', c.accent, 3) +
    [[-30, -34, c.fruit], [8, -36, c.petal], [32, -44, c.fruit], [-20, -74, c.petal], [18, -80, c.fruit], [-6, -112, c.petal]]
      .map(([x, y, f]) => circ(x, y, 5.5, f) + circ(x - 1.5, y - 1.5, 1.6, '#fff', 'opacity=".6"')).join('') +
    star(0, -150, 12, c.accent),

  cypress: (c) => trunk(c, 22, 8) + ell(0, -82, 27, 70, c.leaf2) + ell(-5, -88, 18, 60, c.leaf) + hl(-10, -112, 7),

  birch: (c) => line('M0 -60 L-22 -86 M0 -70 L20 -94', c.trunk, 5) +
    `<rect x="-7" y="-92" width="14" height="92" rx="4" fill="${c.trunk}" stroke="${c.center}" stroke-opacity=".35" stroke-width="2"/>` +
    line('M-7 -16 h7 M1 -34 h6 M-7 -50 h5 M2 -64 h5', c.center, 3) +
    ell(-14, -96, 30, 34, c.leaf2) + ell(16, -102, 28, 32, c.leaf2) + ell(0, -116, 34, 34, c.leaf) + hl(-10, -130, 8),

  palm: (c) => line('M0 0 Q 16 -60 -2 -122', c.trunk, 12) + line('M0 0 Q 16 -60 -2 -122', c.center, 12, 'stroke-dasharray="2 9" opacity=".5"') +
    [-175, -145, -115, -80, -48, -15, 22, 158].map((a, i) => leaf(-2, -122, a, 56, 12, i % 2 ? c.leaf2 : c.leaf)).join('') +
    circ(-7, -114, 6.5, c.fruit) + circ(4, -112, 6.5, c.fruit) + circ(-1, -106, 6.5, c.fruit),

  willow: (c) => trunk(c, 80, 12) + line('M0 -70 L-20 -96 M0 -76 L22 -100', c.trunk, 6) + ell(0, -112, 44, 32, c.leaf2) +
    [-40, -30, -20, -10, 0, 10, 20, 30, 40].map((x, i) => {
      const y1 = -138 + Math.abs(x) * .55, x2 = x * 1.45, y2 = -22 - Math.abs(x) * .25 - (i % 3) * 10;
      return line(`M${x * .5} ${y1} Q ${x * 1.5} ${y1 + 6} ${x2} ${y2}`, i % 2 ? c.leaf : c.leaf2, 7) +
        circ(x2, y2, 3.5, c.accent) + circ(x * 1.42, y2 - 14, 3, c.accent);
    }).join('') + ell(0, -134, 26, 12, c.leaf) + hl(-10, -136, 6),

  bamboo: (c) => [[-20, 110], [0, 146], [20, 94]].map(([x, h]) => {
    let s = `<rect x="${x - 4.5}" y="${-h}" width="9" height="${h}" rx="4" fill="${c.leaf2}"/>`;
    for (let y = -22; y > -h + 6; y -= 22) s += `<rect x="${x - 5.5}" y="${y}" width="11" height="3" rx="1.5" fill="${c.trunk}"/>`;
    return s + leaf(x, -h + 18, -30, 30, 7, c.leaf) + leaf(x, -h + 40, -150, 26, 6, c.leaf) + leaf(x, -h + 64, -20, 22, 5, c.accent);
  }).join(''),

  sunflower: (c) => line('M0 0 Q 8 -60 0 -110', c.stem, 7) + leaf(2, -48, -20, 36, 11, c.stem) + leaf(3, -70, -160, 32, 10, c.stem) +
    Array.from({ length: 16 }, (_, i) => ell(0, -118, 6.5, 24, i % 2 ? c.leaf : c.leaf2, `transform="rotate(${i * 22.5} 0 -118)"`)).join('') +
    circ(0, -118, 14, c.center) + [[-5, -122], [4, -124], [0, -114], [6, -114], [-6, -113]].map(([x, y]) => circ(x, y, 1.8, c.accent)).join(''),

  tulips: (c) => [[-24, 70, c.leaf], [0, 98, c.petal], [24, 80, c.accent]].map(([x, h, f]) =>
    line(`M0 0 Q ${x / 2} ${-h / 2} ${x} ${-h}`, c.stem, 5) +
    `<path d="M-12 0 Q-14 -22 -7 -27 L0 -17 L7 -27 Q14 -22 12 0 Q0 8 -12 0Z" transform="translate(${x} ${-h + 6})" fill="${f}"/>` +
    hl(x - 5, -h - 6, 3)).join('') + leaf(0, -4, -125, 44, 10, c.stem) + leaf(0, -4, -55, 44, 10, c.stem),

  rosebush: (c) => [[-30, -34, 26, c.leaf2], [30, -34, 26, c.leaf2], [0, -52, 34, c.leaf], [-14, -28, 26, c.leaf], [16, -26, 24, c.leaf]]
    .map(([x, y, r, f]) => circ(x, y, r, f)).join('') +
    [[-30, -44], [4, -72], [32, -40], [-8, -34], [18, -58], [-22, -66]].map(([x, y]) =>
      circ(x, y, 9.5, c.petal) + `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="${c.accent}" stroke-width="2"/>`).join(''),

  lavender: (c) => leaf(0, -2, -150, 32, 7, c.stem) + leaf(0, -2, -30, 32, 7, c.stem) +
    [[-24, 70], [-12, 92], [0, 108], [12, 90], [24, 74]].map(([x, h]) => {
      let s = line(`M0 0 Q ${x * .6} ${-h / 2} ${x} ${-h + 30}`, c.stem, 3);
      for (let k = 0; k < 7; k++) s += ell(x, -h + k * 6, 4.5, 5.5, k % 2 ? c.leaf : c.leaf2);
      return s;
    }).join(''),

  pumpkin: (c) => line('M-50 -4 Q -30 -20 -10 -6 T 40 -8', c.stem, 3) + leaf(-40, -10, -140, 22, 8, c.stem) +
    ell(-22, -32, 22, 30, c.leaf2) + ell(22, -32, 22, 30, c.leaf2) + ell(0, -32, 24, 33, c.leaf) +
    `<rect x="-4" y="-72" width="8" height="12" rx="3" fill="${c.trunk}"/>` + leaf(4, -64, -25, 26, 8, c.stem) +
    line('M-4 -66 q -10 -6 -6 -14 q 4 -6 8 0', c.stem, 2) + hl(-8, -48, 6),

  ballcactus: (c) => circ(0, -40, 40, c.leaf) +
    [12, 26].map((r) => `<ellipse cx="0" cy="-40" rx="${r}" ry="40" fill="none" stroke="${c.leaf2}" stroke-width="2"/>`).join('') +
    [[-30, -50], [-18, -70], [18, -70], [30, -50], [0, -78], [-34, -28], [34, -28]].map(([x, y]) => circ(x, y, 1.6, '#fff')).join('') +
    [-90, -18, 54, 126, 198].map((a) => leaf(0, -82, a, 15, 6, c.accent)).join('') + circ(0, -82, 4, c.petal) + hl(-14, -56, 9),

  cactus: (c) => `
    <rect x="-40" y="-78" width="14" height="38" rx="7" fill="${c.leaf2}"/>
    <rect x="-40" y="-52" width="30" height="14" rx="7" fill="${c.leaf2}"/>
    <rect x="26" y="-98" width="14" height="44" rx="7" fill="${c.leaf2}"/>
    <rect x="10" y="-68" width="30" height="14" rx="7" fill="${c.leaf2}"/>
    <rect x="-16" y="-112" width="32" height="112" rx="16" fill="${c.leaf}"/>` +
    line('M0 -100 L0 -8', c.leaf2, 2) + circ(0, -114, 7, c.accent) + hl(-7, -92, 5),

  succulent: (c) => [-170, -140, -110, -70, -40, -10].map((a) => leaf(0, -8, a, 48, 15, c.leaf2)).join('') +
    [-155, -125, -90, -55, -25].map((a) => leaf(0, -8, a, 36, 12, c.leaf)).join('') +
    [-120, -90, -60].map((a) => leaf(0, -8, a, 22, 8, c.accent)).join(''),

  baobab: (c) => `<path d="M-24 0 Q-12 -40 -16 -80 L16 -80 Q12 -40 24 0Z" fill="${c.trunk}"/>` +
    line('M-10 -78 L-34 -100 M10 -78 L36 -98 M0 -78 L0 -104', c.trunk, 6) +
    ell(-40, -100, 28, 13, c.leaf2) + ell(40, -98, 28, 13, c.leaf2) + ell(0, -108, 32, 14, c.leaf2) +
    ell(-38, -104, 22, 9, c.leaf) + ell(38, -102, 22, 9, c.leaf) + ell(0, -113, 26, 9, c.leaf) +
    line('M-16 -20 q 4 -10 0 -24', c.center, 2, 'opacity=".4"'),

  bonsai: (c) => pot(c) + line('M-2 -24 C -22 -44, 26 -58, 0 -82 C -12 -94, -6 -102, 4 -110', c.trunk, 10) +
    line('M-6 -40 L-30 -58 M10 -66 L30 -84', c.trunk, 6) +
    [[-32, -62, 26], [32, -88, 28], [2, -116, 32]].map(([x, y, rx]) =>
      ell(x, y, rx, 13, c.leaf2) + ell(x - 2, y - 4, rx - 6, 9, c.leaf) + hl(x - 8, y - 6, 4)).join(''),

  topiary: (c) => pot(c) + `<rect x="-3" y="-60" width="6" height="40" fill="${c.trunk}"/>` +
    circ(0, -56, 22, c.leaf2) + circ(0, -96, 26, c.leaf) + circ(0, -134, 16, c.leaf2) +
    hl(-8, -62, 6) + hl(-9, -104, 7) + hl(-5, -139, 4) +
    [[-14, -88], [12, -100], [4, -82], [-6, -132], [14, -50]].map(([x, y]) => circ(x, y, 3.2, c.petal)).join(''),

  blossom: (c) => line('M0 0 C -4 -30, 6 -50, 0 -70', c.trunk, 10) + line('M2 -45 L24 -62 M0 -58 L-22 -74', c.trunk, 6) +
    circ(-26, -84, 26, c.leaf2) + circ(26, -78, 24, c.leaf2) + circ(0, -102, 32, c.leaf) + hl(-12, -114, 8) +
    [[-14, -110], [12, -96], [-30, -80], [30, -74], [0, -82], [-4, -126], [20, -112]].map(([x, y]) => circ(x, y, 4, c.accent)).join('') +
    leaf(-44, -18, 20, 8, 4, c.leaf) + leaf(40, -30, -30, 8, 4, c.leaf),

  mushroom: (c) => shroom(c, 0, 1),
  shrooms: (c) => shroom(c, -34, .55, c.petal) + shroom(c, 34, .65, c.fruit) + shroom(c, 0, .95),

  lollipop: (c) => `<rect x="-3.5" y="-92" width="7" height="92" rx="3" fill="${c.trunk}"/>` +
    line('M-3.5 -20 l7 -6 M-3.5 -44 l7 -6 M-3.5 -68 l7 -6', c.petal, 2.5) +
    circ(0, -116, 36, c.leaf) +
    line('M-4 -116 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0 a20 20 0 1 1 40 0 a24 24 0 1 1 -48 0', c.accent, 6) +
    hl(-14, -130, 8) + `<path d="M0 -80 L-16 -90 L-16 -70Z M0 -80 L16 -90 L16 -70Z" fill="${c.petal}"/>` + circ(0, -80, 4, c.petal),

  crystal: (c, L) => trunk(c, 40, 10) +
    [['0,-152 -18,-104 0,-60 18,-104'], ['-32,-124 -48,-86 -30,-52 -14,-88'], ['32,-118 14,-86 30,-52 48,-88'], ['-12,-74 -26,-50 -6,-36 6,-56'], ['14,-72 4,-52 20,-38 30,-56']]
      .map(([p]) => `<polygon points="${p}" fill="${L}" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>`).join('') +
    line('M0 -150 L0 -62 M-32 -122 L-30 -54 M32 -116 L30 -54', '#fff', 1.2, 'opacity=".5"') + star(-10, -128, 5, '#fff') + star(36, -92, 4, '#fff'),

  nightglow: (c, L, R) => circ(0, -92, 70, R) + trunk(c, 60) + cloud(c) +
    [[-24, -112, 6], [16, -100, 7], [30, -76, 4.5], [-34, -78, 5], [2, -128, 4.5], [-6, -80, 4]].map(([x, y, r]) => star(x, y, r, c.accent)).join('') +
    [[-14, -96], [22, -120], [10, -70], [-40, -98]].map(([x, y]) => circ(x, y, 1.6, c.accent)).join(''),

  rainbow: (c) => {
    const cols = c.dead ? [c.leaf, c.leaf2, c.accent, c.leaf, c.leaf2, c.accent] : ['#ef5a5a', '#f59a3c', '#f6d04d', '#5cc46a', '#4fa3e0', '#9a6ad8'];
    return cols.map((col, i) => { const r = 66 - i * 8.5; return line(`M${-r} -36 A ${r} ${r} 0 0 1 ${r} -36`, col, 9); }).join('') +
      [-1, 1].map((s) => circ(s * 54, -34, 13, c.accent) + circ(s * 68, -30, 10, c.accent) + circ(s * 42, -28, 10, c.accent) + ell(s * 56, -22, 26, 8, c.accent)).join('');
  },

  coral: (c) => line('M0 0 L0 -60 L-26 -96 L-34 -126 M-26 -96 L-8 -122 M0 -60 L24 -92 L20 -130 M24 -92 L46 -112', c.leaf, 11) +
    line('M0 -28 L-30 -48 L-50 -66 M-30 -48 L-34 -76 M0 -40 L32 -58 L54 -70', c.leaf2, 8) +
    [[-34, -126], [-8, -122], [20, -130], [46, -112], [-50, -66], [-34, -76], [54, -70]].map(([x, y], i) => circ(x, y, i < 4 ? 8 : 6, c.accent)).join(''),

  lantern: (c, L, R) => line('M0 0 Q -6 -60 10 -110 Q 30 -130 58 -116', c.trunk, 9) + line('M2 -70 Q -30 -98 -56 -86', c.trunk, 6) +
    [[16, -118, -40], [36, -124, -10], [-20, -88, -150], [-40, -92, -170], [4, -100, -120], [48, -122, 20]].map(([x, y, a]) => leaf(x, y, a, 18, 6, c.leaf)).join('') +
    [[-52, -86], [-26, -94], [24, -122], [56, -116]].map(([x, y]) =>
      line(`M${x} ${y} L${x} ${y + 16}`, c.trunk, 1.5) + circ(x, y + 26, 18, R) +
      `<rect x="${x - 7}" y="${y + 16}" width="14" height="19" rx="6" fill="${c.fruit}"/>` +
      `<rect x="${x - 4}" y="${y + 14}" width="8" height="3" fill="${c.center}"/>` + circ(x - 2, y + 22, 2, '#fff', 'opacity=".6"')).join(''),

  balloon: (c) => line('M0 0 L0 -26', c.stem, 4) + leaf(0, -18, -60, 22, 7, c.stem) + leaf(0, -18, -120, 22, 7, c.stem) +
    [[-30, -118, c.fruit], [2, -140, c.petal], [30, -112, c.leaf]].map(([x, y, f]) =>
      line(`M0 -26 Q ${x * .3} ${(y - 26) / 2} ${x} ${y + 20}`, c.trunk, 1.5) +
      ell(x, y, 17, 21, f) + `<path d="M${x - 4} ${y + 24} L${x + 4} ${y + 24} L${x} ${y + 19}Z" fill="${f}"/>` + hl(x - 6, y - 8, 5)).join(''),

  heart: (c) => trunk(c, 60) + line('M0 -50 L-16 -66 M0 -46 L16 -62', c.trunk, 5) +
    `<path d="M0 -40 C -78 -84 -64 -158 0 -124 C 64 -158 78 -84 0 -40Z" fill="${c.leaf2}"/>` +
    `<path d="M0 -52 C -60 -88 -50 -146 0 -118 C 50 -146 60 -88 0 -52Z" fill="${c.leaf}"/>` + hl(-24, -116, 9) +
    circ(16, -96, 4, c.accent) + circ(-10, -84, 3, c.accent) + circ(26, -120, 3, c.accent),

  aurora: (c, L) => trunk(c, 52, 10) + ell(0, -98, 42, 60, L) +
    line('M-26 -120 Q -10 -100 -24 -72 M2 -150 Q 16 -116 4 -80 M24 -128 Q 34 -104 26 -82', '#fff', 3, 'opacity=".3"') + hl(-14, -128, 8),

  cloudpuff: (c) => trunk(c, 60) + cloud(c, -96, 1.05) +
    [[-46, -40], [-34, -24], [44, -46], [36, -26], [50, -14]].map(([x, y]) => `<path d="M${x} ${y - 6} Q ${x + 4} ${y} ${x} ${y + 3} Q ${x - 4} ${y} ${x} ${y - 6}Z" fill="${c.fruit}"/>`).join(''),
};

// ---------- growth stages ----------
const seed = (c) => ell(0, -4, 14, 7, c.seed) + line('M0 -8 q 3 -8 8 -9', c.stem, 3);
const sprout = (c, t) => {
  const h = 18 + 30 * t;
  return line(`M0 0 L0 ${-h}`, c.stem, 5) + leaf(0, -h + 2, -150, 20, 7, c.stem) + leaf(0, -h, -30, 20, 7, c.stem);
};

// opts.ground = false omits the grass patch (used when placing plants in the garden scene).
export function renderPlant(species, progress = 1, state = 'growing', opts = {}) {
  const p = Math.max(0, Math.min(1, progress));
  const dead = state === 'withered';
  const sc = species.colors;
  const c = dead ? DEAD : { ...BASE, fruit: sc.accent, petal: sc.accent, glow: sc.accent, ...sc };
  const id = `pl${++uid}`;
  const L = `url(#${id}l)`, R = `url(#${id}r)`;
  let body, scale = 1;
  if (p < 0.12) body = seed(c);
  else if (p < 0.35) body = sprout(c, (p - 0.12) / 0.23);
  else { body = SHAPES[species.shape](c, L, R); scale = 0.5 + 0.5 * ((p - 0.35) / 0.65); }
  const tilt = dead ? ' rotate(-10)' : '';
  const ground = dead ? '#b9aa8f' : '#93cf7e';
  const tuft = dead ? '#a3937a' : '#6fb85e';
  return `<svg viewBox="0 0 200 200" class="plant ${state}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${species.name} (${state})">
    <defs>
      <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.accent}"/><stop offset=".55" stop-color="${c.leaf}"/><stop offset="1" stop-color="${c.leaf2}"/></linearGradient>
      <radialGradient id="${id}r"><stop offset="0" stop-color="${c.glow}" stop-opacity=".75"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></radialGradient>
    </defs>
    ${opts.ground === false ? '' : `<ellipse cx="100" cy="174" rx="72" ry="14" fill="${ground}"/>
    <path d="M44 174 l3 -7 l2 7 M150 176 l3 -8 l3 8 M128 182 l2 -5 l2 5" stroke="${tuft}" stroke-width="2" fill="none" stroke-linecap="round"/>`}
    <g transform="translate(100 172)${tilt} scale(${scale.toFixed(3)})">${body}</g>
  </svg>`;
}

export const SHAPE_NAMES = Object.keys(SHAPES);
