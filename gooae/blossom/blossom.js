/* ═══════════════════════════════════════════════════════════════
   THE BLOSSOM · GOOAE portal homepage
   A spiral vortex, goo-glass arms, bubble portals. Hover swells a bead,
   tap pulls it into the vortex as a live preview, three knocks ripple it open.
   Reads /gooae/toys.json. One WebGL2 canvas for the goo; beads are real buttons.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MAX_ARMS = 8, PER_ARM = 5, K = 20;            // K = samples per arm sent to the shader
  var KNOCKS = 3, KNOCK_RESET_MS = 4000;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var html = document.documentElement;

  var stage = $('#stage'), canvas = $('#goo'), beadsEl = $('#beads'), portal = $('#portal');
  var titleEl = $('#vortexTitle'), bloomEl = $('#bloom'), enterBtn = $('#enter'), live = $('#live');
  var themeBtn = $('#theme'), fallback = $('#fallback');

  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  function calm() {
    try { var p = JSON.parse(localStorage.getItem('gooae.prefs.v1') || '{}'); if (p.motion === 'reduce') return true; if (p.motion === 'full') return false; } catch (e) {}
    return mqReduce.matches;
  }

  /* ── state ───────────────────────────────────────────────────── */
  var toys = [], worlds = {}, beads = [], arms = 5;
  var W = 0, H = 0, cx = 0, cy = 0, R = 100, r0 = 30, sx = 1, sy = 1, beadSize = 56;
  var rot = 0, rotVel = 0, rotTarget = null, zoom = 1, tiltX = 0, tiltY = 0;
  var time = 0, frozenTime = 3.3, last = performance.now();
  var hiArm = -1, hiUntil = 0;
  var pulled = -1, knocks = 0, knockTimer = 0, opening = false;
  var lightT = 0, lightGoal = 0;
  var ripple = { x: 0, y: 0, t: 9, s: 0 };
  var armPts = new Float32Array(MAX_ARMS * K * 4), armBox = new Float32Array(MAX_ARMS * 4);
  var gl = null, prog = null, uni = {}, rs = 1;

  /* ── theme ───────────────────────────────────────────────────── */
  var theme = 'dark';
  try { theme = localStorage.getItem('gooae.theme') === 'light' ? 'light' : 'dark'; } catch (e) {}
  function applyTheme() {
    html.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-checked', String(theme === 'light'));
    lightGoal = theme === 'light' ? 1 : 0;
    var mc = $('meta[name="theme-color"]'); if (mc) mc.content = theme === 'light' ? '#F4E9FF' : '#100817';
  }
  themeBtn.addEventListener('click', function () {
    theme = theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('gooae.theme', theme); } catch (e) {}
    applyTheme();
  });
  applyTheme();
  lightT = lightGoal;

  /* ── registry ────────────────────────────────────────────────── */
  fetch('toys.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (reg) {
    worlds = reg.worlds || {};
    toys = (reg.toys || []).filter(function (t) { return !t.hidden; }).sort(function (a, b) { return a.order - b.order; });
    arms = Math.min(MAX_ARMS, Math.max(5, Math.ceil(toys.length / PER_ARM)));
    build();
    initGL();
    layout();
    returning();
    requestAnimationFrame(frame);
  }).catch(function (err) {
    live.textContent = 'The Blossom could not load its toys.';
    console.error(err);
  });

  /* ── beads + bloom selector ──────────────────────────────────── */
  function armOf(i) { return i % arms; }
  function slotOf(i) { return Math.floor(i / arms); }
  function countIn(a) { var n = 0; for (var i = 0; i < toys.length; i++) if (armOf(i) === a) n++; return n; }

  function build() {
    // DOM order runs arm by arm, so Tab walks along an arm and then on to the next one
    var order = toys.map(function (_, i) { return i; }).sort(function (a, b) { return armOf(a) - armOf(b) || slotOf(a) - slotOf(b); });
    order.forEach(function (i) {
      var t = toys[i], w = worlds[t.world] || worlds.XX || { name: '', glyph: '◎', tint: ['#D9A5FF', '#25D9FF'] };
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'bead'; b.dataset.i = i;
      b.style.setProperty('--t1', w.tint[0]); b.style.setProperty('--t2', w.tint[1]);
      b.setAttribute('aria-label', t.title + '. ' + t.blurb + (w.name ? ' ' + w.name + ' world.' : ''));
      b.innerHTML = '<span class="bead-orb"><img alt="" decoding="async" loading="lazy" draggable="false"></span>' +
        '<span class="bead-glyph" aria-hidden="true"></span><span class="bead-name" aria-hidden="true"></span>';
      b.querySelector('img').src = t.poster;
      b.querySelector('.bead-glyph').textContent = w.glyph || '◎';
      b.querySelector('.bead-name').textContent = t.title;
      b.addEventListener('click', function () { pull(i); });
      b.addEventListener('pointerenter', function () { hiArm = armOf(i); hiUntil = time + 1.2; });
      b.addEventListener('focus', function () { hiArm = armOf(i); hiUntil = time + 1.5; });
      b.addEventListener('keydown', onBeadKey);
      beadsEl.appendChild(b);
      beads[i] = b;
    });
    bloomEl.innerHTML = '';
    for (var a = 0; a < arms; a++) {
      var names = toys.filter(function (_, i) { return armOf(i) === a; }).map(function (t) { return t.title; });
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'bloom-opt'; btn.dataset.arm = a;
      btn.textContent = String(a + 1);
      btn.setAttribute('aria-label', 'Arm ' + (a + 1) + (names.length ? ': ' + names.join(', ') : ': empty'));
      btn.setAttribute('aria-pressed', 'false');
      if (!names.length) { btn.disabled = true; btn.classList.add('is-locked'); }
      btn.addEventListener('click', onBloom);
      bloomEl.appendChild(btn);
    }
  }

  function onBloom(e) {
    var a = +e.currentTarget.dataset.arm;
    bloomEl.querySelectorAll('.bloom-opt').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.arm === a)); });
    // turn the Blossom so this arm reaches straight up
    var base = a * Math.PI * 2 / arms;
    var want = -base;
    var d = ((want - rot) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    rotTarget = rot + d; rotVel = 0;
    hiArm = a; hiUntil = time + 2.6;
    var first = toys.findIndex(function (_, i) { return armOf(i) === a && slotOf(i) === 0; });
    if (first >= 0) beads[first].focus({ preventScroll: true });
  }

  function onBeadKey(e) {
    var i = +e.currentTarget.dataset.i, a = armOf(i), s = slotOf(i), j = -1;
    var list = Array.prototype.slice.call(beadsEl.querySelectorAll('.bead'));
    var pos = list.indexOf(e.currentTarget);
    if (e.key === 'ArrowRight') j = +list[(pos + 1) % list.length].dataset.i;
    else if (e.key === 'ArrowLeft') j = +list[(pos - 1 + list.length) % list.length].dataset.i;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      var dir = e.key === 'ArrowDown' ? 1 : -1;
      for (var n = 1; n <= arms && j < 0; n++) {
        var aa = (a + dir * n + arms) % arms;
        var cands = toys.map(function (_, k) { return k; }).filter(function (k) { return armOf(k) === aa; });
        if (cands.length) j = cands[Math.min(s, cands.length - 1)];
      }
    }
    if (j >= 0) { e.preventDefault(); beads[j].focus(); }
  }

  /* ── geometry ────────────────────────────────────────────────── */
  function layout() {
    var r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    var topRoom = 70, botRoom = Math.min(150, H * 0.2);
    var availH = H - topRoom - botRoom;
    cx = W / 2; cy = topRoom + availH / 2;
    sx = Math.min(1.42, Math.max(1, (W / availH) * 0.78));      // landscape stretches the Blossom sideways
    sy = W < availH ? Math.min(1.6, Math.max(1, (availH / W) * 0.95)) : 1;   // portrait stretches it tall
    R = Math.min((W / 2 - 12) / sx * 0.98, availH * 0.5 / sy) * zoom;
    r0 = R * 0.3;
    // bead size: room along the arm, never smaller than a thumb
    beadSize = Math.round(Math.max(48, Math.min(R * 0.24, 92)));
    beads.forEach(function (b) { if (b) b.style.setProperty('--b', beadSize + 'px'); });
    titleEl.style.setProperty('--r0', r0 + 'px');
    titleEl.style.left = cx + 'px'; titleEl.style.top = cy + 'px';
    titleEl.classList.toggle('compact', r0 < 70);
    if (pulled >= 0) placePortal();
    if (gl) {
      rs = Math.min(window.devicePixelRatio || 1, 2) * 0.55;
      canvas.width = Math.max(2, Math.round(W * rs)); canvas.height = Math.max(2, Math.round(H * rs));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    if (useSvg) drawFallback();
  }
  window.addEventListener('resize', layout);
  if (window.ResizeObserver) new ResizeObserver(layout).observe(stage);

  var curl = 1.25;
  function armPoint(a, s, t, out) {
    var theta = rot + a * Math.PI * 2 / arms - Math.PI / 2;
    var wob = calm() ? 0 : 0.11;
    var rr = r0 * 0.82 + (R - r0 * 0.82) * s;
    var phi = theta + curl * Math.pow(s, 1.15) + 0.85 * Math.pow(s, 5) + wob * Math.sin(t * 0.7 + a * 1.9 + s * 4.2) * s;
    out[0] = cx + tiltX + Math.cos(phi) * rr * sx;
    out[1] = cy + tiltY + Math.sin(phi) * rr * sy;
    out[2] = R * (0.135 * (1 - s) + 0.04 * s) * (1 + 0.07 * Math.sin(t * 1.3 + a + s * 6));
  }

  var tmp = [0, 0, 0], pts = [];
  function updateArms(t) {
    for (var a = 0; a < arms; a++) {
      // sample the arm and measure it
      var arc = [0], P = [];
      for (var k = 0; k < K; k++) {
        armPoint(a, k / (K - 1), t, tmp);
        P.push([tmp[0], tmp[1], tmp[2]]);
        if (k) arc.push(arc[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
      }
      pts[a] = { P: P, arc: arc };
      var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      for (k = 0; k < K; k++) {
        var o = (a * K + k) * 4;
        armPts[o] = P[k][0] * rs; armPts[o + 1] = (H - P[k][1]) * rs; armPts[o + 2] = P[k][2] * rs; armPts[o + 3] = a;
        minx = Math.min(minx, P[k][0] - P[k][2]); maxx = Math.max(maxx, P[k][0] + P[k][2]);
        miny = Math.min(miny, P[k][1] - P[k][2]); maxy = Math.max(maxy, P[k][1] + P[k][2]);
      }
      var bo = a * 4;
      armBox[bo] = (minx + maxx) / 2 * rs; armBox[bo + 1] = (H - (miny + maxy) / 2) * rs;
      armBox[bo + 2] = Math.hypot(maxx - minx, maxy - miny) / 2 * rs; armBox[bo + 3] = 0;
    }
  }

  function pointAtArc(a, f) {
    var A = pts[a], total = A.arc[K - 1], d = f * total;
    for (var k = 1; k < K; k++) {
      if (A.arc[k] >= d) {
        var u = (d - A.arc[k - 1]) / Math.max(1e-3, A.arc[k] - A.arc[k - 1]);
        return [A.P[k - 1][0] + (A.P[k][0] - A.P[k - 1][0]) * u, A.P[k - 1][1] + (A.P[k][1] - A.P[k - 1][1]) * u];
      }
    }
    return [A.P[K - 1][0], A.P[K - 1][1]];
  }

  var beadPos = [];
  function placeBeads() {
    for (var i = 0; i < toys.length; i++) {
      var a = armOf(i), s = slotOf(i), n = countIn(a);
      var slots = Math.max(3, n);
      var f = 0.4 + (s + 0.5) / slots * 0.58;
      var p = pointAtArc(a, f);
      beadPos[i] = p;
      var b = beads[i];
      if (b) b.style.transform = 'translate3d(' + (p[0] - beadSize / 2).toFixed(1) + 'px,' + (p[1] - beadSize / 2).toFixed(1) + 'px,0)';
    }
  }

  /* ── pull · knock · open · release ───────────────────────────── */
  var S = 300;
  function placePortal() {
    S = Math.round(Math.min(W * 0.84, (H - 70 - Math.min(150, H * 0.2)) * 0.82, 540));
    portal.style.setProperty('--S', S + 'px');
    portal.style.left = (cx - S / 2) + 'px'; portal.style.top = (cy - S / 2) + 'px';
  }

  function pull(i) {
    if (opening) return;
    if (pulled === i) { knock(); return; }
    if (pulled >= 0) release(true);
    pulled = i; knocks = 0;
    var t = toys[i], w = worlds[t.world] || worlds.XX;
    placePortal();
    portal.style.setProperty('--t1', w.tint[0]); portal.style.setProperty('--t2', w.tint[1]);
    portal.innerHTML =
      '<div class="portal-name" aria-hidden="true"></div>' +
      '<div class="portal-orb"><img class="portal-poster" alt="" draggable="false"></div>' +
      '<div class="portal-film" aria-hidden="true"></div>' +
      '<button type="button" class="knock"></button>' +
      '<div class="pips" aria-hidden="true"><i></i><i></i><i></i></div>';
    portal.querySelector('.portal-name').textContent = t.title;
    portal.querySelector('.portal-poster').src = t.poster;
    var kb = portal.querySelector('.knock');
    kb.setAttribute('aria-label', 'Knock to open ' + t.title + '. Three knocks open it.');
    kb.addEventListener('click', knock);
    if (t.previewSafe !== false) {
      var f = document.createElement('iframe');
      f.title = 'Preview of ' + t.title; f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
      f.setAttribute('allow', 'autoplay');
      f.src = t.path + '?preview=1';
      f.addEventListener('load', function () { setTimeout(function () { f.classList.add('ready'); }, 700); });
      portal.querySelector('.portal-orb').appendChild(f);
    } else {
      portal.querySelector('.portal-orb').classList.add('drift');
    }
    portal.hidden = false;
    beads[i].classList.add('is-pulled');
    titleEl.classList.add('covered');
    stage.classList.add('has-pull');
    enterBtn.hidden = false;
    enterBtn.setAttribute('aria-label', 'Enter the goo: open ' + t.title);
    // grow from the bead into the vortex
    var bp = beadPos[i] || [cx, cy];
    if (!calm() && portal.animate) {
      portal.animate([
        { transform: 'translate(' + (bp[0] - cx) + 'px,' + (bp[1] - cy) + 'px) scale(' + (beadSize / S) + ')', opacity: 0.6 },
        { transform: 'none', opacity: 1 }
      ], { duration: 650, easing: 'cubic-bezier(.34,1.32,.64,1)' });
    } else if (portal.animate) {
      portal.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
    rippleAt(cx, cy, 0.7);
    renderPips();
    live.textContent = t.title + ' is in the vortex. Knock three times, or press Enter the goo.';
    setTimeout(function () { kb.focus({ preventScroll: true }); }, 30);
  }

  function knock() {
    if (pulled < 0 || opening) return;
    knocks++;
    clearTimeout(knockTimer);
    renderPips();
    var orb = portal.querySelector('.portal-orb');
    if (!calm()) {
      portal.classList.remove('squish'); void portal.offsetWidth; portal.classList.add('squish');
      var ring = document.createElement('span'); ring.className = 'knock-ring'; portal.appendChild(ring);
      setTimeout(function () { ring.remove(); }, 900);
    }
    rippleAt(cx, cy, 0.5 + knocks * 0.25);
    try { if (navigator.vibrate) navigator.vibrate(14); } catch (e) {}
    if (knocks >= KNOCKS) { open(pulled); return; }
    live.textContent = 'Knock ' + knocks + ' of ' + KNOCKS + '.';
    knockTimer = setTimeout(function () { knocks = 0; renderPips(); }, KNOCK_RESET_MS);
    void orb;
  }
  function renderPips() {
    portal.querySelectorAll('.pips i').forEach(function (p, k) { p.classList.toggle('on', k < knocks); });
  }

  function open(i) {
    if (opening) return;
    opening = true;
    var t = toys[i], w = worlds[t.world] || worlds.XX;
    try { sessionStorage.setItem('gooae.last', t.slug); } catch (e) {}
    var veil = document.createElement('div');
    veil.className = 'ripple-out';
    veil.style.setProperty('--t1', w.tint[0]); veil.style.setProperty('--t2', w.tint[1]);
    veil.style.left = cx + 'px'; veil.style.top = cy + 'px';
    veil.style.width = veil.style.height = S + 'px';
    stage.appendChild(veil);
    var go = function () { location.href = t.path; };
    live.textContent = 'Opening ' + t.title + '.';
    if (calm() || !veil.animate) {
      veil.style.transform = 'translate(-50%,-50%) scale(' + (Math.hypot(W, H) * 2.1 / S) + ')';
      if (!veil.animate) { go(); return; }
      veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: 'forwards' }).onfinish = go;
      return;
    }
    var big = Math.hypot(W, H) * 2.1 / S;
    var anim = veil.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 0.4 },
      { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 0.85, offset: 0.18 },
      { transform: 'translate(-50%,-50%) scale(' + big + ')', opacity: 1 }
    ], { duration: 760, easing: 'cubic-bezier(.6,.0,.3,1)', fill: 'forwards' });
    rippleAt(cx, cy, 1.6);
    anim.onfinish = go;
  }

  function release(instant) {
    if (pulled < 0) return;
    var i = pulled; pulled = -1; knocks = 0; clearTimeout(knockTimer);
    var b = beads[i], bp = beadPos[i] || [cx, cy];
    var done = function () {
      portal.hidden = true; portal.innerHTML = '';
      b.classList.remove('is-pulled');
      if (pulled < 0) { titleEl.classList.remove('covered'); stage.classList.remove('has-pull'); enterBtn.hidden = true; }
      if (!instant && pulled < 0) b.focus({ preventScroll: true });
    };
    if (instant || calm() || !portal.animate) { done(); }
    else {
      var a = portal.animate([
        { transform: 'none', opacity: 1 },
        { transform: 'translate(' + (bp[0] - cx) + 'px,' + (bp[1] - cy) + 'px) scale(' + (beadSize / S) + ')', opacity: 0.5 }
      ], { duration: 420, easing: 'cubic-bezier(.5,0,.7,.4)' });
      a.onfinish = done;
    }
    live.textContent = toys[i].title + ' went back to its arm.';
  }

  enterBtn.addEventListener('click', function () { if (pulled >= 0) open(pulled); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pulled >= 0 && !opening) { e.preventDefault(); release(false); }
  });
  window.addEventListener('pageshow', function (e) {   // coming back with the browser's back button
    if (e.persisted) { opening = false; stage.querySelectorAll('.ripple-out').forEach(function (v) { v.remove(); }); release(true); }
  });

  /* ── spin · pinch · tilt ─────────────────────────────────────── */
  var ptrs = new Map(), drag = null, pinch0 = 0, zoom0 = 1;
  stage.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.bead, #portal, button, a')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var r = stage.getBoundingClientRect();
    if (ptrs.size === 1) drag = { a: Math.atan2(e.clientY - r.top - cy, e.clientX - r.left - cx), moved: 0, t: performance.now() };
    if (ptrs.size === 2) { var v = Array.from(ptrs.values()); pinch0 = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y); zoom0 = zoom; }
    stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function (e) {
    if (!ptrs.has(e.pointerId)) return;
    var prev = ptrs.get(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var r = stage.getBoundingClientRect();
    if (ptrs.size === 2) {
      var v = Array.from(ptrs.values());
      var d = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
      zoom = Math.min(1.25, Math.max(0.8, zoom0 * d / Math.max(1, pinch0))); layout(); return;
    }
    if (!drag) return;
    drag.moved += Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
    var ang = Math.atan2(e.clientY - r.top - cy, e.clientX - r.left - cx);
    var da = ang - drag.a; if (da > Math.PI) da -= Math.PI * 2; if (da < -Math.PI) da += Math.PI * 2;
    var now = performance.now(), dt = Math.max(1, now - drag.t) / 1000;
    rot += da; rotVel = da / dt * 0.6; rotTarget = null;
    drag.a = ang; drag.t = now;
  });
  function endPtr(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (ptrs.size === 0) {
      if (drag && drag.moved < 8 && pulled >= 0 && e.type === 'pointerup') release(false);   // tap outside sends the bubble home
      drag = null;
    }
  }
  stage.addEventListener('pointerup', endPtr);
  stage.addEventListener('pointercancel', endPtr);
  stage.addEventListener('wheel', function (e) {
    if (e.target.closest('#portal')) return;
    e.preventDefault();
    if (e.ctrlKey) { zoom = Math.min(1.25, Math.max(0.8, zoom * (1 - e.deltaY * 0.004))); layout(); }
    else { rotVel += e.deltaY * 0.0009 + e.deltaX * 0.0009; rotTarget = null; }
  }, { passive: false });
  // tilt parallax where the browser gives orientation without a permission prompt
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', function (e) {
      if (calm() || e.gamma == null) return;
      tiltX = Math.max(-1, Math.min(1, e.gamma / 30)) * 10;
      tiltY = Math.max(-1, Math.min(1, (e.beta - 45) / 30)) * 8;
    });
  }

  /* ── coming home from a toy ──────────────────────────────────── */
  function returning() {
    var q = new URLSearchParams(location.search), from = q.get('from');
    if (!from) return;
    var i = toys.findIndex(function (t) { return t.slug === from; });
    if (i < 0) return;
    history.replaceState(null, '', location.pathname);
    var a = armOf(i);
    rot = -a * Math.PI * 2 / arms + 0.35;            // that arm near the top
    beads[i].classList.add('is-return');
    var opt = bloomEl.querySelector('[data-arm="' + a + '"]'); if (opt) opt.classList.add('is-pulse');
    setTimeout(function () { beads[i].classList.remove('is-return'); if (opt) opt.classList.remove('is-pulse'); }, 4200);
    hiArm = a; hiUntil = 2.5;
    setTimeout(function () { beads[i].focus({ preventScroll: true }); }, 60);
  }

  function rippleAt(x, y, s) { ripple.x = x; ripple.y = y; ripple.t = 0; ripple.s = s; }

  /* ── frame loop ──────────────────────────────────────────────── */
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var still = calm();
    if (!still) time += dt; else time = frozenTime;
    if (rotTarget !== null) {
      var d = rotTarget - rot; rot += d * Math.min(1, dt * (still ? 30 : 6));
      if (Math.abs(d) < 0.002) { rot = rotTarget; rotTarget = null; }
    } else if (!drag) {
      rot += rotVel * dt;
      rotVel *= Math.pow(0.12, dt);
      if (!still) rot += 0.035 * dt;                  // the slow idle spin
    }
    lightT += (lightGoal - lightT) * Math.min(1, dt * 5);
    if (still) lightT = lightGoal;
    ripple.t += dt;
    if (hiUntil < time) hiArm = -1;
    updateArms(time);
    placeBeads();
    if (gl) draw();
    requestAnimationFrame(frame);
  }

  /* ── WebGL2 goo ──────────────────────────────────────────────── */
  var VS = '#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime, uLight, uR0, uThick, uHi, uDpr; uniform vec2 uS;',
    'uniform vec2 uC; uniform vec4 uP[' + (MAX_ARMS * K) + ']; uniform vec4 uB[' + MAX_ARMS + ']; uniform int uN;',
    'uniform vec4 uRip;',
    'out vec4 o;',
    'const int K=' + K + ';',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+17.1;a*=.5;}return s;}',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    'float seg(vec2 p,vec4 A,vec4 B,out float h){vec2 pa=p-A.xy,ba=B.xy-A.xy;h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-mix(A.z,B.z,h);}',
    'vec3 pal(float t){t=fract(t)*4.;vec3 c0=vec3(1.,.12,.72),c1=vec3(.58,.16,1.),c2=vec3(.16,.82,1.),c3=vec3(1.,.42,.86);',
    '  return t<1.?mix(c0,c1,smoothstep(0.,1.,t)):t<2.?mix(c1,c2,smoothstep(1.,2.,t)):t<3.?mix(c2,c3,smoothstep(2.,3.,t)):mix(c3,c0,smoothstep(3.,4.,t));}',
    'vec3 bg(vec2 px){',
    '  vec2 q=px/uRes.y; float t=uTime*.03;',
    '  float n=fbm(q*2.2+vec2(t,-t*.7)), n2=fbm(q*4.-vec2(t*1.3,t));',
    '  float lb=0.; for(int i=0;i<5;i++){float fi=float(i);vec2 c=vec2((.12+.19*fi+.05*sin(uTime*.11+fi))*uRes.x/uRes.y,fract(.23*fi+uTime*.011*(1.+fi*.3))*1.5-.25);lb+=.01/(dot(q-c,q-c)+.002);}',
    '  float lava=smoothstep(.8,3.,lb);',
    '  vec3 d=mix(vec3(.047,.02,.07),vec3(.17,.02,.22),n)+vec3(.6,0.,.48)*pow(n2,3.)*.5+vec3(0.,.35,.5)*pow(1.-n2,4.)*.22+vec3(.95,.12,.62)*lava*.16;',
    '  vec2 g=floor(px/(2.*uDpr)); float st=hash(g); d+=step(.9988,st)*vec3(.9,.8,1.)*(.45+.55*sin(uTime*1.7+st*40.));',
    '  vec3 l=mix(vec3(.97,.91,1.),vec3(1.,.84,.95),n)+vec3(.35,.85,.75)*pow(n2,3.)*.22-vec3(0.,.16,.06)*pow(1.-n2,4.)*.2+vec3(1.,.35,.72)*lava*.22;',
    '  return mix(d,l,uLight);',
    '}',
    'void main(){',
    '  vec2 p=gl_FragCoord.xy;',
    '  float d=1e9, best=1e9, arm=-1., s=0.;',
    '  for(int a=0;a<' + MAX_ARMS + ';a++){ if(a>=uN) break;',
    '    vec4 bb=uB[a]; if(length(p-bb.xy)-bb.z>uThick*3.) continue;',
    '    float da=1e9;',
    '    vec4 A=uP[a*K];',
    '    for(int k=1;k<K;k++){ vec4 B=uP[a*K+k]; float hh; float ds=seg(p,A,B,hh); if(ds<best){best=ds;arm=float(a);s=(float(k-1)+hh)/float(K-1);} da=min(da,ds); A=B; }',
    '    d=smin(d,da,uThick*.9);',
    '  }',
    '  vec2 vp=(p-uC)/uS; float vr=length(vp); float dv=vr-uR0;',
    '  d=smin(d,dv,uR0*.45);',
    '  vec3 col=bg(p);',
    '  float halo=exp(-max(d,0.)/(uThick*1.3));',
    '  vec3 glowC=mix(vec3(.85,.08,.7),vec3(.55,.2,1.),.5+.5*sin(uTime*.4));',
    '  col+=glowC*halo*mix(.55,.28,uLight);',
    '  float h=clamp(-d/uThick,0.,1.); float dome=sqrt(h*(2.-h));',
    '  vec2 gd=vec2(dFdx(d),dFdy(d)); gd/=max(length(gd),1e-4);',
    '  vec3 n=normalize(vec3(gd*(1.-dome)*1.7,dome+.22));',
    '  float fres=pow(1.-n.z,2.);',
    '  vec3 L=normalize(vec3(-.45,.6,.75));',
    '  float spec=pow(max(dot(reflect(-L,n),vec3(0,0,1)),0.),36.);',
    '  float spec2=pow(max(dot(reflect(-normalize(vec3(.6,-.4,.7)),n),vec3(0,0,1)),0.),18.)*.35;',
    '  vec3 thru=bg(p+n.xy*uThick*1.4);',
    '  float hue=arm*.21+s*.55+uTime*.02;',
    '  vec3 base=pal(hue);',
    '  vec3 film=.5+.5*cos(6.2832*(vec3(0.,.33,.67)+fres*1.3+s*.8+uTime*.05));',
    '  vec3 body=base*(.38+.62*dome)+thru*.22;',
    '  vec3 goo=mix(body,film*mix(.9,1.,uLight),.18+.42*fres);',
    '  goo+=base*pow(dome,3.)*.35;',
    '  goo+=spec*vec3(1.)*1.25+spec2*vec3(1.,.85,1.);',
    '  goo+=vec3(1.,.8,.95)*exp(-abs(d)/(1.6*uDpr))*.45;',
    '  if(arm==uHi) goo+=vec3(.85,1.,.3)*(.18+.35*fres)*(.65+.35*sin(uTime*5.));',
    // the vortex disc
    '  float a2=atan(vp.y,vp.x); float rr=vr/uR0;',
    '  float sp=.5+.5*sin(a2*3.-log(rr+.002)*7.5-uTime*1.6);',
    '  float sp2=.5+.5*sin(a2*5.+log(rr+.002)*4.-uTime*.9);',
    '  vec3 vcol=mix(vec3(.32,.02,.48),vec3(1.,.24,.8),sp)*(.45+.85*rr)+vec3(.35,.9,1.)*pow(sp2,5.)*.45*rr+vec3(.7,.3,1.)*pow(1.-abs(rr-.55)*2.,3.)*.25;',
    '  vcol=mix(vcol,vcol*.55+vec3(.98,.75,.95)*.5,uLight*.6);',
    '  vcol+=vec3(1.,.85,1.)*exp(-rr*rr*9.)*.35;',
    '  float inV=smoothstep(uR0*1.0,uR0*.8,vr);',
    '  goo=mix(goo,vcol+spec*.9,inV*.94);',
    '  goo+=vec3(1.,.85,1.)*exp(-abs(vr-uR0*.97)/(2.*uDpr))*.5;',
    '  float inside=smoothstep(1.2*uDpr,-1.2*uDpr,d);',
    '  col=mix(col,goo,inside);',
    // knock ripples
    '  float rp=uRip.z; if(rp<1.6){float rad=rp*uR0*4.5; float ring=exp(-abs(length((p-uRip.xy)/uS)-rad)/(uThick*.35))*(1.-rp/1.6)*uRip.w; col+=vec3(1.,.75,1.)*ring*.55;}',
    '  o=vec4(col,1.);',
    '}'
  ].join('\n');

  function initGL() {
    try { gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    if (!gl) { useFallback(); return; }
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.warn('[blossom] falling back:', e.message); gl = null; useFallback(); return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uTime', 'uLight', 'uR0', 'uS', 'uThick', 'uHi', 'uDpr', 'uC', 'uP', 'uB', 'uN', 'uRip'].forEach(function (n) { uni[n] = gl.getUniformLocation(prog, n); });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); gl = null; useFallback(); });
  }

  function draw() {
    gl.uniform2f(uni.uRes, canvas.width, canvas.height);
    gl.uniform1f(uni.uTime, time);
    gl.uniform1f(uni.uLight, lightT);
    gl.uniform1f(uni.uR0, r0 * rs);
    gl.uniform2f(uni.uS, sx, sy);
    gl.uniform1f(uni.uThick, R * 0.075 * rs);
    gl.uniform1f(uni.uHi, hiArm);
    gl.uniform1f(uni.uDpr, rs);
    gl.uniform2f(uni.uC, (cx + tiltX) * rs, (H - cy - tiltY) * rs);
    gl.uniform4fv(uni.uP, armPts);
    gl.uniform4fv(uni.uB, armBox);
    gl.uniform1i(uni.uN, arms);
    gl.uniform4f(uni.uRip, (cx) * rs, (H - cy) * rs, ripple.t, ripple.s);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ── fallback: a still SVG Blossom ───────────────────────────── */
  var useSvg = false;
  function useFallback() { useSvg = true; html.classList.add('no-gl'); canvas.style.display = 'none'; fallback.removeAttribute('hidden'); drawFallback(); }
  function drawFallback() {
    if (!useSvg || !fallback || !W || !toys.length) return;
    updateArms(frozenTime);
    var svg = '<defs><filter id="goo"><feGaussianBlur stdDeviation="6"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -9"/></filter>' +
      '<radialGradient id="vg"><stop offset="0" stop-color="#ffd6f4"/><stop offset=".45" stop-color="#F000A8"/><stop offset="1" stop-color="#3a0058"/></radialGradient>' +
      '<linearGradient id="ag" x1="0" x2="1"><stop offset="0" stop-color="#B000FF"/><stop offset=".5" stop-color="#FF4BBF"/><stop offset="1" stop-color="#25D9FF"/></linearGradient></defs>' +
      '<g filter="url(#goo)" fill="url(#ag)">';
    for (var a = 0; a < arms; a++) {
      var P = pts[a].P;
      for (var k = 0; k < K; k += 1) svg += '<circle cx="' + P[k][0].toFixed(1) + '" cy="' + P[k][1].toFixed(1) + '" r="' + P[k][2].toFixed(1) + '"/>';
    }
    svg += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + (r0 * sx) + '" ry="' + (r0 * sy) + '" fill="url(#vg)"/></g>';
    fallback.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    fallback.innerHTML = svg;
  }
})();
