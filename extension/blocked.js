import { engine, send } from './store.js';
import { speciesById } from './shared/species.js';
import { renderPlant } from './shared/plant.js';
import { fmtClock } from './shared/stats.js';
import { remaining, progress } from './shared/engine.js';

const $ = (id) => document.getElementById(id);
let lastStage = -1;

async function tick() {
  const d = await engine.getData();
  const a = d.active;
  if (!a) {
    $('msg').textContent = 'No focus session is running. You can reload the page you wanted.';
    $('clock').textContent = '';
    $('giveup').hidden = true;
    $('back').textContent = 'Go back';
    return;
  }
  const sp = speciesById(a.species);
  const p = progress(a);
  const stage = Math.floor(p * 40);
  if (stage !== lastStage) { lastStage = stage; $('plant').innerHTML = renderPlant(sp, p, 'growing'); }
  $('title').textContent = d.settings.blockMode === 'allowlist' ? 'This site isn’t on your allow list' : 'This site is blocked';
  $('msg').textContent = a.pausedAt
    ? `Your ${sp.name} is paused. Sites stay blocked until it's fully grown. Time left:`
    : `Your ${sp.name} is still growing. Time left:`;
  $('clock').textContent = fmtClock(remaining(a));
}

$('back').onclick = () => (history.length > 1 ? history.back() : window.close());
$('giveup').onclick = async () => {
  if (!confirm('Give up? Your plant will wither and the site will be unblocked.')) return;
  await send('giveUp', { reason: 'gave-up' });
  tick();
};

tick();
setInterval(tick, 1000);
