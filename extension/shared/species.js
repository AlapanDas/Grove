// Original, procedurally drawn plant species. Most are free; a few are earned through focus milestones (UNLOCKS).
// colors: leaf, leaf2 (shade), trunk, accent; optional fruit, petal, center, stem, glow.
export const RARITY = {
  free: { label: 'Free', color: '#3f8f4f', note: 'Always yours. Plant any of these.' },
  rare: { label: 'Rare', color: '#9a4fd0', note: 'Earned by hitting focus milestones.' },
  epic: { label: 'Epic', color: '#e0802a', note: 'The hardest milestones. Show-off plants.' },
};

// Milestones for earnable species. type: grown (plants grown), hours (total focus), streak (best day streak), session (longest single session, minutes)
const UNLOCKS = {
  lantern:   { rarity: 'rare', type: 'grown',   target: 5,  label: 'Grow 5 plants' },
  sakura:    { rarity: 'rare', type: 'streak',  target: 3,  label: 'Reach a 3-day streak' },
  ember:     { rarity: 'rare', type: 'session', target: 90, label: 'Finish a 90-minute session' },
  crystal:   { rarity: 'rare', type: 'hours',   target: 5,  label: 'Focus 5 hours in total' },
  nightglow: { rarity: 'rare', type: 'grown',   target: 25, label: 'Grow 25 plants' },
  aurora:    { rarity: 'epic', type: 'streak',  target: 7,  label: 'Reach a 7-day streak' },
  galaxy:    { rarity: 'epic', type: 'hours',   target: 25, label: 'Focus 25 hours in total' },
  rainbow:   { rarity: 'epic', type: 'grown',   target: 50, label: 'Grow 50 plants' },
};

const S = (id, name, shape, colors) => ({ id, name, shape, colors, rarity: 'free' });

const ALL = [
  S('sprig',     'Sprig',        'round',     { leaf: '#5fb36a', leaf2: '#3f8f4f', trunk: '#8a5a3b', accent: '#7cc47f' }),
  S('spire',     'Spire',        'tiers',     { leaf: '#3e9b6b', leaf2: '#2c7a52', trunk: '#7a4f33', accent: '#58b884' }),
  S('meadow',    'Meadow Oak',   'cloud',     { leaf: '#7ccf6a', leaf2: '#4fa451', trunk: '#8a5a3b', accent: '#9be08a' }),

  S('prickle',   'Prickle',      'cactus',    { leaf: '#6bb36b', leaf2: '#4e944f', trunk: '#4e944f', accent: '#f28fb0' }),
  S('pincushion','Pincushion',   'ballcactus',{ leaf: '#58b37e', leaf2: '#3a8a5c', trunk: '#3a8a5c', accent: '#ff7aa8', petal: '#ffd166' }),
  S('rosette',   'Rosette',      'succulent', { leaf: '#8fd3b0', leaf2: '#5aa889', trunk: '#5aa889', accent: '#f7a8c4' }),
  S('slender',   'Slender Cypress','cypress', { leaf: '#4dae7a', leaf2: '#2e7f57', trunk: '#7a4f33', accent: '#6cc795' }),
  S('silverbark','Silverbark',   'birch',     { leaf: '#b6dc5a', leaf2: '#88b63c', trunk: '#f3efe4', accent: '#d2ec84', center: '#4a4a4a' }),
  S('trio',      'Bamboo Trio',  'bamboo',    { leaf: '#7fd17a', leaf2: '#58b45e', trunk: '#3e8a46', accent: '#a7e39b' }),
  S('sunny',     'Sunny',        'sunflower', { leaf: '#ffd23f', leaf2: '#ffb627', trunk: '#8a5a3b', accent: '#ffe48a', center: '#6b4426' }),
  S('tulipa',    'Tulip Trio',   'tulips',    { leaf: '#ff5d73', leaf2: '#d93f57', trunk: '#3f8f4f', accent: '#ffb627', petal: '#c86bfa' }),
  S('lavish',    'Lavish Lavender','lavender',{ leaf: '#a77bdb', leaf2: '#8656c4', trunk: '#5a8f5c', accent: '#c7a4f0' }),
  S('apple',     'Orchard Apple','fruit',     { leaf: '#69c26a', leaf2: '#479c4c', trunk: '#8a5a3b', accent: '#8fd88a', fruit: '#e8413c' }),
  S('lemon',     'Zesty Lemon',  'fruit',     { leaf: '#5fb36a', leaf2: '#3f8f4f', trunk: '#8a5a3b', accent: '#7cc47f', fruit: '#ffe14d' }),
  S('patch',     'Pumpkin Patch','pumpkin',   { leaf: '#ff9a3c', leaf2: '#e9761f', trunk: '#6b4426', accent: '#ffc07a' }),

  S('blush',     'Blush',        'blossom',   { leaf: '#f5a9c4', leaf2: '#e57fa6', trunk: '#7d5240', accent: '#fff1f6' }),
  S('snowblush', 'Snow Blossom', 'blossom',   { leaf: '#ffffff', leaf2: '#e6e9f5', trunk: '#5e4636', accent: '#ffc4d8' }),
  S('capling',   'Capling',      'mushroom',  { leaf: '#e0533f', leaf2: '#b83d2c', trunk: '#f3e9d2', accent: '#ffffff' }),
  S('toadhollow','Toad Hollow',  'shrooms',   { leaf: '#4f8ef7', leaf2: '#2f6bd0', trunk: '#f6eedc', accent: '#ffffff', petal: '#ff8a3c', fruit: '#c86bfa' }),
  S('emberleaf', 'Emberleaf',    'round',     { leaf: '#f0a43a', leaf2: '#d9712a', trunk: '#6e4630', accent: '#f7c76a' }),
  S('maple',     'Fire Maple',   'maple',     { leaf: '#ef5a3c', leaf2: '#c73b2a', trunk: '#6e4630', accent: '#ffa94d' }),
  S('peachpuff', 'Peach Puff',   'cloud',     { leaf: '#ffb3a7', leaf2: '#f38b86', trunk: '#7d5240', accent: '#ffd3c9' }),
  S('lilac',     'Lilac Dream',  'cloud',     { leaf: '#c4a3f5', leaf2: '#9c79e0', trunk: '#6b4f6e', accent: '#e2d1ff' }),
  S('glacier',   'Glacier',      'cloud',     { leaf: '#8fd3f7', leaf2: '#5aa9e0', trunk: '#5d6d80', accent: '#c7ecff' }),
  S('goldcrest', 'Goldcrest',    'cloud',     { leaf: '#ffd65a', leaf2: '#f0a92e', trunk: '#7a5232', accent: '#fff0a8' }),
  S('orange',    'Sunset Orange','fruit',     { leaf: '#4fae5f', leaf2: '#358a46', trunk: '#7a5232', accent: '#7fcf7a', fruit: '#ff8c1a' }),
  S('plum',      'Velvet Plum',  'fruit',     { leaf: '#7fcf8f', leaf2: '#56a86a', trunk: '#6b4426', accent: '#a7e3b2', fruit: '#7a3ec8' }),
  S('palm',      'Sunny Palm',   'palm',      { leaf: '#4fc46a', leaf2: '#2f9a4c', trunk: '#b07a48', accent: '#7cd88f', fruit: '#7a4e2a', center: '#6b4426' }),
  S('willow',    'Weeping Willow','willow',   { leaf: '#9fd36a', leaf2: '#74b14a', trunk: '#6e4f36', accent: '#c6ea95' }),
  S('wisteria',  'Wisteria Veil','willow',    { leaf: '#b58be8', leaf2: '#8d63cf', trunk: '#6b4f5e', accent: '#e6d2ff' }),
  S('snowfir',   'Snowy Fir',    'snowy',     { leaf: '#2f8f6b', leaf2: '#226e52', trunk: '#6b4426', accent: '#ffffff' }),
  S('rosebush',  'Rose Bush',    'rosebush',  { leaf: '#55a85f', leaf2: '#3e8648', trunk: '#6b4426', accent: '#a3172f', petal: '#ef3b5a' }),
  S('sunbush',   'Sun Roses',    'rosebush',  { leaf: '#5fb36a', leaf2: '#3f8f4f', trunk: '#6b4426', accent: '#e08a00', petal: '#ffd23f' }),
  S('bonsai',    'Bonsai',       'bonsai',    { leaf: '#5fb36a', leaf2: '#3a8a4a', trunk: '#6b4426', accent: '#3d6fb6' }),
  S('baobab',    'Baobab',       'baobab',    { leaf: '#8cc94f', leaf2: '#629b37', trunk: '#a77d5a', accent: '#b3e07a', center: '#5e4636' }),
  S('topiary',   'Topiary',      'topiary',   { leaf: '#4fb06a', leaf2: '#358a4f', trunk: '#6b4426', accent: '#d9603b', petal: '#ffffff' }),

  S('festive',   'Festive Fir',  'festive',   { leaf: '#2f9a5c', leaf2: '#227846', trunk: '#6b4426', accent: '#ffd23f', fruit: '#ef3b5a', petal: '#4fa3e0' }),
  S('lollipop',  'Lollipop',     'lollipop',  { leaf: '#ff7ab6', leaf2: '#e2528f', trunk: '#ffffff', accent: '#ffffff', petal: '#4fd1c5' }),
  S('coral',     'Coral Bloom',  'coral',     { leaf: '#ff7f6e', leaf2: '#ffb36b', trunk: '#ff7f6e', accent: '#ffe5a8' }),
  S('reef',      'Reef Fan',     'coral',     { leaf: '#3fc7c0', leaf2: '#7a8cf0', trunk: '#3fc7c0', accent: '#ff9ad5' }),
  S('heartwood', 'Heartwood',    'heart',     { leaf: '#ff6f91', leaf2: '#e24a72', trunk: '#7d5240', accent: '#ffe0ea' }),
  S('lantern',   'Lantern Tree', 'lantern',   { leaf: '#5fb36a', leaf2: '#3f8f4f', trunk: '#5e4636', accent: '#ffd66b', fruit: '#ff6a3d', center: '#3b2a20', glow: '#ffcc4d' }),
  S('balloon',   'Balloon Sprout','balloon',  { leaf: '#4fa3e0', leaf2: '#2f80c4', trunk: '#8a7a6a', accent: '#ffd23f', fruit: '#ef3b5a', petal: '#ffd23f' }),
  S('cloudpuff', 'Rain Cloud',   'cloudpuff', { leaf: '#f4f7ff', leaf2: '#cfdcf5', trunk: '#7a6a8a', accent: '#ffffff', fruit: '#4fa3e0' }),
  S('sakura',    'Sakura Bonsai','bonsai',    { leaf: '#ffb7d0', leaf2: '#f08ab0', trunk: '#4e3528', accent: '#2c2c3a' }),

  S('crystal',   'Crystal Spire','crystal',   { leaf: '#8fb8ff', leaf2: '#7a5af0', trunk: '#6d6a8a', accent: '#d8f3ff' }),
  S('ember',     'Ember Crystal','crystal',   { leaf: '#ff7a3d', leaf2: '#d6265b', trunk: '#5e3a3a', accent: '#ffe08a' }),
  S('nightglow', 'Nightglow',    'nightglow', { leaf: '#3a4a9f', leaf2: '#27306e', trunk: '#3b3050', accent: '#ffe066', glow: '#8fa8ff' }),
  S('aurora',    'Aurora',       'aurora',    { leaf: '#3fd8a8', leaf2: '#6a4ad8', trunk: '#4a3a5a', accent: '#b6ff8a' }),
  S('galaxy',    'Galaxy',       'aurora',    { leaf: '#9a5ae0', leaf2: '#27306e', trunk: '#3b3050', accent: '#ff8ad5' }),
  S('rainbow',   'Rainbow Arch', 'rainbow',   { leaf: '#ffffff', leaf2: '#e6ecf5', trunk: '#888888', accent: '#ffffff' }),
];

export const SPECIES = ALL
  .map((s) => (UNLOCKS[s.id] ? { ...s, rarity: UNLOCKS[s.id].rarity, unlock: UNLOCKS[s.id] } : s))
  .sort((a, b) => (a.unlock ? 1 : 0) - (b.unlock ? 1 : 0)); // free first

// summary comes from stats.summarize(). Returns { current, target, done } for earnable species; free ones are always done.
export function unlockProgress(sp, summary) {
  if (!sp.unlock) return { current: 1, target: 1, done: true };
  const { type, target } = sp.unlock;
  const current = type === 'grown' ? summary.grownCount
    : type === 'hours' ? Math.floor(summary.totalMinutes / 60)
    : type === 'streak' ? summary.bestStreak
    : summary.longestSession;
  return { current: Math.min(current, target), target, done: current >= target };
}

export const speciesById = (id) => SPECIES.find((s) => s.id === id) || SPECIES[0];
