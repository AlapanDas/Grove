import { createEngine } from './shared/engine.js';

export const store = {
  load: async () => (await chrome.storage.local.get('data')).data,
  save: (data) => chrome.storage.local.set({ data }),
};
export const engine = createEngine(store);
export const send = (type, payload = {}) => chrome.runtime.sendMessage({ type, ...payload });
