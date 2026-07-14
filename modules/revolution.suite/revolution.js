/* ═══════════════════════════════════════════════════════════════════
   THE HUMAN SEXUAL REVOLUTION (ONGOING) — shared nervous system
   revolution.js — plain script, no modules, no dependencies, no egress.

   EMOTIONAL TARGET: the site should feel ALIVE and completely
   trustworthy at the same time. Everything here runs locally.
   Nothing here phones home. That is the point, not a feature.

   Exposes one global: window.REV
     REV.state        threshold dials (localStorage, this device only)
     REV.mirrorball   the cursor optics (2ω·d — real disco physics)
     REV.audio        procedural disco bed + vinyl foley (opt-in)
     REV.fourthwall   the page notices you (once per room, earned)
     REV.scramble     SDF-spirit text scramble for glitch moments
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const REV = {};
  const PALETTE = ['#ff2e88', '#26e0e0', '#f5c518', '#c9a0ff', '#ff9ecb', '#39ff14', '#ff3d00'];

  /* ─────────────────────────────────────────────────────────────────
     STATE — the threshold dials.
     Membrane: rejects extraction. localStorage only. Close the tab
     on a shared machine? Use the "forget me" control on the gate.
     ──────────────────────────────────────────────────────────────── */
  const KEY = 'revolution.threshold.v1';
  const DEFAULTS = {
    adult: false,            // guards deck.html only
    depth: 'suggestive',     // 'suggestive' | 'frank'
    strobe: false,           // OFF by default. always.
    motion: 'full',          // 'full' | 'stilled'
    audio: false             // opt-in, never assumed
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? Object.assign({}, DEFAULTS, JSON.parse(raw)) : Object.assign({}, DEFAULTS);
    } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(REV.state)); } catch (e) { /* private mode: fine */ }
  }

  REV.state = loadState();
  REV.set = function (k, v) { REV.state[k] = v; saveState(); applyState(); };
  REV.forget = function () {
    try { localStorage.removeItem(KEY); sessionStorage.clear(); } catch (e) {}
    REV.state = Object.assign({}, DEFAULTS);
    applyState();
  };

  function applyState() {
    const doc = document.documentElement;
    const osReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    doc.dataset.motion = (REV.state.motion === 'stilled' || osReduced) ? 'stilled' : 'full';
    doc.dataset.depth = REV.state.depth;
    doc.dataset.strobe = REV.state.strobe ? 'on' : 'off';
  }
  REV.stilled = function () { return document.documentElement.dataset.motion === 'stilled'; };

  /* ─────────────────────────────────────────────────────────────────
     MIRRORBALL CURSOR — real optics, not confetti.

     A mirrorball is a sphere of planar facets. A fixed light hits it;
     each facet throws a spot. When the ball turns at ω, every
     reflected beam sweeps at 2ω (reflection doubles angular rate),
     so a spot at distance d moves at ≈ 2ω·d:
       specks near the cursor CRAWL, specks at the page edge RACE.
     Honoring that one relation is what makes it read as a real ball.

     Dark zones: any element with [data-lightless] extinguishes the
     ball while the pointer is inside it. Absence is a character —
     the cursor respects the rooms built from it.
     ──────────────────────────────────────────────────────────────── */
  const mirror = {
    canvas: null, ctx: null, dpr: 1,
    x: innerWidth / 2, y: innerHeight / 2,
    tx: innerWidth / 2, ty: innerHeight / 2,
    omega: 0.22,           // idle angular velocity (rad/s)
    omegaBoost: 0,         // pointer movement excites the ball
    t: 0, last: 0,
    dark: 0,               // 0 lit → 1 extinguished (eased)
    darkTarget: 0,
    specks: [],
    running: false
  };

  function mirrorInit() {
    if (mirror.canvas) return;
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:38;mix-blend-mode:screen;';
    document.body.appendChild(c);
    mirror.canvas = c;
    mirror.ctx = c.getContext('2d');
    mirrorResize();
    addEventListener('resize', mirrorResize);

    // ~78 facets, distributed on the sphere like a real ball's tile rows
    for (let i = 0; i < 78; i++) {
      const az = Math.random() * Math.PI * 2;          // facet azimuth
      const el = (Math.random() * 2 - 1);              // facet "row" −1..1
      mirror.specks.push({
        az: az,
        el: el,
        dBase: 0.06 + Math.pow(Math.random(), 1.7) * 0.94, // 0..1 of max radius
        hue: PALETTE[i % PALETTE.length],
        size: 1.2 + Math.random() * 2.2
      });
    }

    addEventListener('pointermove', function (e) {
      const dx = e.clientX - mirror.tx, dy = e.clientY - mirror.ty;
      mirror.tx = e.clientX; mirror.ty = e.clientY;
      mirror.omegaBoost = Math.min(1.1, mirror.omegaBoost + Math.hypot(dx, dy) * 0.004);
      const el = e.target && e.target.closest ? e.target.closest('[data-lightless]') : null;
      mirror.darkTarget = el ? 1 : 0;
    }, { passive: true });

    mirror.running = true;
    mirror.last = performance.now();
    requestAnimationFrame(mirrorFrame);
  }

  function mirrorResize() {
    mirror.dpr = Math.min(devicePixelRatio || 1, 2);
    mirror.canvas.width = innerWidth * mirror.dpr;
    mirror.canvas.height = innerHeight * mirror.dpr;
  }

  function mirrorFrame(now) {
    if (!mirror.running) return;
    const dt = Math.min(0.05, (now - mirror.last) / 1000);
    mirror.last = now;

    const ctx = mirror.ctx, dpr = mirror.dpr;
    ctx.clearRect(0, 0, mirror.canvas.width, mirror.canvas.height);

    if (REV.stilled()) {
      // Stilled: a faint static scatter remains as texture. No movement.
      drawSpecks(ctx, dpr, 0);
      requestAnimationFrame(mirrorFrame);
      return;
    }

    // ball glides after the pointer (a real ball has mass)
    mirror.x += (mirror.tx - mirror.x) * Math.min(1, dt * 7);
    mirror.y += (mirror.ty - mirror.y) * Math.min(1, dt * 7);

    mirror.omegaBoost *= Math.pow(0.2, dt);           // excitement decays
    const omega = mirror.omega + mirror.omegaBoost;
    mirror.t += dt * omega;

    mirror.dark += (mirror.darkTarget - mirror.dark) * Math.min(1, dt * 4);

    drawSpecks(ctx, dpr, mirror.t);
    requestAnimationFrame(mirrorFrame);
  }

  function drawSpecks(ctx, dpr, t) {
    const lit = 1 - mirror.dark;
    if (lit <= 0.02) return;
    const maxR = Math.hypot(innerWidth, innerHeight) * 0.42;
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < mirror.specks.length; i++) {
      const s = mirror.specks[i];
      // reflected beam sweeps at 2ω → angle advances at twice ball phase
      const ang = s.az + 2 * t;
      const d = s.dBase * maxR;
      // facet row tilts the throw off the horizontal — the classic ceiling/floor spray
      const px = mirror.x + Math.cos(ang) * d;
      const py = mirror.y + Math.sin(ang) * d * (0.55 + 0.45 * Math.abs(s.el)) + s.el * d * 0.28;
      if (px < -20 || px > innerWidth + 20 || py < -20 || py > innerHeight + 20) continue;

      // real optics: farther spots are dimmer (spread), not smaller
      const fade = (1 - s.dBase * 0.72) * lit;
      ctx.globalAlpha = 0.14 + fade * 0.5;
      ctx.fillStyle = s.hue;
      ctx.beginPath();
      ctx.arc(px * dpr, py * dpr, s.size * dpr, 0, 6.2832);
      ctx.fill();
    }

    // the ball itself: a small chrome presence riding the cursor
    ctx.globalAlpha = 0.85 * lit;
    const g = ctx.createRadialGradient(
      (mirror.x - 2) * dpr, (mirror.y - 3) * dpr, 1,
      mirror.x * dpr, mirror.y * dpr, 9 * dpr);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#b9c6d6');
    g.addColorStop(1, 'rgba(90,109,130,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mirror.x * dpr, mirror.y * dpr, 9 * dpr, 0, 6.2832);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  REV.mirrorball = { init: mirrorInit };

  /* ─────────────────────────────────────────────────────────────────
     AUDIO — a procedural disco bed. No files, nothing to license,
     nothing fetched. Built note by note in Web Audio, opt-in only.

     Scenes set intensity: threshold breathes, thefloor POUNDS,
     theriot is the one that goes silent — projector idle + mains hum.
     The cut back to the floor is the loudest moment in the site
     BECAUSE of that silence.
     ──────────────────────────────────────────────────────────────── */
  const BPM = 116;
  const audio = {
    ctx: null, master: null, comp: null,
    enabled: false, scene: 'hub', intensity: 0.4,
    nextBeat: 0, beatCount: 0, timer: null,
    hum: null, projector: null, drone: null,
    noiseBuf: null
  };

  const SCENES = {
    threshold: 0.16, hub: 0.45, ancestors: 0.25, thecode: 0.42,
    theriot: 0.0, thefloor: 1.0, deck: 0.7, ongoing: 0.5
  };

  function audioEnsure() {
    if (audio.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    audio.ctx = new AC();
    audio.comp = audio.ctx.createDynamicsCompressor();
    audio.comp.threshold.value = -18;
    audio.comp.ratio.value = 4;
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0;
    audio.master.connect(audio.comp).connect(audio.ctx.destination);

    // shared noise buffer (hats, crackle, projector)
    const len = audio.ctx.sampleRate * 2;
    audio.noiseBuf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const d = audio.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  function audioEnable(on) {
    audioEnsure();
    audio.enabled = on;
    REV.set('audio', on);
    if (on) {
      audio.ctx.resume();
      audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
      audio.master.gain.linearRampToValueAtTime(0.9, audio.ctx.currentTime + 0.8);
      startBed();
    } else {
      audio.master.gain.linearRampToValueAtTime(0, audio.ctx.currentTime + 0.5);
      stopBed();
    }
  }

  function startBed() {
    if (audio.timer) return;
    audio.nextBeat = audio.ctx.currentTime + 0.1;
    audio.beatCount = 0;
    audio.timer = setInterval(schedule, 40);
    startDrone();
    if (audio.scene === 'theriot') startRiotRoom();
  }
  function stopBed() {
    clearInterval(audio.timer); audio.timer = null;
    stopDrone(); stopRiotRoom();
  }

  const SPB = 60 / BPM; // seconds per beat

  function schedule() {
    if (!audio.enabled) return;
    while (audio.nextBeat < audio.ctx.currentTime + 0.12) {
      playBeat(audio.nextBeat, audio.beatCount);
      audio.nextBeat += SPB / 2;      // schedule in 8ths
      audio.beatCount++;
    }
  }

  function playBeat(t, n) {
    const I = audio.intensity;
    if (I <= 0.02) return;                        // theriot: the bed is gone
    const eighth = n % 2, beat = (n >> 1) % 4, bar = (n >> 3) % 2;

    // KICK — four on the floor, always, once intensity clears the floor
    if (eighth === 0 && I > 0.3) {
      const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(48, t + 0.11);
      g.gain.setValueAtTime(0.55 * I, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      o.connect(g).connect(audio.master);
      o.start(t); o.stop(t + 0.26);
    }

    // HATS — offbeat opens: the disco hiss
    if (I > 0.35) {
      const src = audio.ctx.createBufferSource();
      src.buffer = audio.noiseBuf;
      src.loop = true;
      const hp = audio.ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 8200;
      const g = audio.ctx.createGain();
      const open = eighth === 1;
      g.gain.setValueAtTime((open ? 0.16 : 0.06) * I, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.14 : 0.05));
      src.connect(hp).connect(g).connect(audio.master);
      src.start(t); src.stop(t + 0.16);
    }

    // BASSLINE — two-bar strut on E, lands on the octave. cheap & alive.
    if (eighth === 0 && I > 0.55) {
      const NOTES = [41.2, 41.2, 61.7, 41.2, 41.2, 82.4, 61.7, 49.0]; // E1 E1 B1 E1 E1 E2 B1 G1
      const f = NOTES[(bar * 4 + beat) % 8];
      const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.3 * I, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + SPB * 0.85);
      o.connect(g).connect(audio.master);
      o.start(t + 0.02); o.stop(t + SPB);
    }

    // SHIMMER — a high, slow sparkle on bar starts. barely there.
    if (n % 16 === 8 && I > 0.45) {
      const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
      const bp = audio.ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 6;
      o.type = 'sawtooth'; o.frequency.value = 1244;   // D#6-ish
      g.gain.setValueAtTime(0.05 * I, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      o.connect(bp).connect(g).connect(audio.master);
      o.start(t); o.stop(t + 1.5);
    }
  }

  // DRONE — the warm floor under everything (except the hole)
  function startDrone() {
    if (audio.drone || audio.intensity <= 0.02) return;
    const o1 = audio.ctx.createOscillator(), o2 = audio.ctx.createOscillator();
    const g = audio.ctx.createGain(), lp = audio.ctx.createBiquadFilter();
    o1.frequency.value = 82.4; o2.frequency.value = 82.9;  // E2, detuned — it breathes
    o1.type = o2.type = 'sine';
    lp.type = 'lowpass'; lp.frequency.value = 300;
    g.gain.value = 0.05 * Math.max(0.5, audio.intensity);
    o1.connect(lp); o2.connect(lp); lp.connect(g).connect(audio.master);
    o1.start(); o2.start();
    audio.drone = { o1: o1, o2: o2, g: g };
  }
  function stopDrone() {
    if (!audio.drone) return;
    try { audio.drone.o1.stop(); audio.drone.o2.stop(); } catch (e) {}
    audio.drone = null;
  }

  // THE HOLE — projector idling with no film in the gate, 60Hz mains.
  // The one room that is quiet. The quiet is an instrument.
  function startRiotRoom() {
    if (audio.hum) return;
    const hum = audio.ctx.createOscillator(), humG = audio.ctx.createGain();
    hum.frequency.value = 60; humG.gain.value = 0.015;
    const hum2 = audio.ctx.createOscillator(), hum2G = audio.ctx.createGain();
    hum2.frequency.value = 120; hum2G.gain.value = 0.008;
    hum.connect(humG).connect(audio.master);
    hum2.connect(hum2G).connect(audio.master);
    hum.start(); hum2.start();

    const src = audio.ctx.createBufferSource();
    src.buffer = audio.noiseBuf; src.loop = true;
    const lp = audio.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = audio.ctx.createGain(); g.gain.value = 0.012;
    const flutter = audio.ctx.createOscillator(), fg = audio.ctx.createGain();
    flutter.frequency.value = 18;                 // the motor's little heartbeat
    fg.gain.value = 0.006;
    flutter.connect(fg).connect(g.gain);
    src.connect(lp).connect(g).connect(audio.master);
    src.start(); flutter.start();

    audio.hum = { hum: hum, hum2: hum2, src: src, flutter: flutter };
  }
  function stopRiotRoom() {
    if (!audio.hum) return;
    const h = audio.hum;
    try { h.hum.stop(); h.hum2.stop(); h.src.stop(); h.flutter.stop(); } catch (e) {}
    audio.hum = null;
  }

  // VINYL FOLEY ------------------------------------------------------
  function crackle(dur) {
    if (!audio.enabled) return;
    dur = dur || 0.6;
    const t0 = audio.ctx.currentTime;
    const buf = audio.ctx.createBuffer(1, audio.ctx.sampleRate * dur, audio.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      // sparse pops over faint surface noise — a record, not static
      d[i] = (Math.random() < 0.0016 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.02);
    }
    const src = audio.ctx.createBufferSource(); src.buffer = buf;
    const lp = audio.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    const g = audio.ctx.createGain(); g.gain.value = 0.5;
    src.connect(lp).connect(g).connect(audio.master);
    src.start(t0);
  }
  function thunk() {
    if (!audio.enabled) return;
    const t0 = audio.ctx.currentTime;
    const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
    o.frequency.setValueAtTime(110, t0);
    o.frequency.exponentialRampToValueAtTime(55, t0 + 0.09);
    g.gain.setValueAtTime(0.4, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
    o.connect(g).connect(audio.master);
    o.start(t0); o.stop(t0 + 0.2);
  }

  function setScene(name) {
    audio.scene = name;
    audio.intensity = (name in SCENES) ? SCENES[name] : 0.4;
    if (!audio.enabled || !audio.ctx) return;
    if (name === 'theriot') { stopDrone(); startRiotRoom(); }
    else { stopRiotRoom(); startDrone(); }
  }

  // one-shot preview tone for turntable band hover (2s lead-in feel)
  function preview(freq) {
    if (!audio.enabled) return;
    audioEnsure();
    const t0 = audio.ctx.currentTime;
    const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    o.connect(g).connect(audio.master);
    o.start(t0); o.stop(t0 + 1.5);
  }

  REV.audio = {
    enable: audioEnable,
    enabled: function () { return audio.enabled; },
    setScene: setScene,
    crackle: crackle,
    thunk: thunk,
    preview: preview
  };

  /* ─────────────────────────────────────────────────────────────────
     FOURTH WALL — the page notices you.
     Budget: ONCE per room, EVER (sessionStorage). Never on entry —
     only after ~45s of presence or a deep scroll. Earned by attention.
     ──────────────────────────────────────────────────────────────── */
  const FW_LINES = {
    ancestors: 'you are reading a document about people who were told not to exist. hi.',
    thecode:   'you are not a container. you\u2019re a circulation pattern the universe is briefly doing.',
    thefloor:  'the boundary that matters isn\u2019t self and other. it\u2019s coherent flow vs. extractive collapse.',
    deck:      'knowe thyself. the flaps were always meant to be lifted.',
    ongoing:   'nothing here is tracking you. sit as long as you like. the loop completes when you leave and do something.'
  };

  function fourthwallArm(room) {
    const line = FW_LINES[room];
    if (!line) return;
    let fired = false;
    try { fired = sessionStorage.getItem('fw.' + room) === '1'; } catch (e) {}
    if (fired) return;

    let dwellHit = false, scrollHit = false, done = false;
    const timer = setTimeout(function () { dwellHit = true; maybe(); }, 45000);
    function onScroll() {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max > 200 && scrollY / max > 0.7) { scrollHit = true; maybe(); }
    }
    addEventListener('scroll', onScroll, { passive: true });

    function maybe() {
      if (done || !(dwellHit || scrollHit)) return;
      done = true;
      clearTimeout(timer);
      removeEventListener('scroll', onScroll);
      try { sessionStorage.setItem('fw.' + room, '1'); } catch (e) {}
      speak(line);
    }
  }

  function speak(line) {
    // the tear first — reality coming apart at one seam
    const tear = document.createElement('div');
    tear.className = 'tear';
    document.body.appendChild(tear);
    requestAnimationFrame(function () { tear.classList.add('go'); });

    const el = document.createElement('div');
    el.className = 'fourthwall';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);

    setTimeout(function () {
      el.classList.add('torn');
      scramble(el, line, 900);
      setTimeout(function () { el.remove(); tear.remove(); }, 8000);
    }, REV.stilled() ? 0 : 420);
  }

  REV.fourthwall = { arm: fourthwallArm, speak: speak };

  /* ─────────────────────────────────────────────────────────────────
     SCRAMBLE — glyphs resolve into the message, oldest trick in the
     Grimoire. Stilled mode just sets the text. Nothing is lost.
     ──────────────────────────────────────────────────────────────── */
  const GLYPHS = '!<>-_\\/[]{}—=+*^?#Δ∞æ§';
  function scramble(el, text, dur) {
    if (REV.stilled()) { el.textContent = text; return; }
    dur = dur || 800;
    const start = performance.now();
    (function frame(now) {
      const p = Math.min(1, (now - start) / dur);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        out += (i / text.length < p)
          ? text[i]
          : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
    })(start);
  }
  REV.scramble = scramble;

  /* ─────────────────────────────────────────────────────────────────
     BOOT — atmosphere layers + audio toggle, shared by every room.
     ──────────────────────────────────────────────────────────────── */
  REV.boot = function (opts) {
    opts = opts || {};
    applyState();

    // atmosphere (unless a room opts out — theriot keeps only grain)
    if (!opts.bare) {
      ['velvet', 'scanlines', 'grain'].forEach(function (cls) {
        if (opts.skip && opts.skip.indexOf(cls) !== -1) return;
        const d = document.createElement('div');
        d.className = cls;
        d.setAttribute('aria-hidden', 'true');
        document.body.appendChild(d);
      });
    }

    // the mirrorball rides every room; it goes dark over [data-lightless]
    if (!opts.noBall) mirrorInit();

    // audio toggle — visible, honest, opt-in
    if (!opts.noAudioToggle) {
      const b = document.createElement('button');
      b.className = 'audio-toggle';
      b.setAttribute('aria-pressed', String(REV.state.audio));
      b.setAttribute('aria-label', 'Sound on or off. Sound is built live in your browser; nothing is downloaded.');
      b.textContent = REV.state.audio ? '♪' : '∅';
      b.addEventListener('click', function () {
        const on = !(REV.audio.enabled());
        REV.audio.enable(on);
        b.setAttribute('aria-pressed', String(on));
        b.textContent = on ? '♪' : '∅';
      });
      document.body.appendChild(b);
      // returning visitor who already opted in: honor it on first gesture
      if (REV.state.audio) {
        const once = function () {
          REV.audio.enable(true);
          b.setAttribute('aria-pressed', 'true'); b.textContent = '♪';
          removeEventListener('pointerdown', once);
          removeEventListener('keydown', once);
        };
        addEventListener('pointerdown', once);
        addEventListener('keydown', once);
      }
    }

    if (opts.scene) setScene(opts.scene);
    if (opts.room) fourthwallArm(opts.room);
  };

  window.REV = REV;
})();
