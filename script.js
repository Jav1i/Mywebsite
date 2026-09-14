/* Philip Jensen — progressive enhancement only.
   The page is fully usable without this file: content is plain HTML,
   the city buildings are ordinary anchor links, and CSS handles motion.
   This script adds: theme toggle, mobile nav, scroll reveal, active nav
   highlighting, a header shadow on scroll, and centres the city on phones. */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // matchMedia change listener with a fallback for older Safari.
  function onMediaChange(mq, fn) {
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', fn);
    else if (typeof mq.addListener === 'function') mq.addListener(fn);
  }

  /* ---------------- Theme toggle ---------------- */
  (function initTheme() {
    var btn = $('.theme-toggle');
    if (!btn) return;
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

    function current() {
      var explicit = root.getAttribute('data-theme');
      if (explicit === 'dark' || explicit === 'light') return explicit;
      return systemDark.matches ? 'dark' : 'light';
    }

    function syncLabel() {
      var next = current() === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
    }

    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage may be unavailable */ }
      syncLabel();
    });

    onMediaChange(systemDark, syncLabel);
    syncLabel();
  })();

  /* ---------------- Mobile navigation ---------------- */
  (function initNav() {
    var toggle = $('.nav-toggle');
    var menu = $('#nav-menu');
    if (!toggle || !menu) return;
    var mq = window.matchMedia('(max-width: 719px)');

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('is-open', open);
    }
    function isOpen() { return toggle.getAttribute('aria-expanded') === 'true'; }

    toggle.addEventListener('click', function () { setOpen(!isOpen()); });

    // Close after choosing a destination.
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Escape closes and returns focus to the button.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Click outside closes.
    document.addEventListener('click', function (e) {
      if (isOpen() && !e.target.closest('.site-nav')) setOpen(false);
    });

    // Reset when the layout switches back to desktop.
    onMediaChange(mq, function (e) { if (!e.matches) setOpen(false); });
  })();

  /* ---------------- Header shadow on scroll ---------------- */
  (function initHeader() {
    var header = $('.site-header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------------- Scroll reveal ---------------- */
  (function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------- Active section in the nav ---------------- */
  (function initActiveNav() {
    var links = $$('.nav-menu a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var sec = document.getElementById(id);
      if (sec) { byId[id] = a; sections.push(sec); }
    });
    if (!sections.length) return;

    var visible = {};
    function setActive(id) {
      links.forEach(function (a) {
        if (byId[id] === a) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.intersectionRatio; });
      var best = null;
      sections.forEach(function (sec) {
        if (visible[sec.id] > 0 && (best === null || visible[sec.id] > visible[best])) best = sec.id;
      });
      if (best) setActive(best);
      else if (window.scrollY < 200) setActive(null);
    }, { rootMargin: '-40% 0px -45% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach(function (sec) { io.observe(sec); });
  })();

  /* ---------------- City: centre it when it overflows on phones ---------------- */
  (function initCity() {
    var wrap = $('.city-wrap');
    if (!wrap) return;
    function centre() {
      var overflow = wrap.scrollWidth - wrap.clientWidth;
      if (overflow > 0) wrap.scrollLeft = overflow / 2;
    }
    centre();
    window.addEventListener('resize', centre, { passive: true });
  })();

  /* ---------------- Footer year ---------------- */
  (function initYear() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();
})();
