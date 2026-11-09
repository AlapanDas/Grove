// Shared Grove / Stats / Collection / Settings UI used by both the website app and the extension's app page.
import { SPECIES, RARITY, speciesById, unlockProgress } from './species.js';
import { renderPlant } from './plant.js';
import { summarize, fmtMinutes, dayKey } from './stats.js';
import { RANGES, periodBounds, sessionsIn, renderGarden } from './garden.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LABELS = { garden: '🏝️ Garden', grove: '🌳 Grove', stats: '📊 Stats', collection: '🏆 Collection', settings: '⚙️ Settings' };

export function mountDashboard(root, engine, opts = {}) {
  let current = opts.initial || 'garden';
  let range = 'day', offset = 0; // garden period

  const views = {
    garden(d) {
      const period = periodBounds(range, offset);
      const list = sessionsIn(d.sessions, period);
      const grown = list.filter((s) => s.status === 'success');
      const minutes = grown.reduce((a, s) => a + s.minutes, 0);
      const rate = list.length ? Math.round((grown.length / list.length) * 100) : 0;
      const kinds = new Set(grown.map((s) => s.species)).size;
      return `
        <div class="garden-bar">
          <div class="seg">${Object.entries(RANGES).map(([k, l]) => `<button data-range="${k}" class="${k === range ? 'on' : ''}">${l}</button>`).join('')}</div>
          ${range === 'all' ? '' : `<div class="nav">
            <button class="ghost" data-shift="-1" aria-label="Previous">‹</button>
            <strong>${period.label}</strong>
            <button class="ghost" data-shift="1" aria-label="Next" ${offset >= 0 ? 'disabled' : ''}>›</button>
          </div>`}
        </div>
        <div class="garden-scene">${renderGarden(list, { emptyText: offset === 0 && range === 'day' ? 'Plant your first seed today 🌱' : 'Nothing planted in this period' })}</div>
        <div class="cards">
          <div class="card"><b>${grown.length}</b><span>plants grown</span></div>
          <div class="card"><b>${fmtMinutes(minutes)}</b><span>focus time</span></div>
          <div class="card"><b>${list.length - grown.length}</b><span>withered</span></div>
          <div class="card"><b>${rate}%</b><span>success rate</span></div>
          <div class="card"><b>${kinds}</b><span>species planted</span></div>
        </div>`;
    },

    grove(d) {
      if (!d.sessions.length) return `<p class="empty">No plants yet. Finish a focus session to grow your first one.</p>`;
      const days = {};
      [...d.sessions].reverse().forEach((s) => (days[dayKey(s.end)] ||= []).push(s));
      return Object.entries(days).map(([k, list]) => `
        <h3 class="day">${new Date(list[0].end).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
        <div class="grove">${list.map((s) => `
          <div class="tile ${s.status}" title="${esc(`${speciesById(s.species).name} · ${s.minutes} min · ${s.tag || 'Untagged'} · ${s.status === 'success' ? 'grown' : 'withered'}`)}">
            ${renderPlant(speciesById(s.species), 1, s.status === 'success' ? 'grown' : 'withered')}
            <span>${s.minutes}m${s.tag ? ` · ${esc(s.tag)}` : ''}</span>
          </div>`).join('')}</div>`).join('');
    },

    stats(d) {
      const s = summarize(d.sessions);
      const max = Math.max(1, ...s.last7.map((x) => x.minutes));
      const tagMax = Math.max(1, ...Object.values(s.byTag));
      return `
        <div class="cards">
          <div class="card"><b>${fmtMinutes(s.totalMinutes)}</b><span>total focus</span></div>
          <div class="card"><b>${s.grownCount}</b><span>plants grown</span></div>
          <div class="card"><b>${s.witheredCount}</b><span>withered</span></div>
          <div class="card"><b>${s.streak}🔥</b><span>day streak</span></div>
        </div>
        <h3>Last 7 days</h3>
        <div class="bars">${s.last7.map((x) => `
          <div class="bar"><div style="height:${(x.minutes / max) * 100}%" title="${fmtMinutes(x.minutes)}"></div><span>${x.label}</span></div>`).join('')}</div>
        <h3>By tag</h3>
        ${Object.keys(s.byTag).length ? Object.entries(s.byTag).sort((a, b) => b[1] - a[1]).map(([t, m]) => `
          <div class="hbar"><span>${esc(t)}</span><div><i style="width:${(m / tagMax) * 100}%"></i></div><em>${fmtMinutes(m)}</em></div>`).join('') : '<p class="empty">No tagged sessions yet.</p>'}`;
    },

    collection(d) {
      const sum = summarize(d.sessions);
      const ownedCount = SPECIES.filter((s) => d.owned.includes(s.id)).length;
      return `<p class="coins-line">Collection: <b>${ownedCount}/${SPECIES.length}</b> species. Free plants are always yours, and rare ones are earned by focusing.</p>
        ${Object.entries(RARITY).map(([key, r]) => `
          <h3 class="rarity" style="--r:${r.color}">${r.label} <small>${r.note}</small></h3>
          <div class="shop">${SPECIES.filter((s) => s.rarity === key).map((sp) => {
            const pr = unlockProgress(sp, sum);
            if (pr.done) return `<div class="tile owned" style="--r:${r.color}">${renderPlant(sp, 1, 'grown')}<strong>${sp.name}</strong>
              ${sp.unlock ? '<em>✓ Earned</em>' : ''}</div>`;
            return `<div class="tile locked" style="--r:${r.color}" title="${esc(sp.unlock.label)}">${renderPlant(sp, 1, 'grown')}<strong>🔒 ${sp.name}</strong>
              <span>${esc(sp.unlock.label)}</span>
              <div class="progress"><i style="width:${(pr.current / pr.target) * 100}%"></i></div>
              <span>${pr.current} / ${pr.target}</span></div>`;
          }).join('')}</div>`).join('')}`;
    },

    settings(d) {
      const p = d.settings.pomodoro;
      const allow = d.settings.blockMode === 'allowlist';
      const theme = window.groveTheme?.get() || 'system';
      return `<form class="settings">
          <fieldset><legend>Appearance</legend>
            <label>Theme<select name="theme" data-theme-select>
              ${[['system', 'Match my system'], ['light', '☀️ Light'], ['dark', '🌙 Dark']].map(([v, l]) =>
                `<option value="${v}" ${v === theme ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          </fieldset>
          <fieldset><legend>Focus</legend>
            <label>Tags (comma separated)<input name="tags" value="${esc(d.tags.join(', '))}"></label>
            ${opts.blocklist ? '' : `<label>Grace period before a plant withers when you leave (seconds)
              <input name="grace" type="number" min="0" max="120" value="${d.settings.graceSeconds}"></label>`}
            <label>Longest pause, after which the timer resumes on its own (minutes)
              <input name="pauseMinutes" type="number" min="1" max="30" value="${d.settings.pauseMinutes}"></label>
            <label>Ambient sound volume
              <input name="volume" type="range" min="0" max="1" step="0.05" value="${d.settings.volume}"></label>
          </fieldset>
          <fieldset><legend>🍅 Pomodoro</legend>
            <label class="check"><input type="checkbox" name="pomoEnabled" ${p.enabled ? 'checked' : ''}> Take a break after every focus session</label>
            <div class="grid3">
              <label>Short break (min)<input name="shortBreak" type="number" min="1" max="60" value="${p.shortBreak}"></label>
              <label>Long break (min)<input name="longBreak" type="number" min="1" max="90" value="${p.longBreak}"></label>
              <label>Long break every<input name="longEvery" type="number" min="2" max="12" value="${p.longEvery}"></label>
            </div>
          </fieldset>
          ${opts.blocklist ? `<fieldset><legend>Site blocking</legend>
            <div class="seg-radio">
              <label><input type="radio" name="blockMode" value="blocklist" ${allow ? '' : 'checked'}> Block list</label>
              <label><input type="radio" name="blockMode" value="allowlist" ${allow ? 'checked' : ''}> Allow list</label>
            </div>
            <label data-mode="blocklist" ${allow ? 'hidden' : ''}>Blocked during focus (one site per line)
              <textarea name="blocklist" rows="7">${esc(d.blocklist.join('\n'))}</textarea></label>
            <label data-mode="allowlist" ${allow ? '' : 'hidden'}>Allowed during focus, everything else is blocked (one site per line)
              <textarea name="allowlist" rows="7">${esc(d.allowlist.join('\n'))}</textarea></label>
            <p class="access" hidden></p>
          </fieldset>` : ''}
          <div><button type="submit">Save</button> <span class="saved" hidden>Saved ✓</span></div>
        </form>
        <div class="data-tools"><button data-export>Export data</button>
          <label class="file-btn">Import data<input type="file" accept="application/json" data-import hidden></label></div>`;
    },
  };

  const wire = {
    garden(el) {
      el.querySelectorAll('[data-range]').forEach((b) => (b.onclick = () => { range = b.dataset.range; offset = 0; render(); }));
      el.querySelectorAll('[data-shift]').forEach((b) => (b.onclick = () => { offset = Math.min(0, offset + Number(b.dataset.shift)); render(); }));
    },
    settings(el) {
      const f = el.querySelector('form');
      const sites = (v) => v.split('\n').map((s) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/:].*$/, '')).filter(Boolean);
      const num = (v, min, max) => Math.min(max, Math.max(min, Math.round(Number(v)) || min));
      const saved = el.querySelector('.saved');
      f.oninput = () => (saved.hidden = true);

      // Extension: show whether Grove may redirect the sites it needs to, with a button to grant access.
      const access = el.querySelector('.access');
      const pseudo = () => ({ blocklist: sites(f.blocklist.value), allowlist: sites(f.allowlist.value), settings: { blockMode: f.blockMode.value } });
      async function showAccess() {
        if (!access || !opts.access) return;
        const ok = await opts.access.has(pseudo()).catch(() => false);
        access.hidden = ok;
        access.innerHTML = '⚠️ Grove doesn\'t have permission to block these sites yet. <button type="button" class="ghost">Allow access</button>';
        access.querySelector('button').onclick = () => opts.access.request(pseudo()).catch(() => false).then(showAccess);
      }
      if (f.blockMode) {
        f.querySelectorAll('[name=blockMode]').forEach((r) => (r.onchange = () => {
          f.querySelectorAll('[data-mode]').forEach((x) => (x.hidden = x.dataset.mode !== f.blockMode.value));
          showAccess();
        }));
        showAccess();
      }

      f.onsubmit = async (e) => {
        e.preventDefault();
        const patch = {
          tags: f.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
          settings: {
            pauseMinutes: num(f.pauseMinutes.value, 1, 30),
            volume: Math.min(1, Math.max(0, Number(f.volume.value))),
            pomodoro: { enabled: f.pomoEnabled.checked, shortBreak: num(f.shortBreak.value, 1, 60),
              longBreak: num(f.longBreak.value, 1, 90), longEvery: num(f.longEvery.value, 2, 12) },
          },
        };
        if (f.grace) patch.settings.graceSeconds = num(f.grace.value, 0, 120);
        if (f.blocklist) {
          patch.blocklist = sites(f.blocklist.value);
          patch.allowlist = sites(f.allowlist.value);
          patch.settings.blockMode = f.blockMode.value;
          // Must run inside the click, before any await, or the browser refuses to show the permission prompt.
          opts.access?.request(pseudo()).catch(() => false).then(showAccess);
        }
        await engine.update(patch);
        saved.hidden = false;
        opts.onChange?.();
      };
      el.querySelector('[data-export]').onclick = async () => {
        const blob = new Blob([JSON.stringify(await engine.getData(), null, 2)], { type: 'application/json' });
        const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'grove-data.json' });
        a.click();
      };
      el.querySelector('[data-import]').onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try { await engine.importData(JSON.parse(await file.text())); await render(); opts.onChange?.(); }
        catch { alert('That file is not valid Grove data.'); }
      };
    },
  };

  async function render() {
    const d = await engine.getData();
    root.innerHTML = `<nav class="tabs">${Object.keys(views).map((t) =>
      `<button data-tab="${t}" class="${t === current ? 'on' : ''}">${LABELS[t]}</button>`).join('')}</nav>
      <section class="panel">${views[current](d)}</section>`;
    root.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { current = b.dataset.tab; render(); }));
    wire[current]?.(root.querySelector('.panel'), d);
  }

  render();
  return { render, show: (tab) => { current = tab; render(); } };
}
