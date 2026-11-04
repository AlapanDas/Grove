import { engine, send } from './store.js';
import { speciesById } from './shared/species.js';
import { renderPlant } from './shared/plant.js';
import { fmtClock } from './shared/stats.js';

const $ = (id) => document.getElementById(id);

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
  const p = (Date.now() - a.start) / (a.end - a.start);
  $('plant').innerHTML = renderPlant(sp, p, 'growing');
  $('msg').textContent = `Your ${sp.name} is still growing. Time left:`;
  $('clock').textContent = fmtClock(a.end - Date.now());
}

$('back').onclick = () => (history.length > 1 ? history.back() : window.close());
$('giveup').onclick = async () => {
  if (!confirm('Give up? Your plant will wither and the site will be unblocked.')) return;
  await send('giveUp', { reason: 'gave-up' });
  tick();
};

tick();
setInterval(tick, 1000);
