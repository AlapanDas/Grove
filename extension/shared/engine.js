// Platform-agnostic session engine. `store` must implement { load(): Promise<data|undefined>, save(data): Promise }.
import { SPECIES, unlockProgress } from './species.js';
import { summarize } from './stats.js';

export const DEFAULT_DATA = {
  owned: [], // derived: free species + earned ones (recomputed from history)
  sessions: [],
  tags: ['Study', 'Work', 'Reading', 'Other'],
  blocklist: ['youtube.com', 'x.com', 'twitter.com', 'reddit.com', 'instagram.com', 'facebook.com', 'tiktok.com'],
  settings: { graceSeconds: 10, defaultMinutes: 25 },
  active: null,
};

// Unlocks are derived from session history, so they can never get out of sync.
export const unlockedIds = (sessions) => {
  const sum = summarize(sessions);
  return SPECIES.filter((sp) => unlockProgress(sp, sum).done).map((sp) => sp.id);
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function createEngine(store) {
  async function getData() {
    const saved = (await store.load()) || {};
    const d = { ...structuredClone(DEFAULT_DATA), ...saved };
    d.settings = { ...DEFAULT_DATA.settings, ...(saved.settings || {}) };
    d.owned = unlockedIds(d.sessions);
    delete d.coins;
    return d;
  }
  async function mutate(fn) {
    const d = await getData();
    const result = fn(d);
    await store.save(d);
    return result;
  }

  return {
    getData,

    start: ({ minutes, species, tag }) => mutate((d) => {
      if (d.active) return d.active;
      const now = Date.now();
      d.active = { id: uid(), start: now, end: now + minutes * 60000, minutes, species, tag: tag || null };
      return d.active;
    }),

    // Marks the active session as grown if its time is up. Returns the finished session or null.
    complete: () => mutate((d) => {
      const a = d.active;
      if (!a || Date.now() < a.end) return null;
      const s = { id: a.id, start: a.start, end: a.end, minutes: a.minutes, species: a.species, tag: a.tag, status: 'success' };
      d.sessions.push(s);
      const before = new Set(d.owned);
      d.owned = unlockedIds(d.sessions);
      s.unlocked = d.owned.filter((id) => !before.has(id)); // newly earned species, shown in the result screen
      d.active = null;
      return s;
    }),

    giveUp: (reason = 'gave-up') => mutate((d) => {
      const a = d.active;
      if (!a) return null;
      const now = Date.now();
      const s = { id: a.id, start: a.start, end: now, minutes: a.minutes, species: a.species, tag: a.tag,
        status: 'withered', reason, actualMinutes: Math.floor((now - a.start) / 60000) };
      d.sessions.push(s);
      d.active = null;
      return s;
    }),

    patchActive: (patch) => mutate((d) => { if (d.active) Object.assign(d.active, patch); return d.active; }),

    update: (patch) => mutate((d) => {
      for (const k of ['tags', 'blocklist']) if (patch[k]) d[k] = patch[k];
      if (patch.settings) d.settings = { ...d.settings, ...patch.settings };
      return d;
    }),

    importData: (obj) => mutate((d) => { Object.assign(d, obj, { active: null }); return d; }),
  };
}
