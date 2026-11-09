// Platform-agnostic session engine. `store` must implement { load(): Promise<data|undefined>, save(data): Promise }.
import { SPECIES, unlockProgress } from './species.js';
import { summarize } from './stats.js';

export const DEFAULT_DATA = {
  owned: [], // derived: free species + earned ones (recomputed from history)
  sessions: [],
  tags: ['Study', 'Work', 'Reading', 'Other'],
  blocklist: ['youtube.com', 'x.com', 'twitter.com', 'reddit.com', 'instagram.com', 'facebook.com', 'tiktok.com'],
  allowlist: ['google.com', 'wikipedia.org', 'github.com', 'stackoverflow.com', 'developer.mozilla.org'],
  settings: {
    graceSeconds: 10,
    defaultMinutes: 25,
    blockMode: 'blocklist', // 'blocklist' blocks listed sites; 'allowlist' blocks everything except listed sites
    pauseMinutes: 5, // a paused session resumes on its own after this long
    sound: 'off', // ambient sound during focus, see ambient.js
    volume: 0.5,
    pomodoro: { enabled: false, shortBreak: 5, longBreak: 15, longEvery: 4 },
  },
  pomo: { round: 0, lastAt: 0 }, // Pomodoro round counter, resets after a long idle gap
  break: null, // { start, end, kind: 'short' | 'long', round } while a Pomodoro break is running or just ended
  active: null,
};

const POMO_RESET_MS = 3 * 3600000; // start counting rounds from 1 again after 3 idle hours

// Unlocks are derived from session history, so they can never get out of sync.
export const unlockedIds = (sessions) => {
  const sum = summarize(sessions);
  return SPECIES.filter((sp) => unlockProgress(sp, sum).done).map((sp) => sp.id);
};

// Time helpers for an active session. A paused session's clock is frozen at `pausedAt`.
export const remaining = (a, now = Date.now()) => a.end - (a.pausedAt || now);
export const progress = (a, now = Date.now()) => 1 - remaining(a, now) / (a.minutes * 60000);
export const pauseLeft = (a, now = Date.now()) => (a.pausedAt ? a.pausedAt + a.pauseLimit - now : 0);
export const breakActive = (d, now = Date.now()) => !!d.break && now < d.break.end;

// A pause that has run past its limit counts as resumed at the limit. This is derived, so every reader agrees.
function normalize(d, now) {
  const a = d.active;
  if (a?.pausedAt && now - a.pausedAt >= a.pauseLimit) {
    a.end += a.pauseLimit;
    a.pausedMs = (a.pausedMs || 0) + a.pauseLimit;
    a.resumedAt = a.pausedAt + a.pauseLimit;
    a.pausedAt = null;
  }
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function createEngine(store) {
  async function getData() {
    const saved = (await store.load()) || {};
    const d = { ...structuredClone(DEFAULT_DATA), ...saved };
    d.settings = { ...DEFAULT_DATA.settings, ...(saved.settings || {}) };
    d.settings.pomodoro = { ...DEFAULT_DATA.settings.pomodoro, ...(saved.settings?.pomodoro || {}) };
    d.pomo = { ...DEFAULT_DATA.pomo, ...(saved.pomo || {}) };
    d.owned = unlockedIds(d.sessions);
    delete d.coins;
    normalize(d, Date.now());
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
      d.break = null;
      d.active = { id: uid(), start: now, end: now + minutes * 60000, minutes, species, tag: tag || null };
      return d.active;
    }),

    // Marks the active session as grown if its time is up. Returns the finished session or null.
    // In Pomodoro mode this also starts a break, returned as `session.break`.
    complete: () => mutate((d) => {
      const a = d.active;
      if (!a || a.pausedAt || Date.now() < a.end) return null;
      const s = { id: a.id, start: a.start, end: a.end, minutes: a.minutes, species: a.species, tag: a.tag, status: 'success' };
      if (a.pausedMs) s.pausedMs = a.pausedMs;
      d.sessions.push(s);
      const before = new Set(d.owned);
      d.owned = unlockedIds(d.sessions);
      s.unlocked = d.owned.filter((id) => !before.has(id)); // newly earned species, shown in the result screen
      d.active = null;

      const pomo = d.settings.pomodoro;
      if (pomo.enabled) {
        if (a.end - d.pomo.lastAt > POMO_RESET_MS) d.pomo.round = 0;
        d.pomo.round += 1;
        d.pomo.lastAt = a.end;
        const kind = d.pomo.round % Math.max(1, pomo.longEvery) === 0 ? 'long' : 'short';
        const mins = kind === 'long' ? pomo.longBreak : pomo.shortBreak;
        d.break = { start: a.end, end: a.end + mins * 60000, kind, minutes: mins, round: d.pomo.round };
        s.break = d.break;
      }
      return s;
    }),

    giveUp: (reason = 'gave-up') => mutate((d) => {
      const a = d.active;
      if (!a) return null;
      const now = Date.now();
      const s = { id: a.id, start: a.start, end: now, minutes: a.minutes, species: a.species, tag: a.tag,
        status: 'withered', reason, actualMinutes: Math.floor((now - a.start - (a.pausedMs || 0)) / 60000) };
      d.sessions.push(s);
      d.active = null;
      return s;
    }),

    pause: () => mutate((d) => {
      const a = d.active;
      const now = Date.now();
      if (!a || a.pausedAt || now >= a.end) return a;
      a.pausedAt = now;
      a.pauseLimit = Math.max(1, d.settings.pauseMinutes) * 60000;
      a.pauses = (a.pauses || 0) + 1;
      return a;
    }),

    resume: () => mutate((d) => {
      const a = d.active;
      if (!a?.pausedAt) return a;
      const now = Date.now();
      const delta = now - a.pausedAt;
      a.end += delta;
      a.pausedMs = (a.pausedMs || 0) + delta;
      a.resumedAt = now;
      a.pausedAt = null;
      return a;
    }),

    endBreak: () => mutate((d) => { d.break = null; return null; }),

    patchActive: (patch) => mutate((d) => { if (d.active) Object.assign(d.active, patch); return d.active; }),

    update: (patch) => mutate((d) => {
      for (const k of ['tags', 'blocklist', 'allowlist']) if (patch[k]) d[k] = patch[k];
      if (patch.settings) {
        const { pomodoro, ...rest } = patch.settings;
        d.settings = { ...d.settings, ...rest };
        if (pomodoro) d.settings.pomodoro = { ...d.settings.pomodoro, ...pomodoro };
      }
      return d;
    }),

    importData: (obj) => mutate((d) => { Object.assign(d, obj, { active: null, break: null }); return d; }),
  };
}
