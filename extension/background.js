import { engine, isBlockedUrl } from './store.js';
import { breakActive } from './shared/engine.js';
import { createAmbient } from './shared/ambient.js';

const ALARM = 'grove-session-end';
const BREAK_ALARM = 'grove-break-end';
const PAUSE_ALARM = 'grove-pause-end';
const RULE_ID = 1;
const BLOCKED_PAGE = '/blocked.html';

// ---------- site blocking ----------
// Block-list mode redirects the listed domains. Allow-list mode redirects every http(s) page except the listed domains.
function rulesFor(d) {
  const redirect = { type: 'redirect', redirect: { extensionPath: BLOCKED_PAGE } };
  if (d.settings.blockMode === 'allowlist') {
    const condition = { regexFilter: '^https?://', resourceTypes: ['main_frame'] };
    if (d.allowlist.length) condition.excludedRequestDomains = d.allowlist;
    return [{ id: RULE_ID, priority: 1, action: redirect, condition }];
  }
  return d.blocklist.length
    ? [{ id: RULE_ID, priority: 1, action: redirect, condition: { requestDomains: d.blocklist, resourceTypes: ['main_frame'] } }]
    : [];
}

async function setBlocking(d) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: d ? rulesFor(d) : [],
  });
}

// Backup for the redirect rule. With optional host permissions the browser may skip a redirect (for example when the
// link was clicked on a site Grove has no access to), so tabs that land on a blocked site are sent to the blocked page.
chrome.tabs.onUpdated.addListener(async (tabId, change) => {
  if (!change.url || !/^https?:/.test(change.url)) return;
  const d = await engine.getData();
  if (d.active && isBlockedUrl(change.url, d)) chrome.tabs.update(tabId, { url: chrome.runtime.getURL(BLOCKED_PAGE) }).catch(() => {});
});

// ---------- ambient sound ----------
// Chrome: service workers can't play audio, so sound runs in an offscreen document.
// Firefox: there is no offscreen API, but the background is a real page that can play audio itself.
const local = typeof AudioContext !== 'undefined' && !chrome.offscreen ? createAmbient() : null;

async function setSound(kind, volume) {
  if (local) return kind ? local.play(kind, volume) : local.stop();
  if (!chrome.offscreen) return;
  const has = (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length > 0;
  if (!kind) { if (has) await chrome.offscreen.closeDocument().catch(() => {}); return; }
  if (!has) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html', reasons: ['AUDIO_PLAYBACK'], justification: 'Ambient sounds during focus sessions',
    }).catch(() => {}); // a concurrent call may have created it already
  }
  await chrome.runtime.sendMessage({ target: 'offscreen', kind, volume }).catch(() => {});
}

const syncSound = (d) => {
  const on = d.active && !d.active.pausedAt && d.settings.sound !== 'off';
  return setSound(on ? d.settings.sound : null, d.settings.volume);
};

// ---------- badge ----------
async function setBadge(d) {
  const text = d.active ? (d.active.pausedAt ? '⏸' : '🌱') : breakActive(d) ? '☕' : '';
  await chrome.action.setBadgeBackgroundColor({ color: '#3f8f4f' });
  await chrome.action.setBadgeText({ text });
}

// ---------- session lifecycle ----------
async function finish() {
  const s = await engine.complete();
  if (!s) return reconcile();
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/128.png', title: 'Your plant is fully grown! 🌳',
    message: `${s.minutes} minutes of focus.` + (s.unlocked?.length ? ' New species earned! 🎉' : '') +
      (s.break ? ` Take a ${s.break.minutes}-minute break ☕` : ''),
  });
  return reconcile();
}

async function breakOver() {
  const d = await engine.getData();
  if (d.break && Date.now() >= d.break.end && !d.active) {
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icons/128.png', title: "Break's over ☕",
      message: `Ready for round ${d.break.round + 1}? Open Grove to plant your next seed.`,
    });
  }
  return reconcile();
}

// Brings browser state (alarms, block rules, badge, sound) back in line with stored data. Safe to call any time.
async function reconcile() {
  const d = await engine.getData();
  const a = d.active;
  if (a && !a.pausedAt && Date.now() >= a.end) return finish();
  await chrome.alarms.clearAll();
  // A paused session resumes by itself after pauseLimit, which pushes its end back by the same amount.
  if (a) chrome.alarms.create(ALARM, { when: a.pausedAt ? a.end + a.pauseLimit : a.end });
  if (a?.pausedAt) chrome.alarms.create(PAUSE_ALARM, { when: a.pausedAt + a.pauseLimit }); // badge + sound resume
  if (!a && breakActive(d)) chrome.alarms.create(BREAK_ALARM, { when: d.break.end });
  await setBlocking(a ? d : null);
  await setBadge(d);
  await syncSound(d);
}

chrome.runtime.onInstalled.addListener(reconcile);
chrome.runtime.onStartup.addListener(reconcile);
chrome.alarms.onAlarm.addListener((al) => (al.name === ALARM ? finish() : al.name === BREAK_ALARM ? breakOver() : reconcile()));

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.target === 'offscreen') return false;
  (async () => {
    switch (msg.type) {
      case 'start': {
        const a = await engine.start(msg);
        await reconcile();
        return a;
      }
      case 'giveUp': {
        const s = await engine.giveUp(msg.reason);
        await reconcile();
        return s;
      }
      case 'pause': await engine.pause(); await reconcile(); return true;
      case 'resume': await engine.resume(); await reconcile(); return true;
      case 'endBreak': await engine.endBreak(); await reconcile(); return true;
      case 'tick': // a page asks us to settle a session whose time is up
        await reconcile();
        return engine.getData();
      case 'settingsChanged':
        await reconcile();
        return true;
    }
  })().then(reply);
  return true;
});
