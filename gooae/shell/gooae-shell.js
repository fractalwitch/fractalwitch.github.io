/* ═══════════════════════════════════════════════════════════════
   GOOAE SHARED TOY SHELL · v1
   Load it in <head>, before the toy's own scripts:

   <link rel="stylesheet" href="/gooae/shell/gooae-shell.css">
   <script src="/gooae/shell/gooae-shell.js"
           data-toy="flood-oracle"        slug in /gooae/toys.json
           data-dev="#devBtn"             the toy's own DEV MODE button
           data-bar=".devbar"             the toy's old bottom bar (hidden; extra buttons move up)
           data-panel=".dev"              the toy's dev-only UI (▲ collapses it)
           data-top="#title"             pinned dev panels that should sit below the bar
           data-frame="device"></script>  device | full

   ?preview=1  → no chrome, pixel ratio ≤ 1, no permission prompts (Blossom bubbles)
   ?noframe=1  → skip the desktop device frame
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.GooShell) return;

  var S = document.currentScript || {};
  var D = S.dataset || {};
  var cfg = {
    toy: D.toy || '',
    dev: D.dev || '',
    bar: D.bar || '',
    panel: D.panel || '',
    frame: D.frame || 'device',
    top: D.top || ''
  };
  var BASE = S.src ? new URL('../', S.src).pathname : '/gooae/';
  var REPO = 'https://github.com/fractalwitch/fractalwitch.github.io/blob/main';
  var html = document.documentElement;
  var qs = new URLSearchParams(location.search);
  var inFrame = false;
  try { inFrame = window.self !== window.top; } catch (e) { inFrame = true; }
  var isPreview = qs.has('preview');
  var isFramed = !isPreview && (qs.has('framed') || inFrame);

  html.setAttribute('data-gs', '');
  if (isPreview) html.setAttribute('data-gs-preview', '');
  if (isFramed) html.setAttribute('data-gs-framed', '');

  /* ── desktop: show device-frame toys inside a device ─────────── */
  var wideDesk = window.matchMedia && matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  if (!isPreview && !isFramed && cfg.frame === 'device' && wideDesk && !qs.has('noframe') && cfg.toy) {
    html.style.visibility = 'hidden';            // the toy page is about to be swapped for its device frame
    location.replace(BASE + 'frame.html?toy=' + encodeURIComponent(cfg.toy) + location.hash);
    return;
  }

  /* ── preview: calm, quiet, no prompts ────────────────────────── */
  if (isPreview) {
    var realDpr = window.devicePixelRatio || 1;
    try { Object.defineProperty(window, 'devicePixelRatio', { get: function () { return Math.min(realDpr, 1); }, configurable: true }); } catch (e) {}
    ['DeviceOrientationEvent', 'DeviceMotionEvent'].forEach(function (k) {
      if (window[k] && typeof window[k].requestPermission === 'function') {
        window[k].requestPermission = function () { return Promise.resolve('denied'); };
      }
    });
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = function () { return Promise.reject(new DOMException('Not in preview', 'NotAllowedError')); };
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC && AC.prototype) AC.prototype.resume = function () { return Promise.resolve(); };
    try { navigator.vibrate = function () { return false; }; } catch (e) {}
  }

  /* ── fonts for the bar (once) ────────────────────────────────── */
  if (!document.querySelector('link[data-gs-fonts]')) {
    var lf = document.createElement('link');
    lf.rel = 'stylesheet'; lf.setAttribute('data-gs-fonts', '');
    lf.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Silkscreen&family=Syne:wght@400;600&family=JetBrains+Mono&display=swap';
    (document.head || html).appendChild(lf);
  }

  /* ── comfort prefs, shared by every toy ──────────────────────── */
  var PKEY = 'gooae.prefs.v1';
  var prefs = { motion: 'auto', contrast: 'standard', text: 1 };
  try { var sp = JSON.parse(localStorage.getItem(PKEY) || '{}'); if (sp && typeof sp === 'object') { for (var k in sp) prefs[k] = sp[k]; } } catch (e) {}
  var mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reducedMotion() { return prefs.motion === 'reduce' || (prefs.motion === 'auto' && mqReduce.matches); }
  function applyPrefs() {
    html.setAttribute('data-gs-motion', reducedMotion() ? 'reduce' : 'full');
    html.setAttribute('data-gs-contrast', prefs.contrast === 'high' ? 'high' : 'standard');
    html.style.setProperty('--gs-text', String(prefs.text || 1));
  }
  function savePrefs() { try { localStorage.setItem(PKEY, JSON.stringify(prefs)); } catch (e) {} applyPrefs(); fire('prefs', api.prefs); }
  applyPrefs();

  /* ── public API ──────────────────────────────────────────────── */
  var listeners = { mode: [], pause: [], resume: [], prefs: [] };
  function fire(type, arg) { (listeners[type] || []).forEach(function (fn) { try { fn(arg); } catch (e) { console.error(e); } }); }
  var api = {
    version: 1,
    toy: cfg.toy,
    base: BASE,
    isPreview: isPreview,
    isFramed: isFramed,
    entry: null,
    get mode() { return isDev() ? 'dev' : 'toy'; },
    get prefs() { return { motion: prefs.motion, contrast: prefs.contrast, text: prefs.text, reducedMotion: reducedMotion() }; },
    onMode: function (fn) { listeners.mode.push(fn); },
    onPause: function (fn) { listeners.pause.push(fn); },
    onResume: function (fn) { listeners.resume.push(fn); },
    onPrefs: function (fn) { listeners.prefs.push(fn); },
    home: function () { goHome(); },
    toggleDev: function () { toggleDev(); }
  };
  window.GooShell = api;

  /* ── state ───────────────────────────────────────────────────── */
  var devBtn = null, oldBar = null, ui = {}, lastDev = null, entry = null;
  var MKEY = 'gooae.mode.' + cfg.toy;

  function homeHref() { return BASE + (cfg.toy ? '?from=' + encodeURIComponent(cfg.toy) : ''); }
  function goHome() { try { window.top.location.href = homeHref(); } catch (e) { location.href = homeHref(); } }

  function isDev() {
    var m = html.getAttribute('data-mode');
    if (m === 'dev') return true;
    if (m === 'toy') return false;
    if (document.body && document.body.classList.contains('devmode')) return true;
    if (devBtn) return devBtn.getAttribute('aria-pressed') === 'true' || devBtn.classList.contains('on') || devBtn.classList.contains('active');
    return false;
  }

  function toggleDev() {
    if (devBtn) devBtn.click();
    else html.setAttribute('data-mode', isDev() ? 'toy' : 'dev');
    setTimeout(sync, 0);
  }

  function findDevButton() {
    if (cfg.dev) { var b = document.querySelector(cfg.dev); if (b) return b; }
    var all = document.querySelectorAll('button');
    for (var i = 0; i < all.length; i++) { if (/dev\s*mode/i.test(all[i].textContent || '')) return all[i]; }
    return null;
  }

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var a in attrs) {
      if (a === 'text') n.textContent = attrs[a];
      else if (a === 'html') n.innerHTML = attrs[a];
      else if (a.slice(0, 2) === 'on') n.addEventListener(a.slice(2), attrs[a]);
      else n.setAttribute(a, attrs[a]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  /* ── build ───────────────────────────────────────────────────── */
  function init() {
    devBtn = findDevButton();
    oldBar = cfg.bar ? document.querySelector(cfg.bar) : (devBtn ? devBtn.parentElement : null);
    if (oldBar === document.body) oldBar = null;
    if (cfg.panel) {
      try { document.querySelectorAll(cfg.panel).forEach(function (n) { n.setAttribute('data-shell-panel', ''); }); } catch (e) { console.warn('[gooae-shell] bad data-panel selector', e); }
    }
    if (cfg.top) {
      try { document.querySelectorAll(cfg.top).forEach(function (n) { n.setAttribute('data-shell-top', ''); }); } catch (e) {}
    }
    var extras = [];
    if (oldBar) {
      oldBar.querySelectorAll('button').forEach(function (b) { if (b !== devBtn) extras.push(b); });
      oldBar.setAttribute('data-shell-bar', '');
    }
    if (devBtn && devBtn !== oldBar && !oldBar) devBtn.setAttribute('data-shell-bar', '');

    if (!isPreview) buildBar(extras);
    else extras.forEach(function (b) { b.setAttribute('data-shell-bar', ''); });

    // keep the pills in step with the toy's own mode logic
    var obs = new MutationObserver(sync);
    obs.observe(html, { attributes: true, attributeFilter: ['data-mode'] });
    if (document.body) obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    if (devBtn) obs.observe(devBtn, { attributes: true, attributeFilter: ['aria-pressed', 'class'] });

    // restore the mode this toy was left in
    sync();
    if (!isPreview) {
      var want = null;
      try { want = localStorage.getItem(MKEY); } catch (e) {}
      // wait a beat so the toy's own DOMContentLoaded handlers are wired first
      if (want === 'dev' && location.hash !== '#toy') setTimeout(function () { if (!isDev()) toggleDev(); }, 120);
    }

    // dragging a slider fades the panel so the toy shows through
    document.addEventListener('pointerdown', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('input[type="range"], [role="slider"], .knob, .dial')) html.classList.add('gs-sliding');
    }, true);
    var unslide = function () { html.classList.remove('gs-sliding'); };
    document.addEventListener('pointerup', unslide, true);
    document.addEventListener('pointercancel', unslide, true);
    window.addEventListener('blur', unslide);

    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', function () { fire(document.hidden ? 'pause' : 'resume'); });
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || !e.data || typeof e.data.gooae !== 'string') return;
      if (e.data.gooae === 'pause' || e.data.gooae === 'resume') fire(e.data.gooae);
    });
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', function () { applyPrefs(); fire('prefs', api.prefs); });

    loadEntry();
  }

  function buildBar(extras) {
    ui.dev = el('button', { type: 'button', class: 'gs-pill gs-dev', 'aria-pressed': 'false', title: 'Dev mode (Alt+D)', onclick: toggleDev },
      [el('span', { class: 'gs-lamp', 'aria-hidden': 'true' }), el('span', { text: 'Dev' })]);
    ui.mqText1 = el('span', { class: 'gs-marquee-text' });
    ui.mqText2 = el('span', { class: 'gs-marquee-text', 'aria-hidden': 'true' });
    ui.marquee = el('button', { type: 'button', class: 'gs-pill gs-marquee', 'aria-expanded': 'false', 'aria-controls': 'gs-drawer', title: 'About, source and comfort settings', onclick: toggleDrawer },
      [el('span', { class: 'gs-marquee-track' }, [ui.mqText1, ui.mqText2])]);
    ui.extras = el('div', { class: 'gs-extras' });
    extras.forEach(function (b) { ui.extras.appendChild(b); });
    ui.tri = el('button', { type: 'button', class: 'gs-pill gs-tri', 'aria-expanded': 'true', 'aria-label': 'Hide the toy bar', onclick: onTri },
      [el('span', { 'aria-hidden': 'true', text: '▲' })]);
    ui.home = el('a', { class: 'gs-pill gs-home', href: homeHref(), target: '_top', 'aria-label': 'Home: back to the GOOAE Blossom', title: 'Home (Alt+H)' },
      [el('span', { class: 'gs-word', text: 'Home' }), el('span', { class: 'gs-x', 'aria-hidden': 'true', text: '✕' })]);
    ui.bar = el('div', { class: 'gs-bar', role: 'toolbar', 'aria-label': 'GOOAE toy bar' },
      [ui.dev, ui.marquee, el('div', { class: 'gs-spacer' }), ui.extras, ui.tri, ui.home]);
    ui.nub = el('button', { type: 'button', class: 'gs-nub', 'aria-label': 'Show the toy bar', tabindex: '-1', onclick: onTri, text: '▼' });
    ui.drawer = el('div', { class: 'gs-drawer', id: 'gs-drawer', role: 'dialog', 'aria-label': 'Toy details', hidden: '' });
    ui.source = el('div', { class: 'gs-source', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Source', hidden: '' });
    document.body.appendChild(ui.bar);
    document.body.appendChild(ui.nub);
    document.body.appendChild(ui.drawer);
    document.body.appendChild(ui.source);
    setMarquee(document.title || cfg.toy);
    renderDrawer();
  }

  function setMarquee(text) {
    if (!ui.marquee) return;
    ui.mqText1.textContent = text; ui.mqText2.textContent = text;
    ui.marquee.setAttribute('aria-label', text + ': details, source and comfort settings');
    requestAnimationFrame(function () {
      var track = ui.marquee.querySelector('.gs-marquee-track');
      var over = ui.mqText1.scrollWidth > ui.marquee.clientWidth - 40;
      ui.marquee.classList.toggle('gs-scroll', over);
      if (over) ui.marquee.style.setProperty('--gs-mq-dur', Math.max(8, ui.mqText1.scrollWidth / 28) + 's');
      void track;
    });
  }

  function sync() {
    var dev = isDev();
    if (dev) html.setAttribute('data-gs-dev', ''); else html.removeAttribute('data-gs-dev');
    if (ui.dev) {
      ui.dev.setAttribute('aria-pressed', dev ? 'true' : 'false');
      if (dev) { html.classList.remove('gs-tucked'); }
      else { html.classList.remove('gs-collapsed'); closeDrawer(); }
      var tucked = html.classList.contains('gs-tucked'), collapsed = html.classList.contains('gs-collapsed');
      ui.tri.setAttribute('aria-expanded', dev ? String(!collapsed) : String(!tucked));
      ui.tri.setAttribute('aria-label', dev ? (collapsed ? 'Expand the dev panel' : 'Collapse the dev panel') : 'Hide the toy bar');
      ui.tri.title = ui.tri.getAttribute('aria-label');
      if (dev && entry) setMarquee(entry.title + '  ✧  ' + entry.blurb);
    }
    if (lastDev !== dev) {
      if (lastDev !== null && !isPreview) { try { localStorage.setItem(MKEY, dev ? 'dev' : 'toy'); } catch (e) {} }
      lastDev = dev;
      fire('mode', dev ? 'dev' : 'toy');
    }
  }

  function onTri() {
    if (isDev()) html.classList.toggle('gs-collapsed');
    else {
      var tuck = !html.classList.contains('gs-tucked');
      html.classList.toggle('gs-tucked', tuck);
      ui.nub.tabIndex = tuck ? 0 : -1;
      if (tuck) ui.nub.focus({ preventScroll: true }); else ui.tri.focus({ preventScroll: true });
    }
    sync();
  }

  function toggleDrawer() { if (ui.drawer.hidden) openDrawer(); else closeDrawer(); }
  function openDrawer() { ui.drawer.hidden = false; ui.marquee.setAttribute('aria-expanded', 'true'); }
  function closeDrawer() { if (!ui.drawer || ui.drawer.hidden) return; ui.drawer.hidden = true; ui.marquee.setAttribute('aria-expanded', 'false'); }

  function onKey(e) {
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyD' && !isPreview) { e.preventDefault(); toggleDev(); }
    else if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyH' && !isPreview) { e.preventDefault(); goHome(); }
    else if (e.key === 'Escape' && ui.source) {
      if (!ui.source.hidden) { e.preventDefault(); closeSource(); }
      else if (!ui.drawer.hidden) { e.preventDefault(); closeDrawer(); ui.marquee.focus(); }
    }
  }

  /* ── registry ────────────────────────────────────────────────── */
  function loadEntry() {
    if (!cfg.toy) return;
    fetch(BASE + 'toys.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (reg) {
      var t = (reg.toys || []).filter(function (x) { return x.slug === cfg.toy; })[0];
      if (!t) return;
      entry = t; api.entry = t;
      entry.worldInfo = (reg.worlds || {})[t.world] || null;
      renderDrawer();
      sync();
    }).catch(function () {});
  }

  /* ── drawer: About · Source · Comfort ────────────────────────── */
  function renderDrawer() {
    if (!ui.drawer) return;
    var t = entry || { title: document.title || cfg.toy, blurb: '', sources: ['index.html'], inputs: [], modalities: [] };
    ui.drawer.innerHTML = '';

    var chips = el('div', { class: 'gs-chips' });
    if (t.worldInfo) chips.appendChild(el('span', { class: 'gs-chip', text: t.worldInfo.glyph + ' ' + t.worldInfo.name }));
    if (t.renderer) chips.appendChild(el('span', { class: 'gs-chip', text: t.renderer }));
    if (t.status) chips.appendChild(el('span', { class: 'gs-chip', text: t.status }));
    if (t.canonStatus) chips.appendChild(el('span', { class: 'gs-chip', text: t.canonStatus }));
    var keys = el('div', { class: 'gs-chips', 'aria-label': 'Inputs' });
    (t.inputs || []).forEach(function (i) { keys.appendChild(el('span', { class: 'gs-key', text: i })); });

    var about = el('details', { class: 'gs-nest', open: '' }, [
      el('summary', { text: 'About' }),
      el('div', { class: 'gs-nest-body' }, [
        el('h2', { class: 'gs-title', text: t.title }),
        t.blurb ? el('p', { class: 'gs-blurb', text: t.blurb }) : null,
        chips, keys,
        (t.modalities && t.modalities.length) ? el('p', { class: 'gs-meta', text: 'modalities · ' + t.modalities.join(' · ') }) : null,
        t.id ? el('p', { class: 'gs-meta', text: t.id }) : null
      ])
    ]);

    var files = el('div', { class: 'gs-files' });
    (t.sources || ['index.html']).forEach(function (f) {
      files.appendChild(el('button', { type: 'button', class: 'gs-file', text: f, onclick: function () { openSource(f); } }));
    });
    var source = el('details', { class: 'gs-nest' }, [el('summary', { text: 'Source' }), el('div', { class: 'gs-nest-body' }, [files])]);

    function bubbles(label, key, opts) {
      var g = el('div', { class: 'gs-bubbles', role: 'radiogroup', 'aria-label': label });
      opts.forEach(function (o) {
        var b = el('button', { type: 'button', role: 'radio', class: 'gs-bubble', 'aria-checked': String(prefs[key] === o[0]), text: o[1],
          onclick: function () { prefs[key] = o[0]; savePrefs(); g.querySelectorAll('.gs-bubble').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); } });
        g.appendChild(b);
      });
      return el('div', { class: 'gs-row' }, [el('span', { class: 'gs-label', text: label }), g]);
    }
    var hc = el('button', { type: 'button', role: 'switch', class: 'gs-switch', 'aria-label': 'High contrast', 'aria-checked': String(prefs.contrast === 'high'),
      onclick: function () { prefs.contrast = prefs.contrast === 'high' ? 'standard' : 'high'; hc.setAttribute('aria-checked', String(prefs.contrast === 'high')); savePrefs(); } });
    var comfort = el('details', { class: 'gs-nest' }, [
      el('summary', { text: 'Comfort' }),
      el('div', { class: 'gs-nest-body' }, [
        bubbles('Motion', 'motion', [['auto', 'Auto'], ['reduce', 'Calm'], ['full', 'Full']]),
        el('div', { class: 'gs-row' }, [el('span', { class: 'gs-label', text: 'High contrast' }), hc]),
        bubbles('Text', 'text', [[1, 'A'], [1.15, 'A+'], [1.3, 'A++']]),
        el('div', { class: 'gs-chips', 'aria-label': 'Shortcuts' }, [el('span', { class: 'gs-key', text: 'Alt D' }), el('span', { class: 'gs-chip', text: 'dev' }), el('span', { class: 'gs-key', text: 'Alt H' }), el('span', { class: 'gs-chip', text: 'home' }), el('span', { class: 'gs-key', text: 'Esc' }), el('span', { class: 'gs-chip', text: 'close' })])
      ])
    ]);
    ui.drawer.appendChild(about);
    ui.drawer.appendChild(source);
    ui.drawer.appendChild(comfort);
  }

  /* ── view-source ─────────────────────────────────────────────── */
  var srcFile = null, srcText = '';
  function toyFolder() { return BASE + (entry && entry.path ? entry.path : 'toys/' + cfg.toy + '/'); }
  function openSource(file) {
    srcFile = file;
    var folder = toyFolder();
    var pre = el('pre', { tabindex: '0', 'aria-label': 'Source of ' + file });
    var status = el('span', { class: 'gs-status', text: 'loading…' });
    var tabs = (entry && entry.sources && entry.sources.length > 1) ? entry.sources.map(function (f) {
      return el('button', { type: 'button', class: 'gs-pill', 'aria-pressed': String(f === file), text: f.replace(/^src\//, ''), onclick: function () { openSource(f); } });
    }) : [];
    var copy = el('button', { type: 'button', class: 'gs-pill', text: 'Copy', onclick: function () {
      if (navigator.clipboard) navigator.clipboard.writeText(srcText).then(function () { copy.textContent = 'Copied ✧'; setTimeout(function () { copy.textContent = 'Copy'; }, 1400); });
    } });
    var gh = el('a', { class: 'gs-pill', href: REPO + folder + file, target: '_blank', rel: 'noopener', text: 'GitHub ↗' });
    var close = el('button', { type: 'button', class: 'gs-pill', 'aria-label': 'Close source', text: '✕', onclick: closeSource });
    ui.source.innerHTML = '';
    ui.source.appendChild(el('div', { class: 'gs-source-head' }, [el('span', { class: 'gs-name', text: (entry ? entry.title : cfg.toy) + ' · ' + file })].concat(tabs, [status, copy, gh, close])));
    ui.source.appendChild(pre);
    ui.source.hidden = false;
    closeDrawer();
    close.focus();
    fetch(folder + file, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (txt) {
      if (srcFile !== file) return;
      srcText = txt; pre.textContent = txt;
      status.textContent = txt.split('\n').length + ' lines · ' + Math.round(txt.length / 1024) + ' KB';
    }).catch(function (err) { status.textContent = 'could not load (' + err.message + ')'; });
  }
  function closeSource() { if (!ui.source) return; ui.source.hidden = true; ui.source.innerHTML = ''; srcText = ''; if (ui.marquee) ui.marquee.focus(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
