# Grove: a focus-timer website and Chrome extension

Grow a plant while you focus. Give up, or leave to get distracted, and it withers.

## Layout
- `shared/` is the single source of truth: the session engine, original SVG plant art, stats, the timer UI and the dashboard (Grove/Stats/Collection/Settings).
- `extension/` is a Chrome MV3 extension: a popup timer, site blocking (declarativeNetRequest redirect), alarms, notifications, and a full app page.
- `web/` holds the landing page (`index.html`) and the web app (`app.html`). The web app withers your plant if the tab stays hidden longer than the grace period.

Edit files in `shared/`, then run `npm run sync` to copy them into `extension/shared` and `web/shared`.

## Run
- Website: `npm run dev` (uses the built-in `python3 -m http.server`), then open http://localhost:5173
- Extension: open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select `extension/`

## Next steps
Accounts and cross-device sync (for example Supabase), group "plant together" rooms, ambient sounds, allowlist mode, and Firefox support.
