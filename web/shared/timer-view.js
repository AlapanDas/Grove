// Shared focus-timer UI. The host supplies how to start, pause, give up and settle sessions.
import { SPECIES, speciesById } from './species.js';
import { renderPlant } from './plant.js';
import { fmtClock } from './stats.js';
import { esc } from './dashboard.js';
import { remaining, progress, pauseLeft, breakActive } from './engine.js';
import { SOUNDS } from './ambient.js';

const soundSelect = (d, cls = '') => `<select name="sound" class="${cls}" aria-label="Ambient sound">${Object.entries(SOUNDS).map(([k, l]) =>
  `<option value="${k}" ${k === d.settings.sound ? 'selected' : ''}>${l}</option>`).join('')}</select>`;

export function mountTimer(el, {
  getData, start, giveUp, settle, pause, resume, endBreak, saveSettings, onData, onFinish, onBreakEnd, hint = '',
}) {
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
      if (s) { onFinish?.(s); return renderResult(s, d); }
    }
    if (breakActive(d)) return renderBreak(d);
    renderSetup(d);
  }

  function wireSound(d) {
    const sel = el.querySelector('[name=sound]');
    if (sel) sel.onchange = () => saveSettings({ settings: { sound: sel.value } });
  }

  function renderSetup(d) {
    pick.minutes ??= d.settings.defaultMinutes;
    if (!d.owned.includes(pick.species)) pick.species = d.owned[0];
    const pomo = d.settings.pomodoro;
    const breakOver = d.break && !breakActive(d);
    const nextBreak = () => {
      const round = (Date.now() - d.pomo.lastAt > 3 * 3600000 ? 0 : d.pomo.round) + 1;
      const long = round % Math.max(1, pomo.longEvery) === 0;
      return `🍅 Round ${round} · then a ${long ? pomo.longBreak : pomo.shortBreak}-minute ${long ? 'long ' : ''}break`;
    };
    el.innerHTML = `
      ${breakOver ? `<p class="banner">☕ Break's over. Ready for round ${d.break.round + 1}?</p>` : ''}
      <div class="plant-wrap">${renderPlant(speciesById(pick.species), 1, 'grown')}</div>
      <div class="clock">${fmtClock(pick.minutes * 60000)}</div>
      <input type="range" min="5" max="180" step="5" value="${pick.minutes}" aria-label="Focus minutes">
      <div class="row">
        <div class="combo">
          <select name="species" aria-label="Species">${SPECIES.filter((s) => d.owned.includes(s.id)).map((s) =>
            `<option value="${s.id}" ${s.id === pick.species ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
          <button type="button" class="icon-btn" data-random title="Random species" aria-label="Pick a random species">🎲</button>
        </div>
        <select name="tag" aria-label="Tag"><option value="">No tag</option>${d.tags.map((t) =>
          `<option ${t === pick.tag ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      </div>
      <div class="row">
        <label class="chip"><input type="checkbox" data-pomo ${pomo.enabled ? 'checked' : ''}> 🍅 Pomodoro breaks</label>
        ${soundSelect(d)}
      </div>
      <p class="sub pomo-line" ${pomo.enabled ? '' : 'hidden'}>${nextBreak()}</p>
      <div class="row"><button data-start>Plant &amp; focus</button></div>
      <p class="sub">${esc(hint)}</p>`;

    const wrap = el.querySelector('.plant-wrap');
    const speciesSel = el.querySelector('[name=species]');
    const showPlant = (animate) => {
      wrap.innerHTML = renderPlant(speciesById(pick.species), 1, 'grown');
      if (animate) { wrap.classList.remove('pop'); void wrap.offsetWidth; wrap.classList.add('pop'); }
    };
    const range = el.querySelector('input[type=range]');
    range.oninput = () => { pick.minutes = +range.value; el.querySelector('.clock').textContent = fmtClock(pick.minutes * 60000); };
    speciesSel.onchange = (e) => { pick.species = e.target.value; showPlant(false); };
    el.querySelector('[data-random]').onclick = () => {
      const pool = d.owned.filter((id) => id !== pick.species);
      if (!pool.length) return;
      pick.species = pool[Math.floor(Math.random() * pool.length)];
      speciesSel.value = pick.species;
      showPlant(true);
    };
    el.querySelector('[name=tag]').onchange = (e) => (pick.tag = e.target.value);
    el.querySelector('[data-pomo]').onchange = async (e) => {
      d.settings.pomodoro.enabled = e.target.checked;
      el.querySelector('.pomo-line').hidden = !e.target.checked;
      el.querySelector('.pomo-line').textContent = nextBreak();
      await saveSettings({ settings: { pomodoro: { enabled: e.target.checked } } });
    };
    wireSound(d);
    el.querySelector('[data-start]').onclick = async () => { await start({ ...pick }); render(); };
  }

  function renderActive(d) {
    const a = d.active;
    lastActiveId = a.id;
    const sp = speciesById(a.species);
    const paused = !!a.pausedAt;
    const pomo = d.settings.pomodoro.enabled;
    el.innerHTML = `
      <div class="plant-wrap ${paused ? 'paused' : ''}"></div>
      <div class="clock ${paused ? 'dim' : ''}"></div>
      <p class="sub status"></p>
      <div class="row">
        <button class="ghost" data-pause>${paused ? '▶ Resume' : '⏸ Pause'}</button>
        <button class="ghost" data-giveup>Give up</button>
      </div>
      <div class="row">${soundSelect(d, 'small')}</div>`;
    const wrap = el.querySelector('.plant-wrap');
    const clock = el.querySelector('.clock');
    const status = el.querySelector('.status');
    const lead = `${pomo ? '🍅 ' : ''}${a.tag ? esc(a.tag) + ' · ' : ''}`;
    let lastStage = -1;
    const tick = async () => {
      const now = Date.now();
      const left = remaining(a, now);
      clock.textContent = fmtClock(left);
      const stage = Math.floor(progress(a, now) * 40); // re-render the SVG ~40 times per session
      if (stage !== lastStage) { lastStage = stage; wrap.innerHTML = renderPlant(sp, progress(a, now), 'growing'); }
      if (paused) {
        const pl = pauseLeft(a, now);
        status.innerHTML = `${lead}⏸ Paused. Your ${esc(sp.name)} resumes growing in ${fmtClock(pl)}.`;
        if (pl <= 0) { clearInterval(timer); render(); }
      } else {
        status.innerHTML = `${lead}Stay focused. Your ${esc(sp.name)} is growing.`;
        if (left <= 0) { clearInterval(timer); await settle(); render(); }
      }
    };
    tick();
    timer = setInterval(tick, 1000);
    el.querySelector('[data-pause]').onclick = async () => { await (paused ? resume() : pause()); render(); };
    el.querySelector('[data-giveup]').onclick = async () => {
      if (!confirm(`Give up? Your ${sp.name} will wither.`)) return;
      await giveUp(); render();
    };
    wireSound(d);
  }

  function renderBreak(d) {
    const b = d.break;
    const last = [...d.sessions].reverse().find((s) => s.status === 'success');
    el.innerHTML = `
      <div class="plant-wrap resting">${last ? renderPlant(speciesById(last.species), 1, 'grown') : ''}<span class="steam">☕</span></div>
      <div class="clock"></div>
      <p class="sub"><b>${b.kind === 'long' ? 'Long break' : 'Short break'}</b> · round ${b.round} done.
        Stand up, stretch, drink some water and rest your eyes. Nothing withers during a break.</p>
      <div class="row"><button class="ghost" data-skip>Skip break</button></div>`;
    const clock = el.querySelector('.clock');
    const tick = () => {
      const left = b.end - Date.now();
      clock.textContent = fmtClock(left);
      if (left <= 0) { clearInterval(timer); onBreakEnd?.(b); render(); }
    };
    tick();
    timer = setInterval(tick, 1000);
    el.querySelector('[data-skip]').onclick = async () => { await endBreak(); render(); };
  }

  function renderResult(s, d) {
    const sp = speciesById(s.species);
    const ok = s.status === 'success';
    const onBreak = ok && breakActive(d);
    el.innerHTML = `
      <div class="plant-wrap">${renderPlant(sp, 1, ok ? 'grown' : 'withered')}</div>
      <h2>${ok ? 'Fully grown! 🌳' : 'Your plant withered 🥀'}</h2>
      <p class="sub">${ok ? `${s.minutes} minutes focused` :
        s.reason === 'left' ? 'You left the focus page for too long.' : 'You gave up this session.'}</p>
      ${ok && s.unlocked?.length ? `<p class="unlock-msg">🎉 New species earned: ${s.unlocked.map((id) => esc(speciesById(id).name)).join(', ')}</p>` : ''}
      ${onBreak ? `<p class="banner">☕ Time for a ${d.break.minutes}-minute ${d.break.kind === 'long' ? 'long ' : ''}break.</p>` : ''}
      <div class="row">${onBreak
        ? '<button data-break>Take the break</button><button class="ghost" data-again>Skip &amp; plant another</button>'
        : '<button data-again>Plant another</button>'}</div>`;
    el.querySelector('[data-again]').onclick = async () => { if (onBreak) await endBreak(); renderSetup(await getData()); };
    el.querySelector('[data-break]')?.addEventListener('click', () => render());
  }

  render();
  return { render };
}
