import { engine, send } from './store.js';
import { mountTimer } from './shared/timer-view.js';
import { SPECIES } from './shared/species.js';
import { periodBounds, sessionsIn, renderGarden } from './shared/garden.js';
import { fmtMinutes } from './shared/stats.js';

function renderMiniGarden(d) {
  const today = sessionsIn(d.sessions, periodBounds('day'));
  const grown = today.filter((s) => s.status === 'success');
  document.getElementById('today').textContent =
    `${grown.length} grown · ${fmtMinutes(grown.reduce((a, s) => a + s.minutes, 0))}`;
  document.getElementById('garden').innerHTML =
    renderGarden(today, { compact: true, height: 300, minSide: 3, emptyText: 'Your garden is empty today' });
}

const el = document.getElementById('timer');
const coins = document.getElementById('coins');

mountTimer(el, {
  getData: () => engine.getData(),
  start: (opts) => send('start', opts),
  giveUp: () => send('giveUp', { reason: 'gave-up' }),
  settle: () => send('tick'),
  onData: (d) => { coins.textContent = `🌿 ${d.owned.length}/${SPECIES.length}`; renderMiniGarden(d); },
  hint: 'Blocked sites stay blocked until your plant is grown.',
});
