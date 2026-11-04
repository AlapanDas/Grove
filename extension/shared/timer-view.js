// Shared focus-timer UI. The host supplies how to start, give up and settle sessions.
import { SPECIES, speciesById } from './species.js';
import { renderPlant } from './plant.js';
import { fmtClock } from './stats.js';
import { esc } from './dashboard.js';

export function mountTimer(el, { getData, start, giveUp, settle, onData, onFinish, hint = '' }) {
  let timer = null;
  let lastActiveId = null;
  let pick = { minutes: null, species: null, tag: '' };

  async function render() {
    const d = await getData();
    onData?.(d);
    clearInterval(timer);
    if (d.active) return renderActive(d);
    if (lastActiveId) {
      const s = d.sessions.find((x) => x.id === lastActiveId);
      lastActiveId = null;
      if (s) { onFinish?.(s); return renderResult(s); }
    }
    renderSetup(d);
  }

  function renderSetup(d) {
    pick.minutes ??= d.settings.defaultMinutes;
    if (!d.owned.includes(pick.species)) pick.species = d.owned[0];
    el.innerHTML = `
      <div class="plant-wrap">${renderPlant(speciesById(pick.species), 1, 'grown')}</div>
      <div class="clock">${fmtClock(pick.minutes * 60000)}</div>
      <input type="range" min="5" max="180" step="5" value="${pick.minutes}" aria-label="Focus minutes">
      <div class="row">
        <select name="species" aria-label="Species">${SPECIES.filter((s) => d.owned.includes(s.id)).map((s) =>
          `<option value="${s.id}" ${s.id === pick.species ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
        <select name="tag" aria-label="Tag"><option value="">No tag</option>${d.tags.map((t) =>
          `<option ${t === pick.tag ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      </div>
      <div class="row"><button data-start>Plant &amp; focus</button></div>
      <p class="sub">${esc(hint)}</p>`;
    const range = el.querySelector('input[type=range]');
    range.oninput = () => { pick.minutes = +range.value; el.querySelector('.clock').textContent = fmtClock(pick.minutes * 60000); };
    el.querySelector('[name=species]').onchange = (e) => {
      pick.species = e.target.value;
      el.querySelector('.plant-wrap').innerHTML = renderPlant(speciesById(pick.species), 1, 'grown');
    };
    el.querySelector('[name=tag]').onchange = (e) => (pick.tag = e.target.value);
    el.querySelector('[data-start]').onclick = async () => { await start({ ...pick }); render(); };
  }

  function renderActive(d) {
    const a = d.active;
    lastActiveId = a.id;
    const sp = speciesById(a.species);
    el.innerHTML = `
      <div class="plant-wrap"></div>
      <div class="clock"></div>
      <p class="sub">${a.tag ? esc(a.tag) + ' · ' : ''}Stay focused. Your ${sp.name} is growing.</p>
      <div class="row"><button class="ghost" data-giveup>Give up</button></div>`;
    const wrap = el.querySelector('.plant-wrap');
    const clock = el.querySelector('.clock');
    let lastStage = -1;
    const tick = async () => {
      const left = a.end - Date.now();
      clock.textContent = fmtClock(left);
      const p = 1 - left / (a.end - a.start);
      const stage = Math.floor(p * 40); // re-render the SVG ~40 times per session
      if (stage !== lastStage) { lastStage = stage; wrap.innerHTML = renderPlant(sp, p, 'growing'); }
      if (left <= 0) { clearInterval(timer); await settle(); render(); }
    };
    tick();
    timer = setInterval(tick, 1000);
    el.querySelector('[data-giveup]').onclick = async () => {
      if (!confirm(`Give up? Your ${sp.name} will wither.`)) return;
      await giveUp(); render();
    };
  }

  function renderResult(s) {
    const sp = speciesById(s.species);
    const ok = s.status === 'success';
    el.innerHTML = `
      <div class="plant-wrap">${renderPlant(sp, 1, ok ? 'grown' : 'withered')}</div>
      <h2>${ok ? 'Fully grown! 🌳' : 'Your plant withered 🥀'}</h2>
      <p class="sub">${ok ? `${s.minutes} minutes focused` :
        s.reason === 'left' ? 'You left the focus page for too long.' : 'You gave up this session.'}</p>
      ${ok && s.unlocked?.length ? `<p class="unlock-msg">🎉 New species earned: ${s.unlocked.map((id) => esc(speciesById(id).name)).join(', ')}</p>` : ''}
      <div class="row"><button data-again>Plant another</button></div>`;
    el.querySelector('[data-again]').onclick = () => renderSetup0();
  }
  const renderSetup0 = async () => renderSetup(await getData());

  render();
  return { render };
}
