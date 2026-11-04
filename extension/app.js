import { engine, send } from './store.js';
import { mountDashboard } from './shared/dashboard.js';
const tab = new URLSearchParams(location.search).get('tab') || 'garden';
const dash = mountDashboard(document.getElementById('dash'), engine, {
  blocklist: true, initial: tab, onChange: () => send('settingsChanged'),
});
chrome.storage.onChanged.addListener(() => dash.render());
