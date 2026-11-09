// Ambient focus sounds, synthesized with the Web Audio API (no audio files, nothing downloaded).
export const SOUNDS = {
  off: 'No sound',
  rain: '🌧️ Rain',
  stream: '🏞️ Stream',
  wind: '🌬️ Wind',
  fire: '🔥 Campfire',
  brown: '🟤 Brown noise',
};

const FADE = 0.6; // seconds

export function createAmbient() {
  let ctx = null, master = null, current = null, layer = null;

  function ensure() {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  // Looping noise buffer: white, pink (Paul Kellet's filter) or brown (integrated white noise).
  function noise(type) {
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const out = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else if (type === 'brown') {
        last = (last + 0.02 * w) / 1.02; out[i] = last * 3.5;
      } else out[i] = w;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    return src;
  }

  const filter = (type, freq, Q = 0.7) => {
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = Q; return f;
  };
  const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const lfo = (rate, depth, target) => {
    const o = ctx.createOscillator(); o.frequency.value = rate;
    const g = gain(depth); o.connect(g).connect(target); o.start(); return o;
  };

  // Each recipe builds a small graph into `out` and returns a stop function.
  const RECIPES = {
    rain(out) {
      const n = noise('pink'), hp = filter('highpass', 500), lp = filter('lowpass', 7000), g = gain(0.9);
      n.connect(hp).connect(lp).connect(g).connect(out); n.start();
      const drops = noise('white'), bp = filter('bandpass', 3200, 1.2), dg = gain(0.12);
      drops.connect(bp).connect(dg).connect(out); drops.start();
      const l = lfo(0.15, 0.06, dg.gain);
      return () => [n, drops, l].forEach((s) => s.stop());
    },
    stream(out) {
      const n = noise('white'), bp = filter('bandpass', 1100, 0.6), lp = filter('lowpass', 3000), g = gain(0.35);
      n.connect(bp).connect(lp).connect(g).connect(out); n.start();
      const l1 = lfo(0.4, 350, bp.frequency), l2 = lfo(2.3, 0.08, g.gain);
      return () => [n, l1, l2].forEach((s) => s.stop());
    },
    wind(out) {
      const n = noise('pink'), bp = filter('bandpass', 450, 1.4), g = gain(0.9);
      n.connect(bp).connect(g).connect(out); n.start();
      const l1 = lfo(0.09, 280, bp.frequency), l2 = lfo(0.06, 0.45, g.gain);
      return () => [n, l1, l2].forEach((s) => s.stop());
    },
    fire(out) {
      const n = noise('brown'), lp = filter('lowpass', 500), g = gain(0.7);
      n.connect(lp).connect(g).connect(out); n.start();
      // Crackles: short, randomly timed bursts of high noise.
      const c = noise('white'), hp = filter('highpass', 2500), cg = gain(0);
      c.connect(hp).connect(cg).connect(out); c.start();
      let alive = true;
      const crackle = () => {
        if (!alive) return;
        const t = ctx.currentTime, peak = 0.15 + Math.random() * 0.35;
        cg.gain.setValueAtTime(peak, t);
        cg.gain.exponentialRampToValueAtTime(0.001, t + 0.02 + Math.random() * 0.05);
        setTimeout(crackle, 40 + Math.random() * (Math.random() < 0.2 ? 900 : 260));
      };
      crackle();
      return () => { alive = false; n.stop(); c.stop(); };
    },
    brown(out) {
      const n = noise('brown'), lp = filter('lowpass', 900), g = gain(0.9);
      n.connect(lp).connect(g).connect(out); n.start();
      return () => n.stop();
    },
  };

  function stopLayer(fadeOut) {
    if (!layer) return;
    const { bus, stop } = layer;
    layer = null;
    const t = ctx.currentTime;
    bus.gain.setTargetAtTime(0, t, fadeOut ? FADE / 3 : 0.01);
    setTimeout(() => { stop(); bus.disconnect(); }, fadeOut ? FADE * 1000 * 2 : 50);
  }

  return {
    // Starts (or switches to) a sound. Calling again with the same kind only changes the volume.
    play(kind, volume = 0.5) {
      if (!RECIPES[kind]) return this.stop();
      ensure();
      master.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), ctx.currentTime, FADE / 3);
      if (current === kind && layer) return;
      stopLayer(true);
      const bus = gain(0);
      bus.connect(master);
      layer = { bus, stop: RECIPES[kind](bus) };
      bus.gain.setTargetAtTime(1, ctx.currentTime, FADE / 3);
      current = kind;
    },
    stop() {
      if (!ctx || !layer) { current = null; return; }
      stopLayer(true);
      current = null;
    },
    // Browsers start audio suspended until the page gets a click; call this from a user gesture.
    unlock() { if (ctx?.state === 'suspended') ctx.resume().catch(() => {}); },
    get playing() { return current; },
  };
}
