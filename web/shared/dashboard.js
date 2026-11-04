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
      return `<form class="settings">
          <label>Tags (comma separated)<input name="tags" value="${esc(d.tags.join(', '))}"></label>
          <label>Grace period before a plant withers when you leave (seconds)
            <input name="grace" type="number" min="0" max="120" value="${d.settings.graceSeconds}"></label>
          ${opts.blocklist ? `<label>Blocked sites during focus (one per line)<textarea name="blocklist" rows="8">${esc(d.blocklist.join('\n'))}</textarea></label>` : ''}
          <button type="submit">Save</button> <span class="saved" hidden>Saved ✓</span>
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
      f.onsubmit = async (e) => {
        e.preventDefault();
        const patch = {
          tags: f.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
          settings: { graceSeconds: Math.max(0, Number(f.grace.value) || 0) },
        };
        if (f.blocklist) patch.blocklist = f.blocklist.value.split('\n').map((s) => s.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean);
        await engine.update(patch);
        el.querySelector('.saved').hidden = false;
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
