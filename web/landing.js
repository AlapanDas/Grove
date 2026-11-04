import { SPECIES, RARITY } from './shared/species.js';
import { renderPlant } from './shared/plant.js';
import { renderGarden } from './shared/garden.js';

// Link to the source code repo. Set this once the repo is on GitHub.
const REPO_URL = '';

const byId = (id) => SPECIES.find((s) => s.id === id);
const $ = (id) => document.getElementById(id);

// Hero: three plants at different growth stages.
$('stage').innerHTML = [['sprig', .3], ['blush', .65], ['spire', 1]]
  .map(([id, p]) => `<div>${renderPlant(byId(id), p, 'growing')}</div>`).join('');

// Demo garden with a fixed, colorful sample.
const picks = ['blush', 'apple', 'sunny', 'spire', 'lilac', 'palm', 'tulipa', 'maple', 'capling', 'glacier', 'bonsai', 'lavish',
  'heartwood', 'goldcrest', 'willow', 'snowfir', 'peachpuff', 'trio', 'rosebush', 'crystal', 'patch', 'lollipop', 'coral', 'pincushion', 'wisteria'];
const demo = picks.map((id, k) => ({ species: id, minutes: 25, end: k, status: k === 7 ? 'withered' : 'success' }));
$('demo-garden').innerHTML = renderGarden(demo, { height: 420 });

// Growth stages.
const sp = byId('blush');
$('stages').innerHTML = [[.05, 'growing', 'Seed'], [.25, 'growing', 'Sprout'], [.55, 'growing', 'Sapling'], [1, 'grown', 'Fully grown'], [1, 'withered', 'Withered']]
  .map(([p, st, label]) => `<figure>${renderPlant(sp, p, st)}<figcaption>${label}</figcaption></figure>`).join('');

// Species gallery grouped by rarity.
$('species-gallery').innerHTML = Object.entries(RARITY).map(([key, r]) => {
  const list = SPECIES.filter((s) => s.rarity === key);
  return `<h3 class="rarity" style="--r:${r.color}">${r.label} · ${list.length} <small>${r.note}</small></h3>
    <div class="gallery">${list.map((s) => `
      <figure style="--r:${r.color}">${renderPlant(s, 1, 'grown')}
        <figcaption><b>${s.name}</b>${s.unlock ? `<span>🔒 ${s.unlock.label}</span>` : ''}</figcaption>
      </figure>`).join('')}</div>`;
}).join('');

// Copy buttons.
document.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = async () => {
  try {
    await navigator.clipboard.writeText($(b.dataset.copy).textContent);
    b.textContent = 'Copied ✓';
  } catch {
    b.textContent = 'Select & copy it';
  }
  setTimeout(() => (b.textContent = 'Copy'), 2000);
}));

// Source link: hidden until REPO_URL is set.
const src = $('source-link');
if (REPO_URL) src.href = REPO_URL; else src.hidden = true;
