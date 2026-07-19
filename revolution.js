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
    audio: false,            // opt-in, never assumed
    theme: 'light'           // 'light' | 'dark' — the corner light switch
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
    // the global light switch. Never overrides a room that hard-codes its
    // own dark ground (theriot) — that lives on data-ground, not data-theme.
    if (REV.state.theme === 'dark') doc.dataset.theme = 'disco';
    else doc.removeAttribute('data-theme');
    // keep the mirrorball's blend in step with the ground, live on toggle
    if (mirror && mirror.canvas) {
      var dk = doc.dataset.ground === 'dark' || doc.dataset.theme === 'disco';
      mirror.canvas.style.mixBlendMode = dk ? 'screen' : 'multiply';
    }
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
    rx: 0,                 // audio-reactive shimmer (0..1, from the highs)
    trail: [],             // recent ball positions → a fading comet trail
    specks: [],
    running: false,
    // ── mobile touch language ──────────────────────────────────────
    coarse: false,         // touch device (no hover/drag cursor)
    touchI: 1,             // per-room intensity (louder in the dark rooms)
    bursts: [],            // transient tap / hold-release light sparks
    touches: {},           // active touch nodes (id → {x,y}) for the constellation
    charge: null,          // {x,y,t0} while a finger presses & holds
    wander: 0,             // ambient drift phase when idle on mobile
    lastTouch: 0           // timestamp of last touch, to resume the wander
  };

  function mirrorInit() {
    if (mirror.canvas) return;
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    // On the white ground the specks must DARKEN to be seen (multiply);
    // in the dark carve-out rooms they GLOW (screen). 2ω·d physics is
    // identical either way — only the compositing flips.
    var ds = document.documentElement.dataset;
    var darkGround = ds.ground === 'dark' || ds.theme === 'disco';
    c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:38;mix-blend-mode:'
      + (darkGround ? 'screen' : 'multiply') + ';';
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

    // ── MOBILE TOUCH LANGUAGE — the ball answers fingers instead of a cursor:
    //    tap → light burst, hold → charge & release, idle → wander, and
    //    multi-touch → a constellation. All passive (never blocks scroll/taps)
    //    and quiet in lightless rooms + reduced motion. ──────────────────────
    mirror.coarse = !!(window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches);
    mirror.touchI = darkGround ? 1.0 : 0.62;   // subtler over the light reading rooms
    if (mirror.coarse) {
      const setDark = function (target) {
        const el = target && target.closest ? target.closest('[data-lightless]') : null;
        mirror.darkTarget = el ? 1 : 0;
      };
      const burst = function (x, y, power) {
        const n = Math.round((6 + power * 11) * mirror.touchI);
        for (let i = 0; i < n; i++) {
          const a = Math.random() * 6.2832, sp = (44 + Math.random() * 190) * (0.55 + power);
          mirror.bursts.push({
            x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 1, hue: PALETTE[(Math.random() * PALETTE.length) | 0],
            size: (1.4 + Math.random() * 2.6) * (0.7 + power * 0.6)
          });
        }
        if (mirror.bursts.length > 300) mirror.bursts.splice(0, mirror.bursts.length - 300);
      };
      const onStart = function (e) {
        if (REV.stilled()) return;
        const t = e.changedTouches[0];
        mirror.tx = t.clientX; mirror.ty = t.clientY; mirror.lastTouch = performance.now();
        setDark(t.target);
        burst(t.clientX, t.clientY, 0.32 + bands().level * 0.5);
        mirror.omegaBoost = Math.min(1.4, mirror.omegaBoost + 0.5);
        // hold-charge, unless the finger landed on the platter or a control (they own their own press)
        const own = t.target && t.target.closest ? t.target.closest('#table, a, button, input, select, textarea, [role="button"], .now-playing, .audio-toggle, .light-switch') : null;
        if (!own) mirror.charge = { x: t.clientX, y: t.clientY, t0: performance.now() };
        for (let i = 0; i < e.touches.length; i++) { const tt = e.touches[i]; mirror.touches[tt.identifier] = { x: tt.clientX, y: tt.clientY }; }
      };
      const onMove = function (e) {
        if (REV.stilled()) return;
        const t = e.touches[0];
        mirror.tx = t.clientX; mirror.ty = t.clientY; mirror.lastTouch = performance.now();
        setDark(t.target);
        if (mirror.charge && Math.hypot(t.clientX - mirror.charge.x, t.clientY - mirror.charge.y) > 14) mirror.charge = null; // a drag/scroll cancels the charge
        for (let i = 0; i < e.touches.length; i++) { const tt = e.touches[i]; mirror.touches[tt.identifier] = { x: tt.clientX, y: tt.clientY }; }
      };
      const onEnd = function (e) {
        mirror.lastTouch = performance.now();
        if (mirror.charge) {
          const held = (performance.now() - mirror.charge.t0) / 1000;
          if (held > 0.25 && !REV.stilled()) burst(mirror.charge.x, mirror.charge.y, Math.min(1.2, 0.45 + held * 0.7));
          mirror.charge = null;
        }
        const active = {};
        for (let i = 0; i < e.touches.length; i++) { const tt = e.touches[i]; active[tt.identifier] = { x: tt.clientX, y: tt.clientY }; }
        mirror.touches = active;
      };
      addEventListener('touchstart', onStart, { passive: true });
      addEventListener('touchmove', onMove, { passive: true });
      addEventListener('touchend', onEnd, { passive: true });
      addEventListener('touchcancel', onEnd, { passive: true });
    }

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
      mirror.rx = 0; mirror.trail.length = 0;
      mirror.bursts.length = 0; mirror.charge = null; mirror.touches = {};
      drawSpecks(ctx, dpr, 0);
      requestAnimationFrame(mirrorFrame);
      return;
    }

    // MOBILE IDLE WANDER — with no cursor to follow, the ball drifts on its own
    // so the screen is never dead; any touch (which stamps lastTouch) reclaims it.
    if (mirror.coarse && !mirror.charge && (now - mirror.lastTouch) > 1600) {
      mirror.wander += dt * 0.45;
      const cx = innerWidth * 0.5, cy = innerHeight * 0.42, ax = innerWidth * 0.3, ay = innerHeight * 0.24;
      mirror.tx = cx + Math.cos(mirror.wander) * ax + Math.cos(mirror.wander * 1.7) * ax * 0.25;
      mirror.ty = cy + Math.sin(mirror.wander * 1.3) * ay + Math.sin(mirror.wander * 0.6) * ay * 0.35;
    }

    // ball glides after the pointer (a real ball has mass)
    mirror.x += (mirror.tx - mirror.x) * Math.min(1, dt * 7);
    mirror.y += (mirror.ty - mirror.y) * Math.min(1, dt * 7);
    mirror.trail.push({ x: mirror.x, y: mirror.y });
    if (mirror.trail.length > 10) mirror.trail.shift();

    mirror.omegaBoost *= Math.pow(0.2, dt);           // excitement decays
    const omega = mirror.omega + mirror.omegaBoost;
    mirror.t += dt * omega;

    mirror.dark += (mirror.darkTarget - mirror.dark) * Math.min(1, dt * 4);

    // the music lifts the scatter: brighter/larger on the highs, and the loud
    // parts excite the ball so the whole spray sweeps faster with the track
    const rb = bands(now);
    mirror.rx += (rb.high - mirror.rx) * Math.min(1, dt * 8);
    mirror.omegaBoost += rb.level * dt * 3.2;

    // a held finger keeps the ball spinning up (the charge gathers energy)
    if (mirror.charge) mirror.omegaBoost = Math.min(1.6, mirror.omegaBoost + dt * 1.3);

    // advance the burst sparks — fly out, drag to a stop, settle, fade
    for (let i = mirror.bursts.length - 1; i >= 0; i--) {
      const b = mirror.bursts[i];
      b.life -= dt * 1.7;
      if (b.life <= 0) { mirror.bursts.splice(i, 1); continue; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      const drag = Math.pow(0.12, dt); b.vx *= drag; b.vy *= drag;
      b.vy += 26 * dt;
    }

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
      ctx.globalAlpha = 0.14 + fade * 0.5 + mirror.rx * 0.35;
      ctx.fillStyle = s.hue;
      ctx.beginPath();
      ctx.arc(px * dpr, py * dpr, s.size * dpr * (1 + mirror.rx * 0.6), 0, 6.2832);
      ctx.fill();
    }

    // the comet trail — recent positions as fading chrome blooms behind the ball
    const tr = mirror.trail, tn = tr.length;
    for (let k = 0; k < tn - 1; k++) {
      const f = (k + 1) / tn;                 // 0 (oldest) → ~1 (newest)
      ctx.globalAlpha = f * f * 0.5 * lit;
      const tg = ctx.createRadialGradient(tr[k].x * dpr, tr[k].y * dpr, 1, tr[k].x * dpr, tr[k].y * dpr, (2 + f * 6) * dpr);
      tg.addColorStop(0, '#eaf0ff');
      tg.addColorStop(1, 'rgba(150,170,210,0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(tr[k].x * dpr, tr[k].y * dpr, (2 + f * 6) * dpr, 0, 6.2832);
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

    // ── TOUCH VISUALS (mobile) ────────────────────────────────────────
    // tap / hold-release bursts — sparks flung from the finger
    for (let i = 0; i < mirror.bursts.length; i++) {
      const b = mirror.bursts[i];
      ctx.globalAlpha = b.life * b.life * 0.85 * lit;
      ctx.fillStyle = b.hue;
      ctx.beginPath();
      ctx.arc(b.x * dpr, b.y * dpr, Math.max(0.3, b.size * b.life) * dpr, 0, 6.2832);
      ctx.fill();
    }
    // charge bloom — a gold knot gathering under a held finger
    if (mirror.charge) {
      const held = Math.min(1.4, (performance.now() - mirror.charge.t0) / 1000);
      const r = (9 + held * 30) * dpr, cx = mirror.charge.x * dpr, cy = mirror.charge.y * dpr;
      const cg = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      cg.addColorStop(0, 'rgba(247,211,63,' + (0.28 + held * 0.4).toFixed(3) + ')');
      cg.addColorStop(0.6, 'rgba(255,46,136,' + (0.14 + held * 0.2).toFixed(3) + ')');
      cg.addColorStop(1, 'rgba(255,46,136,0)');
      ctx.globalAlpha = lit;
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
    }
    // constellation — a light node at each active touch, faint links between
    const ids = Object.keys(mirror.touches);
    if (ids.length > 1) {
      ctx.lineWidth = 1 * dpr; ctx.strokeStyle = 'rgba(201,160,255,.28)';
      for (let a = 0; a < ids.length; a++) {
        const p = mirror.touches[ids[a]]; if (!p) continue;
        const ng = ctx.createRadialGradient(p.x * dpr, p.y * dpr, 1, p.x * dpr, p.y * dpr, 22 * dpr);
        ng.addColorStop(0, 'rgba(234,240,255,.5)'); ng.addColorStop(1, 'rgba(234,240,255,0)');
        ctx.globalAlpha = lit; ctx.fillStyle = ng;
        ctx.beginPath(); ctx.arc(p.x * dpr, p.y * dpr, 22 * dpr, 0, 6.2832); ctx.fill();
        for (let c = a + 1; c < ids.length; c++) {
          const q = mirror.touches[ids[c]]; if (!q) continue;
          ctx.globalAlpha = lit * 0.5;
          ctx.beginPath(); ctx.moveTo(p.x * dpr, p.y * dpr); ctx.lineTo(q.x * dpr, q.y * dpr); ctx.stroke();
        }
      }
    }
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
  /* ═══════════════════════════════════════════════════════════════════
     AUDIO — a live procedural SCORE. No files, nothing fetched, nothing
     phoned home: the reverb is a synthesized impulse response, every
     instrument is built from oscillators and noise. Each scene is its
     OWN track — bpm, key, chord progression, drum pattern, and a palette
     of voices scored to that room's world. theriot keeps its silence.

     Signal path:  voices → buses (drums · bass · music) → sidechain pump
                   → glue compressor → soft limiter → out
                   with synthesized reverb + tempo delay on sends.
     ─────────────────────────────────────────────────────────────────── */
  const audio = {
    ctx: null, enabled: false, scene: 'hub',
    master: null, glue: null, limiter: null, pump: null,
    bus: {}, reverb: null, rvSend: null, delay: null, dlSend: null, dlFb: null,
    noiseBuf: null,
    arr: null, spb: 0.5, swing: 0,
    timer: null, clockStart: 0, gstep: 0,
    hum: null,
    analyser: null, freqData: null,
    rx: { bass: 0, mid: 0, high: 0, level: 0 }, rxLast: 0
  };

  const LOWFI = !!(window.matchMedia && matchMedia('(hover: none), (pointer: coarse)').matches);
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  const CHORDS = {
    min:[0,3,7], maj:[0,4,7], sus2:[0,2,7],
    min7:[0,3,7,10], maj7:[0,4,7,11], dom7:[0,4,7,10], min7b5:[0,3,6,10],
    min9:[0,3,7,10,14], maj9:[0,4,7,11,14], add9:[0,4,7,14], dom9:[0,4,7,10,14]
  };
  function chordNotes(root, q) { return (CHORDS[q] || CHORDS.min7).map(function (iv) { return root + iv; }); }

  function audioEnsure() {
    if (audio.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = audio.ctx = new AC();

    // master chain: master → glue comp → soft limiter → destination
    audio.master = ac.createGain(); audio.master.gain.value = 0;
    audio.glue = ac.createDynamicsCompressor();
    audio.glue.threshold.value = -16; audio.glue.knee.value = 24;
    audio.glue.ratio.value = 3; audio.glue.attack.value = 0.006; audio.glue.release.value = 0.18;
    audio.limiter = ac.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 1023 * 2 - 1; curve[i] = Math.tanh(x * 1.6); }
    audio.limiter.curve = curve; audio.limiter.oversample = '2x';
    audio.master.connect(audio.glue).connect(audio.limiter).connect(ac.destination);

    // audio-reactive tap — a PASSIVE analyser (output unconnected). Fed by the
    // synth master here and, in startTrack(), by the MP3 trackGain too, so the
    // reactive layer sees the whole room (the MP3 path bypasses master).
    audio.analyser = ac.createAnalyser();
    audio.analyser.fftSize = 1024;
    audio.analyser.smoothingTimeConstant = 0.82;
    audio.freqData = new Uint8Array(audio.analyser.frequencyBinCount);
    audio.master.connect(audio.analyser);

    // instrument buses
    audio.bus.drums = ac.createGain(); audio.bus.drums.gain.value = 0.9;
    audio.bus.bass = ac.createGain(); audio.bus.bass.gain.value = 0.9;
    audio.bus.music = ac.createGain(); audio.bus.music.gain.value = 0.8;
    audio.pump = ac.createGain(); audio.pump.gain.value = 1;      // sidechain on the music bus
    audio.bus.drums.connect(audio.master);
    audio.bus.bass.connect(audio.master);
    audio.bus.music.connect(audio.pump).connect(audio.master);

    // synthesized reverb (a noise-decay impulse response — zero egress)
    audio.reverb = ac.createConvolver();
    const rate = ac.sampleRate, len = Math.floor(rate * 2.4), ir = ac.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    audio.reverb.buffer = ir;
    const rvOut = ac.createGain(); rvOut.gain.value = 0.9;
    audio.reverb.connect(rvOut).connect(audio.master);
    audio.rvSend = ac.createGain(); audio.rvSend.gain.value = 1; audio.rvSend.connect(audio.reverb);
    // fixed sends: the music bus is wet, drums lightly so
    const rvM = ac.createGain(); rvM.gain.value = 0.22; audio.bus.music.connect(rvM).connect(audio.reverb);
    const rvD = ac.createGain(); rvD.gain.value = 0.07; audio.bus.drums.connect(rvD).connect(audio.reverb);

    // tempo delay (set per scene)
    audio.delay = ac.createDelay(1.5); audio.delay.delayTime.value = 0.36;
    audio.dlFb = ac.createGain(); audio.dlFb.gain.value = 0.34;
    const dlOut = ac.createGain(); dlOut.gain.value = 0.5;
    audio.delay.connect(audio.dlFb).connect(audio.delay);
    audio.delay.connect(dlOut).connect(audio.master);
    audio.dlSend = ac.createGain(); audio.dlSend.gain.value = 1; audio.dlSend.connect(audio.delay);
    const dlM = ac.createGain(); dlM.gain.value = 0.16; audio.bus.music.connect(dlM).connect(audio.delay);

    // shared noise buffer
    const nlen = rate * 2;
    audio.noiseBuf = ac.createBuffer(1, nlen, rate);
    const nd = audio.noiseBuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
  }

  /* ── the sidechain "pump": duck the music bus on each kick ────────── */
  function duck(t) {
    if (!audio.pump) return;
    const p = audio.pump.gain;
    p.cancelScheduledValues(t);
    p.setValueAtTime(0.32, t + 0.001);
    p.linearRampToValueAtTime(1.0, t + 0.19);
  }

  /* ── VOICE LIBRARY — every instrument built from scratch ──────────── */
  function noise(t, dur, vol, ftype, freq, dest, q) {
    const ac = audio.ctx;
    const src = ac.createBufferSource(); src.buffer = audio.noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; if (q) f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest || audio.bus.drums);
    src.start(t); src.stop(t + dur + 0.02);
  }
  function vKick(t, vol) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx;
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(47, t + 0.09);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.95 * vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.27);
    o.connect(g).connect(audio.bus.drums); o.start(t); o.stop(t + 0.29);
    const s = ac.createOscillator(), sg = ac.createGain();
    s.frequency.setValueAtTime(58, t); s.frequency.exponentialRampToValueAtTime(38, t + 0.12);
    sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.01);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    s.connect(sg).connect(audio.bus.drums); s.start(t); s.stop(t + 0.22);
    noise(t, 0.012, 0.28 * vol, 'highpass', 2200, audio.bus.drums);   // click transient
    duck(t);
  }
  function vHat(t, open, vol) {
    vol = vol == null ? 1 : vol; const dur = open ? 0.18 : 0.045;
    noise(t, dur, (open ? 0.13 : 0.10) * vol, 'highpass', 8600, audio.bus.drums, 1);
    noise(t, dur * 0.8, (open ? 0.05 : 0.04) * vol, 'bandpass', 11000, audio.bus.drums, 9);
  }
  function vClap(t, vol) {
    vol = vol == null ? 1 : vol;
    [0, 0.011, 0.022].forEach(function (o, i) { noise(t + o, 0.022, (0.2 - i * 0.04) * vol, 'bandpass', 1650, audio.bus.drums, 1.3); });
    noise(t + 0.02, 0.13, 0.13 * vol, 'bandpass', 1400, audio.rvSend, 1);   // tail into verb
  }
  function vSnare(t, vol) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.09);
    g.gain.setValueAtTime(0.22 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g).connect(audio.bus.drums); o.start(t); o.stop(t + 0.12);
    noise(t, 0.13, 0.2 * vol, 'highpass', 1800, audio.bus.drums, 0.7);
  }
  function vBass(t, midi, dur, vol) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx, f0 = mtof(midi);
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 7;
    lp.frequency.setValueAtTime(f0 * 6, t); lp.frequency.exponentialRampToValueAtTime(Math.max(120, f0 * 1.5), t + Math.min(0.25, dur));
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * vol, t + 0.012);
    g.gain.setValueAtTime(0.3 * vol, t + dur * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(audio.bus.bass); o.start(t); o.stop(t + dur + 0.02);
    const s = ac.createOscillator(); s.type = 'sine'; s.frequency.value = f0 / 2;
    const sg = ac.createGain(); sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.24 * vol, t + 0.012);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(sg).connect(audio.bus.bass); s.start(t); s.stop(t + dur + 0.02);
  }
  // a lush sustained pad from a chord: detuned saws through a slow-opening filter
  function vPad(t, midis, dur, vol, wet) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx;
    const g = ac.createGain();
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.6;
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(2600, t + dur * 0.4);
    lp.frequency.linearRampToValueAtTime(700, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((0.09 / midis.length) * vol, t + dur * 0.14);
    g.gain.setValueAtTime((0.09 / midis.length) * vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const dt = LOWFI ? [0] : [-0.08, 0.08];
    midis.forEach(function (m) {
      dt.forEach(function (cents) {
        const o = ac.createOscillator(); o.type = 'sawtooth';
        o.frequency.value = mtof(m) * Math.pow(2, cents / 12);
        o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
      });
    });
    lp.connect(g).connect(audio.bus.music);
    if (wet) { const w = ac.createGain(); w.gain.value = wet; g.connect(w).connect(audio.rvSend); }
  }
  // a short disco/house chord stab
  function vStab(t, midis, dur, vol) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
    lp.frequency.setValueAtTime(3800, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((0.14 / midis.length) * vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    midis.forEach(function (m) {
      const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m);
      const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = mtof(m) * 1.003;
      o.connect(lp); o2.connect(lp); o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
    });
    lp.connect(g).connect(audio.bus.music);
    const w = ac.createGain(); w.gain.value = 0.4; g.connect(w).connect(audio.dlSend);
  }
  // a bright pluck / arp voice (through the delay)
  function vPluck(t, midi, dur, vol, type) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx;
    const o = ac.createOscillator(); o.type = type || 'triangle'; o.frequency.value = mtof(midi);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12 * vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.bus.music); o.start(t); o.stop(t + dur + 0.02);
    const w = ac.createGain(); w.gain.value = 0.5; g.connect(w).connect(audio.dlSend);
  }
  // an FM-ish bell for the cosmic rooms (very wet)
  function vBell(t, midi, dur, vol) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx, f0 = mtof(midi);
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f0;
    const m = ac.createOscillator(); m.type = 'sine'; m.frequency.value = f0 * 2.01;
    const md = ac.createGain(); md.gain.setValueAtTime(f0 * 1.4, t); md.gain.exponentialRampToValueAtTime(1, t + dur);
    m.connect(md).connect(o.frequency);
    const g = ac.createGain(); g.gain.setValueAtTime(0.14 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.bus.music); o.start(t); m.start(t); o.stop(t + dur + 0.05); m.stop(t + dur + 0.05);
    const w = ac.createGain(); w.gain.value = 0.7; g.connect(w).connect(audio.rvSend);
  }
  // a slow-attack disco string swell
  function vStrings(t, midis, dur, vol) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.5;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime((0.06 / midis.length) * vol, t + dur * 0.25);
    g.gain.setValueAtTime((0.06 / midis.length) * vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    midis.forEach(function (mm) {
      [-0.06, 0.06].forEach(function (c) {
        const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(mm) * Math.pow(2, c / 12);
        const lfo = ac.createOscillator(); lfo.frequency.value = 5.2; const la = ac.createGain(); la.gain.value = mtof(mm) * 0.004;
        lfo.connect(la).connect(o.frequency);
        o.connect(lp); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
      });
    });
    lp.connect(g).connect(audio.bus.music);
    const w = ac.createGain(); w.gain.value = 0.35; g.connect(w).connect(audio.rvSend);
  }
  // a soft frame-drum thump for the ancient room
  function vDrum(t, vol) {
    vol = vol == null ? 1 : vol; const ac = audio.ctx;
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.16);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.4 * vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(audio.bus.drums); o.start(t); o.stop(t + 0.32);
    noise(t, 0.05, 0.06 * vol, 'lowpass', 400, audio.bus.drums);
  }

  /* ── THE ARRANGEMENTS — one bespoke track per room ────────────────
     Each: { bpm, swing, dl (delay×spb), prog:[[rootMidi,quality]…],
     every (bars per chord), play(step,bar,t,ch) }. `ch` is the current
     chord's MIDI notes; step is 0..15 (16th notes); bass = ch[0]-12. */
  const ARR = {
    hub: { bpm:116, swing:0.12, dl:0.75, every:1,
      prog:[[57,'min7'],[53,'maj7'],[48,'maj7'],[55,'dom7']],
      play:function(s,bar,t,ch){
        if(s%4===0) vKick(t,0.85);
        if(s%2===1) vHat(t, s===6, 0.7);
        if(s===0) vBass(t, ch[0]-12, audio.spb*0.9, 0.9);
        if(s===6||s===10||s===14) vBass(t, ch[0]-12, audio.spb*0.3, 0.7);
        if(s===2||s===8) vStab(t, ch, 0.5, 0.6);
        if(s===0) vPad(t, ch, audio.spb*4*0.98, 0.7, 0.3);
      } },
    thefloor: { bpm:122, swing:0.14, dl:0.75, every:1,
      prog:[[57,'min7'],[50,'min7'],[55,'dom7'],[48,'maj7']],
      play:function(s,bar,t,ch){
        if(s%4===0) vKick(t);
        if(s===4||s===12) vClap(t);
        if(s%2===1) vHat(t, s===6||s===14, 0.9);
        if(s%4===0) vBass(t, ch[0]-12, audio.spb*0.45, 1);
        if(s===6||s===14) vBass(t, ch[0], audio.spb*0.2, 0.8);
        if(s===2||s===10) vStab(t, ch.map(function(n){return n+12;}), 0.2, 0.7);
        if(s===0) vStrings(t, ch.map(function(n){return n+12;}), audio.spb*4*0.98, 0.9);
        if(bar%8===7 && s>=12) vSnare(t, 0.4);      // fill
      } },
    deck: { bpm:104, swing:0.16, dl:0.75, every:2,
      prog:[[54,'min9'],[49,'maj9'],[52,'min7'],[47,'dom9']],
      play:function(s,bar,t,ch){
        if(s%4===0) vKick(t,0.8);
        if(s===4||s===12) vHat(t,true,0.5);
        if(s%2===1) vHat(t,false,0.4);
        if(s%8===0) vBass(t, ch[0]-24, audio.spb*1.8, 0.9);
        if(s===0||s===8) vPad(t, ch, audio.spb*8*0.98, 0.8, 0.4);
        if(s===10) vStab(t, ch, 0.5, 0.4);
      } },
    ongoing: { bpm:118, swing:0.12, dl:0.75, every:1,
      prog:[[57,'min9'],[53,'maj9'],[55,'min7'],[52,'min7']],
      play:function(s,bar,t,ch){
        if(s%4===0) vKick(t,0.8);
        if(s===4||s===12) vClap(t,0.7);
        if(s%2===1) vHat(t, s===6, 0.6);
        if(s%4===0) vBass(t, ch[0]-12, audio.spb*0.5, 0.85);
        if(s===0) vPad(t, ch.map(function(n){return n+12;}), audio.spb*4*0.98, 0.7, 0.5);
        if(s===8) vPluck(t, ch[2]+12, 0.6, 0.5, 'triangle');   // wistful lead
      } },
    gynarchy: { bpm:128, swing:0.1, dl:0.75, every:1,
      prog:[[48,'maj9'],[57,'min7'],[53,'maj7'],[55,'dom7']],
      play:function(s,bar,t,ch){
        if(s%4===0) vKick(t);
        if(s===4||s===12) vClap(t);
        if(s%2===1) vHat(t, true, 0.9);         // rolling offbeat
        if(s%2===1) vBass(t, ch[0]-12, audio.spb*0.22, 0.9);   // offbeat bass
        if(s%4===2) vStab(t, ch.map(function(n){return n+12;}), 0.22, 0.8);   // supersaw stabs
        if(s===0) vStrings(t, ch.map(function(n){return n+12;}), audio.spb*4*0.98, 1);
        if(bar%4===3 && s>=8) vHat(t, false, 0.5+ (s-8)*0.05);  // hat build
      } },
    hitraveler: { bpm:122, swing:0.08, dl:1.5, every:2,
      prog:[[50,'min9'],[57,'min7'],[55,'maj7'],[53,'maj9']],
      play:function(s,bar,t,ch){
        if(s%4===0) vKick(t,0.75);
        if(s%4===2) vHat(t,false,0.4);
        if(s%8===0) vBass(t, ch[0]-24, audio.spb*1.6, 0.85);
        if(s===0||s===8) vPad(t, ch, audio.spb*8*0.98, 0.85, 0.6);
        if(s%3===0) vPluck(t, ch[(s/3|0)%ch.length]+12, 0.5, 0.4, 'sine');  // sparse cosmic arp
      } },
    triskelion: { bpm:124, swing:0.06, dl:0.5, every:1,
      prog:[[52,'min7'],[59,'min7'],[55,'maj7'],[57,'min7']],
      play:function(s,bar,t,ch){
        if(s%4===0) vKick(t,0.7);
        if(s%2===1) vHat(t,false,0.4);
        if(s%8===0) vBass(t, ch[0]-12, audio.spb*1.6, 0.7);
        // spiralling triad arpeggio
        vBell(t, ch[s%ch.length]+12, 0.5, 0.5);
        if(s===0) vPad(t, ch, audio.spb*4*0.98, 0.6, 0.6);
      } },
    whatisgender: { bpm:70, swing:0, dl:0.75, every:2,
      prog:[[48,'maj9'],[50,'min9']],
      play:function(s,bar,t,ch){
        if(s===0) vPad(t, ch, audio.spb*8*0.98, 0.9, 0.7);   // warm evolving pad, no drums
        if(s===8) vBell(t, ch[2]+12, 1.4, 0.4);
      } },
    ancestors: { bpm:68, swing:0, dl:0.75, every:2,
      prog:[[50,'sus2'],[48,'add9']],
      play:function(s,bar,t,ch){
        if(s===0||s===8) vDrum(t,0.9);                 // frame-drum pulse
        if(s===6||s===14) vDrum(t,0.4);
        if(s===0) vPad(t, ch, audio.spb*8*0.98, 0.9, 0.6);
        if(s===4) vBell(t, ch[1]+12, 1.2, 0.3);        // finger-cymbal shimmer
      } },
    thecode: { bpm:100, swing:0.08, dl:0.5, every:2,
      prog:[[45,'min'],[45,'min7']],
      play:function(s,bar,t,ch){
        if(s%2===0) noise(t, 0.02, 0.06, 'highpass', 9000, audio.bus.drums);   // clockwork tick
        if(s===0) vBass(t, ch[0]-12, audio.spb*1.4, 0.7);
        if(s===8) vStab(t, ch, 0.4, 0.3);              // one restrained minor stab
      } },
    threshold: { bpm:60, swing:0, dl:0.75, every:4,
      prog:[[48,'add9']],
      play:function(s,bar,t,ch){
        if(s===0) vPad(t, ch, audio.spb*16*0.98, 0.8, 0.7);   // breathing pad
        if(s===0||s===8) vDrum(t,0.25);               // a soft heartbeat
      } }
  };

  /* ── THE CLOCK — a lookahead scheduler; no drift ──────────────────── */
  function stepTime(g) {
    const st = audio.spb / 4;
    return audio.clockStart + g * st + ((g % 2) ? audio.swing * st : 0);
  }
  function tick() {
    if (!audio.enabled || !audio.arr) return;
    const now = audio.ctx.currentTime;
    while (stepTime(audio.gstep) < now + 0.1) {
      const t = stepTime(audio.gstep), s = audio.gstep % 16, bar = Math.floor(audio.gstep / 16);
      const chordIdx = Math.floor(bar / (audio.arr.every || 1)) % audio.arr.prog.length;
      const pc = audio.arr.prog[chordIdx];
      try { audio.arr.play(s, bar, t, chordNotes(pc[0], pc[1])); } catch (e) {}
      audio.gstep++;
    }
  }
  function startClock() {
    if (audio.timer) return;
    audio.clockStart = audio.ctx.currentTime + 0.12; audio.gstep = 0;
    audio.timer = setInterval(tick, 25);
  }
  function stopClock() { clearInterval(audio.timer); audio.timer = null; }

  /* ── SCENE = a track. Each page sets its scene once (at boot, then on
     enable), so this just swaps arrangement/tempo/delay — no live
     cross-fades needed. theriot mutes the score for its silence. ────── */
  function setScene(name) {
    audio.scene = name;
    if (audio.hasTrack) return;          // this room plays a real recording, not the synth
    if (name === 'theriot') {
      audio.arr = null;
      if (audio.enabled && audio.ctx) { stopClock(); startRiotRoom(); }
      return;
    }
    stopRiotRoom();
    const a = ARR[name] || ARR.hub;
    audio.arr = a; audio.spb = 60 / a.bpm; audio.swing = a.swing || 0;
    if (audio.delay) audio.delay.delayTime.value = audio.spb * (a.dl || 0.75);
    if (audio.enabled && audio.ctx && !audio.timer) startClock();
  }

  function audioEnable(on) {
    // rooms with a real recording: the ♪ toggle plays/pauses the MP3
    if (audio.hasTrack) {
      audio.enabled = on;
      REV.set('audio', on);
      if (on) { startTrack(); synthUp(); }          // routed through Web Audio (iOS-safe)
      else { if (audio.trackEl) audio.trackEl.pause(); synthDown(); }
      if (audio.onToggle) audio.onToggle(on);
      return;
    }
    audioEnsure();
    audio.enabled = on;
    REV.set('audio', on);
    const now = audio.ctx.currentTime;
    if (on) {
      audio.ctx.resume();
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value || 0.0001), now);
      audio.master.gain.linearRampToValueAtTime(0.9, now + 0.7);
      setScene(audio.scene);   // applies arr/tempo/delay, starts the clock (or riot)
    } else {
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      stopClock(); stopRiotRoom();
    }
  }

  /* ── REAL RECORDINGS — some rooms play a curated MP3 instead of the
     synth. It autoplays on load where the browser allows, and otherwise
     starts on the first gesture; the ♪ toggle then plays/pauses it. Zero
     synthesis for these rooms — the track IS the room. ─────────────── */
  // bring the synth master up (silent by itself — no bed, since setScene
  // no-ops on track rooms) so the turntable's hover-stems and needle-drop
  // thunk stay audible over the recording.
  function synthUp() {
    try {
      audioEnsure(); audio.ctx.resume();
      const now = audio.ctx.currentTime, g = audio.master.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(0.0001, g.value || 0.0001), now);
      g.linearRampToValueAtTime(0.9, now + 0.6);
    } catch (e) {}
  }
  function synthDown() {
    if (!audio.ctx) return;
    const g = audio.master.gain, now = audio.ctx.currentTime;
    g.cancelScheduledValues(now); g.linearRampToValueAtTime(0.0001, now + 0.4);
  }
  function markPlaying() {
    audio.enabled = true; REV.set('audio', true);
    synthUp();
    if (audio.onToggle) audio.onToggle(true);
  }

  // Start (or restart) the recording. iOS WebKit silences a bare <audio>
  // element when the ringer switch is on mute — routing it through the
  // AudioContext (createMediaElementSource) makes it play like a music app.
  // The context is created/resumed here so, when this runs inside a user
  // gesture, iOS unlocks audio for good.
  function startTrack() {
    const el = audio.trackEl; if (!el) return;
    try {
      audioEnsure();
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      if (!audio.trackSrc) {
        try {
          audio.trackSrc = audio.ctx.createMediaElementSource(el);
          audio.trackGain = audio.ctx.createGain(); audio.trackGain.gain.value = 1;
          audio.trackSrc.connect(audio.trackGain).connect(audio.ctx.destination);
          if (audio.analyser) audio.trackGain.connect(audio.analyser);   // let bands() hear the track
        } catch (e) { /* some engines forbid re-routing — fall back to the element's own output */ }
      }
    } catch (e) {}
    const p = el.play(); if (p && p.catch) p.catch(function () {});
  }

  function setTrack(url, title) {
    audio.hasTrack = true;
    audio.trackTitle = title || '';
    const el = audio.trackEl = new Audio();
    el.src = url; el.loop = true; el.preload = 'auto';
    el.muted = false; el.volume = 1;
    el.setAttribute('playsinline', '');            // iOS: never go fullscreen
    el.addEventListener('playing', function () { if (!audio.enabled) markPlaying(); });
    // be a good guest: pause when the tab is hidden, resume when it returns
    document.addEventListener('visibilitychange', function () {
      if (!audio.trackEl) return;
      if (document.hidden) { audio.wasPlaying = !audio.trackEl.paused; audio.trackEl.pause(); savePos(); }
      else if (audio.wasPlaying && audio.enabled) { audio.trackEl.play().catch(function () {}); }
    });

    // ── RESUME — pick each track up where it left off within this tab-session,
    //    so moving between rooms (and back) doesn't rewind the music. Position
    //    is per-track and lives only in sessionStorage (this tab, this visit). ──
    const POS_KEY = 'rev_pos:' + url;
    let lastSave = 0;
    function savePos() {
      try { if (audio.trackEl) sessionStorage.setItem(POS_KEY, String(audio.trackEl.currentTime || 0)); } catch (e) {}
    }
    el.addEventListener('loadedmetadata', function () {
      try {
        const p = parseFloat(sessionStorage.getItem(POS_KEY) || '0');
        if (p > 0.5 && isFinite(el.duration) && p < el.duration - 1) el.currentTime = p;
      } catch (e) {}
    }, { once: true });
    el.addEventListener('timeupdate', function () {
      const t = Date.now();
      if (t - lastSave > 1000) { lastSave = t; savePos(); }
    });
    el.addEventListener('pause', savePos);
    addEventListener('pagehide', savePos);       // navigating away (incl. the page transition)
    // bfcache restore (the back button — how the hub is most often re-reached)
    // doesn't re-fire loadedmetadata, so re-seek to the saved spot here too.
    addEventListener('pageshow', function (ev) {
      if (!ev.persisted) return;
      try {
        const p = parseFloat(sessionStorage.getItem(POS_KEY) || '0');
        if (p > 0.5 && el.duration && isFinite(el.duration) && p < el.duration - 1 && Math.abs((el.currentTime || 0) - p) > 2) el.currentTime = p;
      } catch (e) {}
    });

    // THE UNLOCK — the first real user gesture starts everything. Capture
    // phase + several event types so it fires no matter what a room's own
    // handlers do (the turntable calls preventDefault on the canvas, etc.).
    const EV = ['touchend', 'touchstart', 'pointerdown', 'mousedown', 'keydown', 'click'];
    function done() { EV.forEach(function (ev) { document.removeEventListener(ev, unlock, true); }); }
    function unlock(e) {
      if (audio.enabled) { done(); return; }
      // if the gesture landed on the ♪ button or the chip, let THEIR handler
      // toggle it — don't double-fire (which would enable then pause).
      const t = e && e.target;
      if (t && t.closest && t.closest('.audio-toggle, .now-playing')) return;
      startTrack(); markPlaying(); done();
    }
    EV.forEach(function (ev) { document.addEventListener(ev, unlock, true); });

    // still TRY straight autoplay for browsers that allow it (desktop);
    // iOS/most mobile will reject and simply wait for the unlock gesture.
    const p = el.play();
    if (p && p.then) p.then(function () { startTrack(); markPlaying(); }).catch(function () {});
  }

  /* ── THE HOLE — theriot's silence: projector idle + 60Hz mains ────── */
  function startRiotRoom() {
    if (audio.hum || !audio.ctx) return; const ac = audio.ctx;
    const hum = ac.createOscillator(), humG = ac.createGain();
    hum.frequency.value = 60; humG.gain.value = 0.015;
    const hum2 = ac.createOscillator(), hum2G = ac.createGain();
    hum2.frequency.value = 120; hum2G.gain.value = 0.008;
    hum.connect(humG).connect(audio.master); hum2.connect(hum2G).connect(audio.master);
    hum.start(); hum2.start();
    const src = ac.createBufferSource(); src.buffer = audio.noiseBuf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const g = ac.createGain(); g.gain.value = 0.012;
    const flutter = ac.createOscillator(), fg = ac.createGain();
    flutter.frequency.value = 18; fg.gain.value = 0.006;
    flutter.connect(fg).connect(g.gain);
    src.connect(lp).connect(g).connect(audio.master); src.start(); flutter.start();
    audio.hum = { hum: hum, hum2: hum2, src: src, flutter: flutter };
  }
  function stopRiotRoom() {
    if (!audio.hum) return; const h = audio.hum;
    try { h.hum.stop(); h.hum2.stop(); h.src.stop(); h.flutter.stop(); } catch (e) {}
    audio.hum = null;
  }

  /* ── VINYL FOLEY ──────────────────────────────────────────────────── */
  function crackle(dur) {
    if (!audio.enabled) return; const ac = audio.ctx; dur = dur || 0.6;
    const t0 = ac.currentTime;
    const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() < 0.0016 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.02);
    const src = ac.createBufferSource(); src.buffer = buf;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
    const g = ac.createGain(); g.gain.value = 0.5;
    src.connect(lp).connect(g).connect(audio.master); src.start(t0);
  }
  function thunk() {
    if (!audio.enabled) return; const ac = audio.ctx, t0 = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();       // the needle-drop thud
    o.frequency.setValueAtTime(120, t0); o.frequency.exponentialRampToValueAtTime(48, t0 + 0.1);
    g.gain.setValueAtTime(0.45, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
    o.connect(g).connect(audio.master); o.start(t0); o.stop(t0 + 0.22);
    noise(t0, 0.06, 0.12, 'bandpass', 2600, audio.master, 0.8);  // the scratch
  }

  /* ── HOVER PREVIEW + ROOM STEMS — a lush TASTE of each room's track,
     short and layerable over the hub groove; routed through the FX so
     it has space. The full arrangement plays once you enter the room. */
  function preview(freq) {
    if (!audio.enabled) return; audioEnsure();
    const ac = audio.ctx, t0 = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
    o.connect(g).connect(audio.bus.music); o.start(t0); o.stop(t0 + 1.5);
    const w = ac.createGain(); w.gain.value = 0.5; g.connect(w).connect(audio.rvSend);
  }
  function stem(id, tone) {
    if (!audio.enabled) return; audioEnsure();
    const now = audio.ctx.currentTime;
    // derive a chord from the room's own arrangement (falls back to a min7)
    const a = ARR[id]; const pc = a ? a.prog[0] : null;
    const ch = pc ? chordNotes(pc[0], pc[1]) : chordNotes(57, 'min7');
    switch (id) {
      case 'ancestors': vPad(now, ch, 1.8, 0.9, 0.6); vDrum(now, 0.7); vDrum(now + 0.5, 0.4); break;
      case 'thecode':   for (let k=0;k<4;k++) noise(now+k*0.14, 0.02, 0.06, 'highpass', 9000, audio.bus.drums); vStab(now+0.1, ch, 0.5, 0.4); break;
      case 'theriot':   { const o=audio.ctx.createOscillator(),g=audio.ctx.createGain(); o.frequency.value=60; g.gain.setValueAtTime(0.05,now); g.gain.exponentialRampToValueAtTime(0.0001,now+0.7); o.connect(g).connect(audio.master); o.start(now); o.stop(now+0.75); noise(now+0.06,0.13,0.07,'bandpass',3200,audio.master,1); break; }
      case 'thefloor':  vKick(now); vStab(now, ch.map(function(n){return n+12;}), 0.25, 0.7); vHat(now+0.14, true, 0.7); vBass(now, ch[0]-12, 0.4, 0.9); break;
      case 'deck':      vPad(now, ch, 1.6, 0.9, 0.5); vBass(now, ch[0]-24, 1.2, 0.8); break;
      case 'ongoing':   vPad(now, ch.map(function(n){return n+12;}), 1.6, 0.8, 0.5); vPluck(now+0.3, ch[2]+12, 0.6, 0.5); break;
      case 'gynarchy':  vStrings(now, ch.map(function(n){return n+12;}), 1.6, 1); vClap(now+0.2); vBass(now, ch[0]-12, 0.3, 0.9); break;
      case 'hitraveler':[0,1,2,3].forEach(function(k){ vPluck(now+k*0.12, ch[k%ch.length]+12, 0.5, 0.4, 'sine'); }); vPad(now, ch, 1.6, 0.6, 0.6); break;
      case 'triskelion':[0,1,2].forEach(function(k){ vBell(now+k*0.1, ch[k%ch.length]+12, 0.7, 0.5); }); break;
      case 'whatisgender': vPad(now, ch, 1.8, 0.9, 0.7); vBell(now+0.4, ch[2]+12, 1.2, 0.35); break;
      default: preview(tone);
    }
  }

  // ── audio-reactive bands: one FFT read per animation frame, enveloped to
  //    0..1 with a fast attack / slow release so it reads musical, not jittery.
  //    Callers within the same frame share one read (the rxLast guard); when
  //    audio is off/silent the values decay smoothly back to rest. ──────────
  function bands(now) {
    now = now || performance.now();
    const rx = audio.rx;
    if (now - audio.rxLast < 10) return rx;        // already read this frame
    audio.rxLast = now;
    const a = audio.analyser;
    if (!a || !audio.enabled) {
      rx.bass *= 0.86; rx.mid *= 0.86; rx.high *= 0.86; rx.level *= 0.86;
      return rx;
    }
    a.getByteFrequencyData(audio.freqData);
    const d = audio.freqData;
    const avg = function (lo, hi) { let s = 0; for (let i = lo; i < hi; i++) s += d[i]; return s / ((hi - lo) * 255); };
    const bass = avg(1, 8), mid = avg(8, 60), high = avg(60, 180), level = avg(1, 180);
    const sm = function (c, t) { return t > c ? c + (t - c) * 0.5 : c + (t - c) * 0.12; };
    rx.bass = sm(rx.bass, bass); rx.mid = sm(rx.mid, mid);
    rx.high = sm(rx.high, high); rx.level = sm(rx.level, level);
    return rx;
  }

  REV.audio = {
    enable: audioEnable,
    enabled: function () { return audio.enabled; },
    setScene: setScene,
    crackle: crackle,
    thunk: thunk,
    preview: preview,
    stem: stem,
    track: setTrack,
    bands: bands
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
    whatisgender: 'the same matter wrote you and everyone you will ever want. there was never an opposite.',
    deck:      'knowe thyself. the flaps were always meant to be lifted.',
    ongoing:   'nothing here is tracking you. sit as long as you like. the loop completes when you leave and do something.',
    gynarchy:  'this part isn\u2019t history. it\u2019s the invitation. you were always already free.',
    hitraveler:'the world\u2019s operating system is crashing. you are already running the update. hi, traveler.',
    triskelion:'breathe. this is the turn. side b is where we stop explaining and start dreaming.'
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
      setTimeout(function () { el.remove(); tear.remove(); }, 11200);
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
  /* ─────────────────────────────────────────────────────────────────
     PAGE TRANSITIONS — the needle lifts, the vinyl irises across, and
     drops on the next room. The exit is flash-free (cover fully, THEN
     navigate). The enter reveal only plays when we arrived via an in-site
     click (a sessionStorage breadcrumb), so a typed/bookmarked hit just
     appears — no flash. Instant under reduced motion. ─────────────────── */
  let wipeEl = null;
  function ensureWipe() {
    if (wipeEl && wipeEl.parentNode) return wipeEl;
    wipeEl = document.createElement('div');
    wipeEl.className = 'rev-wipe';
    wipeEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(wipeEl);
    return wipeEl;
  }
  REV.navigate = function (href) {
    if (!href) return;
    // Destinations with their own arrival intro (theriot's CRT power-on) must
    // NOT be preceded by the record iris — go straight there so only their
    // intro plays.
    if (REV.stilled() || /(^|\/)theriot\.html(\?|#|$)/.test(href)) { location.href = href; return; }
    try { sessionStorage.setItem('rev_transit', '1'); } catch (e) {}
    if (REV.audio && REV.audio.enabled && REV.audio.enabled()) REV.audio.thunk();  // the needle-lift clunk
    const w = ensureWipe();
    w.className = 'rev-wipe wipe-exit';
    let done = false;
    const go = function () { if (done) return; done = true; location.href = href; };
    w.addEventListener('animationend', go, { once: true });
    setTimeout(go, 650);                              // safety net if animationend is missed
  };
  function playEnterReveal() {
    let transit = false;
    try { transit = sessionStorage.getItem('rev_transit') === '1'; sessionStorage.removeItem('rev_transit'); } catch (e) {}
    if (!transit || REV.stilled()) return;
    if (document.querySelector('.cut-flash, .tv-on')) return;   // rooms with their own bespoke entrance (theriot's TV power-on) keep it
    const w = ensureWipe();
    w.className = 'rev-wipe wipe-enter';
    const clean = function () { if (w.parentNode) w.parentNode.removeChild(w); wipeEl = null; };
    w.addEventListener('animationend', clean, { once: true });
    setTimeout(clean, 950);
  }
  // delegated: route plain in-site link clicks through the transition. Anything
  // already handled (defaultPrevented — e.g. the Side B gate, the hub tracklist)
  // is left alone, as are new-tab/modified clicks and external links.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || REV.stilled()) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-cut') || a.getAttribute('aria-current') === 'page') return;
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    let url; try { url = new URL(href, location.href); } catch (er) { return; }
    if (url.origin !== location.origin) return;                          // external — leave it
    if (url.href === location.href) return;                              // exact self
    if (url.pathname === location.pathname && url.hash) return;          // in-page anchor
    e.preventDefault();
    REV.navigate(url.href);
  });

  // Returning via the browser back/forward button restores the page from the
  // bfcache frozen exactly as it left — which can leave the exit-wipe (or a
  // half-shown loader) stuck covering the screen. Clear any transition overlay
  // on a persisted restore, and drop the stale transit breadcrumb.
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    const stuck = document.querySelectorAll('.rev-wipe, #rev-loader');
    for (let i = 0; i < stuck.length; i++) if (stuck[i].parentNode) stuck[i].parentNode.removeChild(stuck[i]);
    wipeEl = null;
    try { sessionStorage.removeItem('rev_transit'); } catch (er) {}
  });

  // THE NEEDLE REMEMBERS — which rooms this device has already dropped into
  REV.played = function () {
    try { return JSON.parse(localStorage.getItem('rev_played') || '[]'); } catch (e) { return []; }
  };

  REV.boot = function (opts) {
    opts = opts || {};
    applyState();
    playEnterReveal();

    // record this visit so the hub can mark the grooves you've already played
    if (opts.room) {
      try {
        const k = 'rev_played';
        const s = JSON.parse(localStorage.getItem(k) || '[]');
        if (s.indexOf(opts.room) < 0) { s.push(opts.room); localStorage.setItem(k, JSON.stringify(s)); }
      } catch (e) {}
    }

    // ground: rooms whose darkness is load-bearing pass ground:'dark'.
    // Set before mirrorInit so the cursor picks the right blend mode.
    // (theriot also hardcodes data-ground on <html> to avoid any flash.)
    if (opts.ground) document.documentElement.dataset.ground = opts.ground;

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

    // the light switch — flip the whole site light ↔ disco-dark.
    // Skipped in rooms that hard-code their own dark ground (theriot):
    // a light switch there would be a lie, since the room stays dark.
    var forcedDark = document.documentElement.dataset.ground === 'dark';
    if (!opts.noLightSwitch && !forcedDark) {
      const ls = document.createElement('button');
      ls.className = 'light-switch';
      ls.setAttribute('role', 'switch');
      ls.setAttribute('aria-checked', String(REV.state.theme === 'dark'));
      ls.setAttribute('aria-label', 'Light or disco-dark. Your choice lives on this device only.');
      ls.innerHTML = '<span class="ls-plate" aria-hidden="true"><span class="ls-knob"></span></span>';
      ls.addEventListener('click', function () {
        const dark = REV.state.theme !== 'dark';
        REV.set('theme', dark ? 'dark' : 'light');
        ls.setAttribute('aria-checked', String(dark));
        REV.audio.crackle(0.18);          // a soft physical "clack" if sound is on
      });
      document.body.appendChild(ls);
    }

    // real-recording rooms: a "now playing" chip + autoplay, wired to ♪
    if (opts.track) {
      const btn = document.querySelector('.audio-toggle');
      if (btn) btn.setAttribute('aria-label', 'Play or pause this room’s track.');
      const np = document.createElement('button');
      np.className = 'now-playing';
      np.type = 'button';
      np.setAttribute('aria-label', 'Play or pause this room’s track');
      np.innerHTML = '<span class="np-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="np-title"></span>';
      np.querySelector('.np-title').textContent = opts.trackTitle || 'tap for sound';
      // tapping the chip is an explicit, obvious way to start audio on mobile
      np.addEventListener('click', function () { REV.audio.enable(!REV.audio.enabled()); });
      document.body.appendChild(np);
      audio.onToggle = function (on) {
        if (btn) { btn.setAttribute('aria-pressed', String(on)); btn.textContent = on ? '♪' : '∅'; }
        np.classList.toggle('playing', on);
        np.querySelector('.np-title').textContent = on ? (opts.trackTitle || 'now playing') : 'tap for sound';
      };
      REV.audio.track(opts.track, opts.trackTitle);
    }

    // ── persistent top bar: THSR wordmark (home) + current track code ──
    // Injected here so every page that boots gets it, no per-page markup.
    if (!opts.noTopbar) {
      const TRACK_CODE = {
        ancestors:'A1', thecode:'A2', theriot:'A3', thefloor:'A4', ongoing:'A5',
        triskelion:'B1', deck:'B2', whatisgender:'B3', gynarchy:'B4', hitraveler:'B5'
      };
      const TRACK_NAME = {
        ancestors:'The Ancestors', thecode:'The Code', theriot:'The Riot',
        thefloor:'The Floor', ongoing:'Ongoing', triskelion:'The Triskelion',
        deck:'The Deviance Deck', whatisgender:'The Undivided Flesh',
        gynarchy:'The Queer Gynarchy', hitraveler:'The Circulation'
      };
      const sc = opts.scene || '';
      const code = TRACK_CODE[sc];
      let right;
      if (sc === 'hub') {
        right = '<span class="tb-code">⏏</span><span class="tb-name">the record</span>';
      } else if (code) {
        right = '<span class="tb-code">' + code + '</span><span class="tb-name">' + TRACK_NAME[sc] + '</span>';
      } else {
        right = '<span class="tb-name">' + sc + '</span>';
      }
      const bar = document.createElement('nav');
      bar.className = 'rev-topbar';
      bar.setAttribute('aria-label', 'The Human Sexual Revolution — navigation');
      bar.innerHTML =
        '<a class="tb-mark" href="index.html" aria-label="The Human Sexual Revolution — home">THSR</a>' +
        '<span class="tb-track" aria-label="Now on">' + right + '</span>';
      if (sc === 'hub') bar.querySelector('.tb-mark').setAttribute('aria-current', 'page');

      // transport: a thin now-playing progress line under the bar, tracking
      // this room's recording (only on rooms that carry one)
      if (opts.track && audio.trackEl) {
        const prog = document.createElement('span');
        prog.className = 'tb-progress'; prog.setAttribute('aria-hidden', 'true');
        prog.innerHTML = '<i></i>';
        bar.appendChild(prog);
        const fill = prog.querySelector('i');
        const upd = function () {
          const el = audio.trackEl;
          if (!el || !el.duration || !isFinite(el.duration)) return;
          fill.style.width = (Math.max(0, Math.min(1, el.currentTime / el.duration)) * 100) + '%';
        };
        audio.trackEl.addEventListener('timeupdate', upd);
        audio.trackEl.addEventListener('loadedmetadata', upd);
      }

      document.body.appendChild(bar);
    }

    // ── scroll reveal — sections settle in as they enter view. Safe by
    //    construction: only enables the hide-until-seen CSS when IO exists
    //    and motion is allowed; in-view elements reveal immediately. ──────
    if ('IntersectionObserver' in window && !REV.stilled()) {
      const revealables = document.querySelectorAll('[data-reveal]');
      if (revealables.length) {
        document.documentElement.classList.add('rev-reveal');
        const io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add('rev-in'); io.unobserve(en.target); }
          });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
        revealables.forEach(function (el) { io.observe(el); });
      }
    }

    // ── PHOTO TILT — every photo tips with the scroll: as it rides up past
    //    the viewport's middle it tilts one way, below it the other, on a
    //    self-perspective (no wrapper changes). Skipped under reduced motion;
    //    opt an image out with data-no-tilt. ─────────────────────────────────
    if (!REV.stilled()) {
      const photos = [].slice.call(document.querySelectorAll('img')).filter(function (im) { return !im.hasAttribute('data-no-tilt'); });
      if (photos.length) {
        let ticking = false;
        const tiltPass = function () {
          ticking = false;
          const vh = innerHeight || 1, mid = vh / 2;
          for (let i = 0; i < photos.length; i++) {
            const im = photos[i], r = im.getBoundingClientRect();
            if (!r.height || r.bottom < -60 || r.top > vh + 60) continue;   // off-screen: leave it
            const off = Math.max(-1, Math.min(1, (mid - (r.top + r.height / 2)) / vh));
            im.style.transform = 'perspective(900px) rotateX(' + (off * 5).toFixed(2) + 'deg)';
          }
        };
        const onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(tiltPass); } };
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', onScroll, { passive: true });
        tiltPass();
      }
    }

    // ── audio-reactive CSS vars — one tick drives the atmosphere everywhere
    //    (scanline breath, hero-title throb). Values rest at 0 until sound
    //    plays, and are pinned to 0 in stilled/reduced-motion. ─────────────
    (function rxTick(now) {
      const b = bands(now);
      const st = document.documentElement.style;
      if (REV.stilled()) { st.setProperty('--rx-level', '0'); st.setProperty('--rx-bass', '0'); }
      else {
        st.setProperty('--rx-level', b.level.toFixed(3));
        st.setProperty('--rx-bass', b.bass.toFixed(3));
      }
      requestAnimationFrame(rxTick);
    })(performance.now());

    if (opts.scene) setScene(opts.scene);
    if (opts.room) fourthwallArm(opts.room);
  };

  window.REV = REV;
})();
