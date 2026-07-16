// ═══════════════════════════════════════════════════════════════
// B SENTHIL — Portfolio · shared site JS (command-deck theme)
// Theme: defaults to SYSTEM; manual Day/Night override persists.
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  // Resolve what 'system' means right now
  function systemTheme() { return (mq && mq.matches) ? 'night' : 'day'; }

  // Apply a stored preference: 'day' | 'night' | 'system' | null(=system)
  function applyTheme(pref) {
    var actual = (!pref || pref === 'system') ? systemTheme() : pref;
    root.setAttribute('data-theme', actual);
  }

  var saved = null;
  try { saved = localStorage.getItem('bs-theme'); } catch (e) {}
  applyTheme(saved);

  // If following system, live-update when the OS theme changes
  if (mq) {
    var onChange = function () {
      var s = null;
      try { s = localStorage.getItem('bs-theme'); } catch (e) {}
      if (!s || s === 'system') applyTheme('system');
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  // Manual override: toggle flips between explicit day/night
  var toggler = document.getElementById('themeToggler');
  if (toggler) {
    toggler.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme') === 'day' ? 'night' : 'day';
      root.setAttribute('data-theme', cur);
      try { localStorage.setItem('bs-theme', cur); } catch (e) {}
    });
    // Long-press / double-click resets to System
    toggler.addEventListener('dblclick', function () {
      try { localStorage.removeItem('bs-theme'); } catch (e) {}
      applyTheme('system');
    });
  }

  // ─── Mobile nav ───
  var burger = document.getElementById('deckHamburger');
  var nav = document.getElementById('verticalIndex');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('mobile-open'); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('mobile-open'); });
    });
  }

// ─── Hero image carousel (with dots) ───
  var layers = document.querySelectorAll('.stream-layer-asset');
  var dots = document.querySelectorAll('.carousel-dot');
  if (layers.length > 1) {
    var idx = 0, timer = null;
    function show(n) {
      layers[idx].classList.remove('layer-visible');
      if (dots[idx]) dots[idx].classList.remove('active');
      idx = (n + layers.length) % layers.length;
      layers[idx].classList.add('layer-visible');
      if (dots[idx]) dots[idx].classList.add('active');
    }
    // CHANGED: Interval timer set to 2000ms (2 seconds) for a relaxed, smooth transition cycle
    function start() { timer = setInterval(function () { show(idx + 1); }, 2000); }
    function reset() { if (timer) clearInterval(timer); start(); }
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { show(i); reset(); });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (timer) { clearInterval(timer); timer = null; } }
      else if (!timer) { start(); }
    });
    start();
  }

  // ─── Reveal on scroll ───
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // ─── Projects filter ───
  var fbtns = document.querySelectorAll('.filter-btn');
  var panels = document.querySelectorAll('.project-panel');
  var empty = document.getElementById('projectsEmpty');
  if (fbtns.length && panels.length) {
    fbtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filter;
        fbtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var vis = 0;
        panels.forEach(function (p) {
          var tags = (p.dataset.tags || '').split(' ');
          var show = f === 'all' || tags.indexOf(f) !== -1;
          p.classList.toggle('hidden', !show);
          if (show) vis++;
        });
        if (empty) empty.classList.toggle('show', vis === 0);
      });
    });
  }

  // ─── Contact form (Formspree + mailto fallback) ───
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var submitBtn = document.getElementById('submitBtn');
    var EMAIL = 'senthil.geospatial@gmail.com';
    function buildMailto(fd) {
      var g = function (k) { return (fd.get(k) || '').toString().trim(); };
      var subj = g('_subject') || 'Portfolio enquiry';
      var lines = [
        ('Name: ' + g('firstName') + ' ' + g('lastName')).trim(),
        'Email: ' + g('_replyto'),
        g('phone') ? 'Phone: ' + g('phone') : '',
        g('organisation') ? 'Organisation: ' + g('organisation') : '',
        '', '— Message —', g('message'),
        '', '— Sent from senthil.geospatial portfolio —'
      ].filter(Boolean).join('\n');
      return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(lines);
    }
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
        status.textContent = '> Opening mail client...';
        status.className = 'form-status show';
        window.location.href = buildMailto(fd);
        return;
      }
      submitBtn.disabled = true; submitBtn.style.opacity = '0.6';
      status.textContent = '> Transmitting...'; status.className = 'form-status show';
      try {
        var res = await fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        if (res.ok) {
          status.textContent = '> Signal locked. Reply within 24h.'; status.className = 'form-status show success'; form.reset();
        } else {
          status.textContent = '> Transmission failed. Opening mail client...'; status.className = 'form-status show error';
          setTimeout(function () { window.location.href = buildMailto(fd); }, 1200);
        }
      } catch (err) {
        status.textContent = '> Network error. Opening mail client...'; status.className = 'form-status show error';
        setTimeout(function () { window.location.href = buildMailto(fd); }, 1200);
      } finally { submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
    });
  }
})();
