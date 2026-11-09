import { createEngine } from './shared/engine.js';
import { mountTimer } from './shared/timer-view.js';
import { SPECIES } from './shared/species.js';
import { mountDashboard } from './shared/dashboard.js';
import { createAmbient } from './shared/ambient.js';

const KEY = 'grove-data';
const engine = createEngine({
  load: async () => JSON.parse(localStorage.getItem(KEY) || 'null') || undefined,
  save: async (d) => localStorage.setItem(KEY, JSON.stringify(d)),
});

const coins = document.getElementById('coins');
const ambient = createAmbient();
const notify = (title, body) => {
  if (window.Notification?.permission === 'granted') new Notification(title, { body });
};

// Ambient sound plays only while a session is actively growing (not paused, not on a break).
function syncSound(d) {
  const a = d.active;
  if (a && !a.pausedAt && d.settings.sound !== 'off') ambient.play(d.settings.sound, d.settings.volume);
  else ambient.stop();
}
// Browsers keep audio muted until the page gets a click, e.g. after reloading mid-session.
addEventListener('pointerdown', () => ambient.unlock());

const dash = mountDashboard(document.getElementById('dash'), engine, {
  onChange: async () => { timer.render(); syncSound(await engine.getData()); },
});

// Leaving the tab for longer than the grace period withers the plant. Time spent paused doesn't count.
async function settle() {
  const d = await engine.getData();
  const a = d.active;
  if (!a) return;
  const now = Date.now();
  const grace = d.settings.graceSeconds * 1000;
  const awaySince = Math.max(a.hiddenAt || 0, a.resumedAt || 0);
  if (a.hiddenAt && !a.pausedAt && Math.min(now, a.end) - awaySince > grace) await engine.giveUp('left');
  else if (!a.pausedAt && now >= a.end) await engine.complete();
  else if (a.hiddenAt) await engine.patchActive({ hiddenAt: null });
}

const timer = mountTimer(document.getElementById('timer'), {
  getData: () => engine.getData(),
  start: (opts) => engine.start(opts),
  giveUp: () => engine.giveUp('gave-up'),
  pause: () => engine.pause(),
  resume: () => engine.resume(),
  endBreak: () => engine.endBreak(),
  saveSettings: async (patch) => syncSound(await engine.update(patch)),
  settle,
  onData: (d) => { coins.textContent = `🌿 ${d.owned.length}/${SPECIES.length}`; syncSound(d); },
  onFinish: (s) => {
    dash.render();
    if (document.hidden && s.status === 'success') notify('Your plant is fully grown! 🌳', `${s.minutes} minutes of focus.`);
  },
  onBreakEnd: () => { if (document.hidden) notify("Break's over ☕", 'Come back and plant your next seed.'); },
  hint: 'Keep this tab open. If you switch away for too long, your plant withers. Pausing keeps it safe for a few minutes.',
});

document.addEventListener('visibilitychange', async () => {
  const d = await engine.getData();
  if (!d.active) return;
  if (document.hidden) {
    await engine.patchActive({ hiddenAt: Date.now() });
    if (!d.active.pausedAt) notify('Come back! 🌱', `Your plant withers in ${d.settings.graceSeconds}s if you stay away.`);
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
