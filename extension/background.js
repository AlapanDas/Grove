import { engine } from './store.js';

const ALARM = 'grove-session-end';
const RULE_ID = 1;

async function setBlocking(domains) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: domains?.length ? [{
      id: RULE_ID,
      priority: 1,
      action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
      condition: { requestDomains: domains, resourceTypes: ['main_frame'] },
    }] : [],
  });
}

async function setBadge(active) {
  await chrome.action.setBadgeBackgroundColor({ color: '#3f8f4f' });
  await chrome.action.setBadgeText({ text: active ? '🌱' : '' });
}

async function finish() {
  const s = await engine.complete();
  if (!s) return reconcile();
  await setBlocking([]);
  await setBadge(false);
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icons/128.png', title: 'Your plant is fully grown! 🌳',
    message: `${s.minutes} minutes of focus.` + (s.unlocked?.length ? ' New species earned! 🎉' : ''),
  });
}

// Brings Chrome state (alarm, block rules, badge) back in line with stored data after the worker restarts.
async function reconcile() {
  const d = await engine.getData();
  if (!d.active) { await setBlocking([]); await setBadge(false); return; }
  if (Date.now() >= d.active.end) return finish();
  await setBlocking(d.blocklist);
  await setBadge(true);
  chrome.alarms.create(ALARM, { when: d.active.end });
}

chrome.runtime.onInstalled.addListener(reconcile);
chrome.runtime.onStartup.addListener(reconcile);
chrome.alarms.onAlarm.addListener((a) => a.name === ALARM && finish());

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  (async () => {
    switch (msg.type) {
      case 'start': {
        const a = await engine.start(msg);
        await reconcile();
        return a;
      }
      case 'giveUp': {
        const s = await engine.giveUp(msg.reason);
        chrome.alarms.clear(ALARM);
        await reconcile();
        return s;
      }
      case 'tick': // popup asks us to settle a session whose time is up
        await reconcile();
        return engine.getData();
      case 'settingsChanged':
        await reconcile();
        return true;
    }
  })().then(reply);
  return true;
});
