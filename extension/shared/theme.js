// Light / dark theme. Loaded as a classic <script> in <head> so the saved theme applies before first paint.
// 'system' (the default) follows the OS setting. Any element with [data-theme-toggle] flips light <-> dark.
(() => {
  const KEY = 'grove-theme';
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');

  const get = () => { try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; } };
  const effective = (t = get()) => (t === 'system' ? (media.matches ? 'dark' : 'light') : t);

  function label() {
    const dark = effective() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
      b.textContent = dark ? '☀️' : '🌙';
      b.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
      b.setAttribute('aria-label', b.title);
    });
    document.querySelectorAll('select[data-theme-select]').forEach((s) => (s.value = get()));
  }
  function apply(t) {
    if (t === 'system') root.removeAttribute('data-theme'); else root.dataset.theme = t;
    label();
  }
  function set(t) {
    try { if (t === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch {}
    apply(t);
  }

  apply(get());
  window.groveTheme = { get, set, effective, toggle: () => set(effective() === 'dark' ? 'light' : 'dark'), refresh: label };

  document.addEventListener('DOMContentLoaded', label);
  document.addEventListener('click', (e) => { if (e.target.closest?.('[data-theme-toggle]')) window.groveTheme.toggle(); });
  document.addEventListener('change', (e) => { if (e.target.matches?.('select[data-theme-select]')) set(e.target.value); });
  media.addEventListener('change', label);
  addEventListener('storage', (e) => { if (e.key === KEY) apply(get()); }); // keep other open tabs in sync
})();
