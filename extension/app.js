import { engine, send, hasAccess, requestAccess } from './store.js';
import { mountDashboard } from './shared/dashboard.js';
const tab = new URLSearchParams(location.search).get('tab') || 'garden';
const dash = mountDashboard(document.getElementById('dash'), engine, {
  blocklist: true, initial: tab, onChange: () => send('settingsChanged'),
  access: { has: hasAccess, request: requestAccess },
});
// Re-render on changes from other pages, but not while the user is typing in Settings.
chrome.storage.onChanged.addListener(() => { if (!document.activeElement?.closest('form')) dash.render(); });
