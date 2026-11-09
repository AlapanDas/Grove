// Chrome only: plays ambient focus sounds, since the background service worker can't.
import { createAmbient } from './shared/ambient.js';
import { engine } from './store.js';

const ambient = createAmbient();
const apply = (kind, volume) => (kind ? ambient.play(kind, volume) : ambient.stop());

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.target === 'offscreen') apply(msg.kind, msg.volume);
});

// In case the background's first message arrived before this script loaded, start from stored state.
engine.getData().then((d) => {
  if (!ambient.playing && d.active && !d.active.pausedAt && d.settings.sound !== 'off') apply(d.settings.sound, d.settings.volume);
});
