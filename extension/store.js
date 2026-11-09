import { createEngine } from './shared/engine.js';

export const store = {
  load: async () => (await chrome.storage.local.get('data')).data,
  save: (data) => chrome.storage.local.set({ data }),
};
export const engine = createEngine(store);
export const send = (type, payload = {}) => chrome.runtime.sendMessage({ type, ...payload });

// ---------- Site access (optional_host_permissions) ----------
// Grove asks only for the sites it has to redirect: the block list, or every site in allow-list mode.
const isAllowMode = (d) => d.settings.blockMode === 'allowlist';
export const originsFor = (d) => (isAllowMode(d)
  ? ['*://*/*']
  : d.blocklist.flatMap((h) => [`*://${h}/*`, `*://*.${h}/*`]));

export async function hasAccess(d) {
  const origins = originsFor(d);
  return !origins.length || chrome.permissions.contains({ origins });
}
// Must be called directly from a click handler, before any await, or the browser won't show the prompt.
export function requestAccess(d) {
  const origins = originsFor(d);
  if (!origins.length) return Promise.resolve(true);
  try { return chrome.permissions.request({ origins }); } catch (e) { return Promise.reject(e); }
}

// True if `url` should be blocked during a focus session.
export function isBlockedUrl(url, d) {
  let host;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    host = u.hostname.replace(/^www\./, '');
  } catch { return false; }
  const matches = (list) => list.some((dom) => host === dom || host.endsWith('.' + dom));
  return isAllowMode(d) ? !matches(d.allowlist) : matches(d.blocklist);
}
