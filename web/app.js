import { createEngine } from './shared/engine.js';
import { mountTimer } from './shared/timer-view.js';
import { SPECIES } from './shared/species.js';
import { mountDashboard } from './shared/dashboard.js';

const KEY = 'grove-data';
const engine = createEngine({
  load: async () => JSON.parse(localStorage.getItem(KEY) || 'null') || undefined,
  save: async (d) => localStorage.setItem(KEY, JSON.stringify(d)),
});

const coins = document.getElementById('coins');
const dash = mountDashboard(document.getElementById('dash'), engine, { onChange: () => timer.render() });

// Leaving the tab for longer than the grace period withers the plant.
async function settle() {
  const d = await engine.getData();
  const a = d.active;
  if (!a) return;
  const now = Date.now();
  const grace = d.settings.graceSeconds * 1000;
  if (a.hiddenAt && Math.min(now, a.end) - a.hiddenAt > grace) await engine.giveUp('left');
  else if (now >= a.end) await engine.complete();
  else if (a.hiddenAt) await engine.patchActive({ hiddenAt: null });
}

const timer = mountTimer(document.getElementById('timer'), {
  getData: () => engine.getData(),
  start: (opts) => engine.start(opts),
  giveUp: () => engine.giveUp('gave-up'),
  settle,
  onData: (d) => (coins.textContent = `🌿 ${d.owned.length}/${SPECIES.length}`),
  onFinish: () => dash.render(),
  hint: 'Keep this tab open. If you switch away for too long, your plant withers.',
});

document.addEventListener('visibilitychange', async () => {
  const d = await engine.getData();
  if (!d.active) return;
  if (document.hidden) {
    await engine.patchActive({ hiddenAt: Date.now() });
    if (window.Notification?.permission === 'granted') {
      new Notification('Come back! 🌱', { body: `Your plant withers in ${d.settings.graceSeconds}s if you stay away.` });
    }
  } else {
    await settle();
    timer.render();
  }
});

document.getElementById('timer').addEventListener('click', (e) => {
  if (e.target.matches('[data-start]') && window.Notification?.permission === 'default') Notification.requestPermission();
});

// On load, settle a session left over from a closed or reloaded tab.
settle().then(() => { timer.render(); dash.render(); });
