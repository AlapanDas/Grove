import { engine, send, hasAccess, requestAccess } from './store.js';
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
const access = document.getElementById('access');
let last = null; // latest data, kept so permission requests can run synchronously inside a click

const showAccess = async (d) => { access.hidden = await hasAccess(d).catch(() => true); };
document.getElementById('grant').onclick = () => last && requestAccess(last).catch(() => false).then(() => showAccess(last));

mountTimer(el, {
  getData: () => engine.getData(),
  start: (opts) => {
    // Ask for site access in the same click that starts the session. The session starts either way.
    if (last) requestAccess(last).catch(() => false).then(() => showAccess(last));
    return send('start', opts);
  },
  giveUp: () => send('giveUp', { reason: 'gave-up' }),
  pause: () => send('pause'),
  resume: () => send('resume'),
  endBreak: () => send('endBreak'),
  saveSettings: async (patch) => { await engine.update(patch); await send('settingsChanged'); },
  settle: () => send('tick'),
  onData: (d) => {
    last = d;
    coins.textContent = `🌿 ${d.owned.length}/${SPECIES.length}`;
    renderMiniGarden(d);
    showAccess(d);
  },
  hint: 'Blocked sites stay blocked until your plant is grown. Pausing keeps them blocked.',
});
