(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = window.gsap, ST = window.ScrollTrigger;
  var motion = !!(G && ST) && !reduce;
  var WA = 'https://wa.me/77012465555';
  var ver = (d.currentScript && d.currentScript.src.split('?')[1]) || '';

  /* ---------- язык ---------- */
  var RU = {
    'wa.hero': 'Здравствуйте! Нужен расчёт алюминиевых / ПВХ конструкций. Объект: ',
    'wa.okna': 'Здравствуйте! Нужен расчёт: алюминиевые окна и двери. Серия (холодная / тёплая): . Размеры проёма: ',
    'wa.pereg': 'Здравствуйте! Нужен расчёт: алюминиевые офисные перегородки. Длина и высота: ',
    'wa.fasad': 'Здравствуйте! Нужен расчёт: алюминиевая фасадная система. Площадь остекления: ',
    'wa.pvh': 'Здравствуйте! Нужен расчёт: пластиковые окна / двери / витражи / перегородки. Размеры: ',
    'wa.portal': 'Здравствуйте! Нужен расчёт: алюминиевый PS-портал. Ширина и высота проёма: ',
    'wa.form': 'Здравствуйте! Заявка на расчёт с сайта. Имя: {n}. Телефон: {p}. Направление: {d}. Размеры / комментарий: {m}'
  };
  var lang = 'ru', cache = [], h1Split = null;
  function t(key) {
    var kk = window.SITE_KK;
    return (lang === 'kk' && kk && kk[key]) || RU[key] || '';
  }
  function setWa() {
    $$('a[data-wa]').forEach(function (a) {
      a.href = WA + '?text=' + encodeURIComponent(t(a.getAttribute('data-wa')));
    });
  }
  function collect() {
    if (cache.length) return;
    $$('[data-i18n]').forEach(function (el) { cache.push([el, 'html', el.getAttribute('data-i18n'), el.innerHTML]); });
    $$('[data-i18n-aria]').forEach(function (el) { cache.push([el, 'aria-label', el.getAttribute('data-i18n-aria'), el.getAttribute('aria-label')]); });
    $$('[data-i18n-alt]').forEach(function (el) { cache.push([el, 'alt', el.getAttribute('data-i18n-alt'), el.getAttribute('alt')]); });
  }
  function applyLang(l) {
    if (h1Split) { h1Split.revert(); h1Split = null; }
    collect();
    lang = l;
    var kk = window.SITE_KK || {};
    cache.forEach(function (c) {
      var v = (l === 'kk' && kk[c[2]]) || c[3];
      if (c[1] === 'html') c[0].innerHTML = v; else c[0].setAttribute(c[1], v);
    });
    root.lang = l;
    var md = $('meta[name="description"]');
    if (md) { if (!md._ru) md._ru = md.content; md.content = (l === 'kk' && kk['meta.desc']) || md._ru; }
    fitHero();
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === l)); });
    setWa();
    placePills();
    softRefresh();
  }
  function setLang(l, save) {
    if (save) { try { localStorage.setItem('lang', l); } catch (e) {} }
    if (l === 'kk' && !window.SITE_KK) {
      var s = d.createElement('script');
      s.src = 'assets/lang/kk.js' + (ver ? '?' + ver : '');
      s.onload = function () { applyLang('kk'); };
      d.head.appendChild(s);
    } else applyLang(l);
  }
  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* ---------- герой ровно в экран на телефоне и планшете ---------- */
  var hero = $('.hero'), htxt = $('.hero-txt'), probe = d.createElement('i');
  probe.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:100svh;visibility:hidden;pointer-events:none';
  probe.setAttribute('aria-hidden', 'true');
  d.body.appendChild(probe);
  function fitHero() {
    var w = window.innerWidth;
    if (w > 1100) { hero.style.removeProperty('--bh'); hero.classList.remove('is-tiny'); return; }
    var svh = probe.offsetHeight || window.innerHeight;
    var rb = parseFloat(getComputedStyle(hero).getPropertyValue('--rb')) || 74;
    var mob = w <= 760, gap = mob ? 22 : 28;
    var max = mob ? Math.min(svh * .42, w * .94) : Math.min(svh * .6 - rb, w * .7);
    var bh = Math.max(mob ? 110 : 180, Math.min(max, svh - (htxt.offsetTop + htxt.offsetHeight) - rb - gap));
    hero.style.setProperty('--bh', Math.floor(bh) - 1 + 'px');
    hero.classList.toggle('is-tiny', mob && bh < 190);
  }
  fitHero();
  /* текст героя меняет высоту при подгрузке шрифтов и смене языка - пересчитываем здание по факту */
  if ('ResizeObserver' in window) {
    var htxtH = 0;
    new ResizeObserver(function () {
      var h = htxt.offsetHeight; if (h === htxtH) return; htxtH = h;
      fitHero(); if (typeof softRefresh === 'function') softRefresh();
    }).observe(htxt);
  }

  /* ---------- сегментные переключатели ---------- */
  var segs = [];
  function placePills() { segs.forEach(function (f) { f(); }); }
  function initSeg(seg, onChange) {
    var btns = $$('button', seg), pill = $('.seg-pill', seg), panes = $$('.pane', seg.parentNode);
    function place() {
      var on = $('button[aria-selected="true"]', seg);
      pill.style.width = on.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + (on.offsetLeft - 4) + 'px)';
    }
    function set(mode, silent) {
      btns.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === mode)); });
      panes.forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-pane') === mode); });
      place();
      if (!silent) onChange(mode);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-mode')); }); });
    segs.push(place);
    place();
    return set;
  }

  /* ---------- узел профиля ---------- */
  var node = $('#node');
  function nodeMode(mode, instant) {
    node.setAttribute('data-mode', mode);
    if (!G) return;
    var w = mode === 'warm', dur = instant ? 0 : .8;
    G.to('.n-web', { opacity: w ? 0 : 1, duration: dur * .4 });
    G.to('.n-b1', { y: w ? 0 : -46, opacity: w ? 1 : 0, duration: dur, ease: 'power3.out' });
    G.to('.n-b2', { y: w ? 0 : 46, opacity: w ? 1 : 0, duration: dur, ease: 'power3.out' });
    G.to('.n-leak', { scaleX: w ? .372 : 1, svgOrigin: '120 325', duration: dur, ease: 'power2.inOut' });
    G.to('.n-fl', { scaleX: w ? .42 : 1, svgOrigin: '20 0', duration: dur, ease: 'power2.inOut' });
    G.to('.n-warmfield', { opacity: w ? 1 : .2, duration: dur });
    G.to('.n-warmtint', { opacity: w ? .5 : 0, duration: dur });
    G.to('.n-bl', { opacity: w ? 1 : .25, duration: dur * .5 });
  }
  var setNode = initSeg($('#nodeSeg'), function (m) { nodeMode(m); });
  nodeMode('cold', true);

  /* ---------- фасад ---------- */
  var fgrid = $('#fgrid');
  initSeg($('#fgSeg'), function (m) { fgrid.setAttribute('data-mode', m); });

  /* ---------- план: подсветка типов ---------- */
  var plan = $('#plan'), types = $$('#types li'), cyc = null, ci = 0;
  function hl(n) {
    if (n) plan.setAttribute('data-hl', n); else plan.removeAttribute('data-hl');
    types.forEach(function (li) { li.classList.toggle('is-on', li.getAttribute('data-pt') === String(n)); });
  }
  function cycle(on) {
    clearInterval(cyc);
    if (on && !reduce) cyc = setInterval(function () { ci = ci % 3 + 1; hl(ci); }, 2200);
  }
  types.forEach(function (li) {
    li.addEventListener('mouseenter', function () { cycle(false); hl(li.getAttribute('data-pt')); });
    li.addEventListener('mouseleave', function () { hl(0); cycle(true); });
  });

  /* ---------- подсветка зон здания ---------- */
  var bld = $('#bld');
  $$('[data-zone]').forEach(function (a) {
    var z = a.getAttribute('data-zone');
    function on() { bld.setAttribute('data-hl', z); }
    function off() { bld.removeAttribute('data-hl'); }
    a.addEventListener('mouseenter', on); a.addEventListener('focus', on);
    a.addEventListener('mouseleave', off); a.addEventListener('blur', off);
  });

  /* ---------- меню ---------- */
  var burger = $('#burger'), lenis = null;
  function menu(open) {
    d.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  }
  burger.addEventListener('click', function () { menu(!d.body.classList.contains('menu-open')); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });

  /* ---------- плавная прокрутка и якоря ---------- */
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: .11, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    G.ticker.add(function (time) { lenis.raf(time * 1000); });
    G.ticker.lagSmoothing(0);
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1), target = id === 'top' ? d.body : d.getElementById(id);
    if (!target) return;
    e.preventDefault();
    menu(false);
    var y = id === 'top' ? 0 : target.getBoundingClientRect().top + window.pageYOffset - 84;
    if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    history.replaceState(null, '', id === 'top' ? location.pathname + location.search : '#' + id);
  });

  /* ---------- FAQ ---------- */
  $$('#faqList details').forEach(function (det) {
    var sum = $('summary', det), body = $('.fa', det);
    sum.addEventListener('click', function (e) {
      if (!G || reduce) return;
      e.preventDefault();
      if (det.open) {
        G.to(body, { height: 0, duration: .35, ease: 'power2.inOut', onComplete: function () { det.open = false; body.style.height = ''; if (ST) ST.refresh(); } });
      } else {
        det.open = true;
        G.fromTo(body, { height: 0 }, { height: 'auto', duration: .45, ease: 'power2.out', onComplete: function () { if (ST) ST.refresh(); } });
      }
    });
  });

  /* ---------- форма ---------- */
  var form = $('#form'), opening = $('#opening'), dirSel = $('#dir');
  dirSel.addEventListener('change', function () { opening.setAttribute('data-op', dirSel.value); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = form.elements.name, p = form.elements.phone, ok = true;
    [n, p].forEach(function (el) { el.parentNode.classList.remove('is-bad'); el.removeAttribute('aria-invalid'); });
    if (!n.value.trim()) { n.parentNode.classList.add('is-bad'); n.setAttribute('aria-invalid', 'true'); ok = false; }
    if (p.value.replace(/\D/g, '').length < 10) { p.parentNode.classList.add('is-bad'); p.setAttribute('aria-invalid', 'true'); ok = false; }
    if (!ok) { (form.querySelector('.is-bad input') || n).focus(); return; }
    var txt = t('wa.form').replace('{n}', n.value.trim()).replace('{p}', p.value.trim())
      .replace('{d}', dirSel.options[dirSel.selectedIndex].text).replace('{m}', form.elements.msg.value.trim() || '-');
    $('#formOk').hidden = false;
    window.open(WA + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
  });

  /* ---------- линейка ---------- */
  var mark = $('.ruler i');
  function ruler() {
    var max = d.documentElement.scrollHeight - window.innerHeight;
    mark.style.transform = 'translateY(' + (max > 0 ? window.pageYOffset / max * (window.innerHeight - 2) : 0) + 'px)';
  }
  window.addEventListener('scroll', ruler, { passive: true });
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    ruler();
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth; placePills(); fitHero();
  });
  /* один отложенный пересчёт ScrollTrigger вместо нескольких подряд (шрифты, load) */
  var rT = 0;
  function softRefresh() { if (!ST) return; clearTimeout(rT); rT = setTimeout(function () { if (d.hidden) { pendR = true; return; } ST.refresh(); }, 150); }
  var pendR = false;
  d.addEventListener('visibilitychange', function () { if (!d.hidden && pendR) { pendR = false; softRefresh(); } });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { fitHero(); placePills(); softRefresh(); });
  ruler();

  /* ---------- пауза живой сцены вне экрана ---------- */
  var scene = $('#scene');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { scene.classList.toggle('is-paused', !en[0].isIntersecting); }).observe(scene);
  }

  setWa();

  /* =====================================================================
     ДВИЖЕНИЕ
     ===================================================================== */
  if (motion) {
    G.registerPlugin(ST);
    if (window.SplitText) G.registerPlugin(window.SplitText);
    G.defaults({ ease: 'power3.out', duration: .9 });
    var E = 'expo.out';
    var mob = window.matchMedia('(max-width:760px)').matches;
    /* на тач-экранах наезд идёт композитным слоем (без перерисовки SVG в каждом кадре), на мыши - чёткой перерисовкой */
    var touch = window.matchMedia('(hover: none)').matches;

    /* --- герой: проёмы заполняются конструкциями --- */
    var cam = $('#cam'), pl = $('.p-light'), sash = $('.p-sash');
    var drs = $$('.bld-svg .dr');
    G.set(drs, { strokeDasharray: 1, strokeDashoffset: 1 });
    var intro = G.timeline({ delay: .15, onComplete: function () { G.set(drs, { clearProps: 'strokeDasharray,strokeDashoffset' }); } });
    intro.from('.l-mnt', { yPercent: 14, opacity: 0, duration: 1.6, ease: E }, 0)
      .from('.l-city', { yPercent: 30, opacity: 0, duration: 1.4, ease: E }, .15)
      .from('.sun', { scale: .4, opacity: 0, duration: 1.4, ease: E }, .3)
      .from('.cloud', { opacity: 0, duration: 1.6, stagger: .2 }, .4);
    var at = .25;
    $$('.bld-svg g[data-z]').forEach(function (g) {
      var dr = $$('.dr', g), gl = $$('.gl', g);
      intro.to(dr, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: { amount: .5 } }, at)
        .from(gl, { opacity: 0, duration: .8, stagger: { amount: .5 }, clearProps: 'opacity' }, at + .45);
      at += .22;
    });
    intro.from('.pdoor', { scaleX: .12, duration: 1.1, ease: 'power3.inOut', stagger: .12 }, 1.3)
      .from('.p-sash svg', { opacity: 0, x: 14, duration: .8 }, 1.5)
      .from('.ov.tree', { scale: 0, duration: 1, ease: E, stagger: .12 }, .9)
      .from('.co-lines line', { strokeDasharray: 1, strokeDashoffset: 1, duration: .7, stagger: .1, ease: 'power2.inOut' }, 1.7)
      .from('.co-lines circle', { scale: 0, transformOrigin: 'center', duration: .5, stagger: .1 }, 1.7)
      .from('.co span', { opacity: 0, y: 8, duration: .6, stagger: .1 }, 1.95)
      .from('.chain a', { y: 26, opacity: 0, duration: .8, stagger: .06, clearProps: 'all' }, 1.2);

    /* --- герой: текст --- */
    var h1 = $('#h1');
    G.from('.hero .kick', { y: 18, opacity: 0, duration: .8, delay: .1 });
    /* LCP: текст героя виден с первого кадра - на телефоне только сдвиг, без маски и прозрачности */
    if (mob) G.from(h1, { y: 22, duration: 1, ease: E, delay: .1 });
    else if (window.SplitText && window.SplitText.create) {
      h1Split = window.SplitText.create(h1, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: function (self) { return G.from(self.lines, { yPercent: 108, duration: 1.1, ease: E, stagger: .08, delay: .15 }); }
      });
    } else G.from(h1, { y: 30, opacity: 0, duration: 1 });
    G.from('.hero .lead', { y: 22, duration: .9, delay: .3 });
    G.from('.hero-btns .btn', { y: 22, opacity: 0, duration: .8, delay: .7, stagger: .08, clearProps: 'all' });
    G.from('.hdr', { yPercent: -120, duration: 1, ease: E, delay: .1, clearProps: 'transform' });

    /* --- герой: наезд на террасу, створка PS-портала уходит вбок --- */
    var S = 3, K = 20, dx = 0, dy = 0, gy = 0, ox = 0, oy = 0;
    /* замер зовётся из первой функции таймлайна: GSAP пересчитывает её после каждого refresh, когда раскладка уже новая */
    function measure() {
      ox = bld.offsetLeft + pl.offsetLeft + pl.offsetWidth / 2;
      oy = bld.offsetTop + pl.offsetTop + pl.offsetHeight * .6;
      var vw = window.innerWidth, vh = window.innerHeight;
      S = Math.min(6.5, Math.max(2.2, Math.max(vw * .15, 120) / pl.offsetWidth));
      K = 2.5 * Math.sqrt(vw * vw + vh * vh) / (pl.offsetWidth * S);
      var r = cam.getBoundingClientRect();
      dx = (vw * .5 - ox) * .7;
      dy = (Math.min(vh, r.height) * .56 - oy) * .7;
      gy = pl.offsetHeight * .43;
    }
    measure();
    var zoom = G.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.hero', start: 'bottom bottom', end: function () { return '+=' + Math.max(window.innerHeight, 480) * (mob ? .9 : 1.5); },
        pin: true, scrub: .6, invalidateOnRefresh: true,
        onToggle: function (self) { scene.classList.toggle('is-zoom', self.isActive); }
      }
    });
    zoom.set(cam, { transformOrigin: function () { measure(); return ox + 'px ' + oy + 'px'; } }, 0)
      .to('.hero-txt', { y: -70, autoAlpha: 0, duration: .2, ease: 'power1.in' }, 0)
      .to('.chain', { autoAlpha: 0, y: 30, duration: .14 }, 0)
      .to('.co,.co-lines', { autoAlpha: 0, duration: .12 }, .02)
      .to(cam, { scale: function () { return S; }, x: function () { return dx; }, y: function () { return dy; }, duration: .56, ease: 'power2.inOut', force3D: touch }, 0)
      .to('.l-mnt', { scale: 1.25, y: function () { return dy + gy * (S - 1); }, duration: .56, ease: 'power2.inOut' }, 0)
      .to('.l-city', { scale: 1.7, y: function () { return dy + gy * (S - 1); }, duration: .56, ease: 'power2.inOut' }, 0)
      .to('.haze', { autoAlpha: 0, duration: .3 }, .1)
      .to(sash, { scale: 1.07, '--sh': 1, duration: .09, ease: 'power2.out' }, .5)
      .to(sash, { xPercent: 94, duration: .2, ease: 'power2.inOut' }, .6)
      .to(pl, { scale: function () { return K; }, backgroundColor: '#F3F5F6', duration: .25, ease: 'power2.in' }, .75)
      .to(sash, { autoAlpha: 0, duration: .08 }, .8)
      .to(cam, { scale: function () { return S * 1.2; }, duration: .25, force3D: touch }, .75)
      .to('.l-mnt,.l-city', { y: function () { return dy + gy * (S * 1.2 - 1); }, duration: .25 }, .75)
      .fromTo('.p-reveal', { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: .2, ease: 'power2.out' }, .8);

    /* Секции ниже первого экрана настраиваются кусками в свободное время - не держим главный поток одним длинным заданием */
    var tasks = [];
    /* --- головы секций --- */
    tasks.push(function () {
      $$('.sh').forEach(function (sh) {
        var tl = G.timeline({ scrollTrigger: { trigger: sh, start: 'top 80%', once: true } });
        tl.from($('.kick', sh), { x: -24, opacity: 0, duration: .7 })
          .from($('h2', sh), { y: 36, opacity: 0, duration: 1, ease: E }, .08)
          .from($('.dim', sh), { scaleX: 0, duration: 1.1, ease: 'power3.inOut' }, .2);
        if ($('.lead', sh)) tl.from($('.lead', sh), { y: 20, opacity: 0, duration: .8 }, .35);
      });
      $$('.duo-t').forEach(function (el) {
        var kids = $$(':scope > :not(.sh)', el);
        if (kids.length) G.from(kids, { y: 26, opacity: 0, duration: .8, stagger: .09, clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 78%', once: true }, onComplete: placePills });
      });
    });

    /* --- сигнатура: параллельный сдвиг створки открывает фото --- */
    tasks.push(function () {
      $$('.shot').forEach(function (f, i) {
        var s = $('.shot-sash', f), img = $('img', f), rail = $('.rail', f), cap = $('figcaption span', f);
        var dir = f.getAttribute('data-dir') === 'l' ? -1 : 1;
        G.set(rail, { scaleX: 0 });
        G.set(img, { scale: 1.14 });
        G.timeline({ scrollTrigger: { trigger: f, start: 'top 74%', once: true }, delay: (i % 2) * .12 })
          .to(s, { scale: 1.04, duration: .38, ease: 'power2.out' })
          .to(s, { xPercent: 106 * dir, duration: 1.15, ease: 'power3.inOut' }, '>-.02')
          .to(img, { scale: 1, duration: 1.6, ease: E }, '<')
          .to(rail, { scaleX: 1, duration: 1.15, ease: 'power3.inOut' }, '<')
          .from(cap, { opacity: 0, x: -10 * dir, duration: .6 }, '>-.5')
          .set(s, { display: 'none' });
      });
    });

    /* --- узел: в профиль входит терморазрыв --- */
    tasks.push(function () {
      ST.create({ trigger: node, start: 'top 62%', once: true, onEnter: function () { G.delayedCall(.7, function () { setNode('warm'); }); } });
      G.from(node, { y: 40, opacity: 0, duration: 1, ease: E, scrollTrigger: { trigger: node, start: 'top 82%', once: true } });
    });

    /* --- план: перегородки встают по линиям --- */
    tasks.push(function () {
      var pts = $$('.pt', plan);
      G.set(pts, { strokeDasharray: 1, strokeDashoffset: 1 });
      G.timeline({ scrollTrigger: { trigger: plan, start: 'top 70%', once: true }, onComplete: function () { cycle(true); } })
        .from(plan, { y: 40, opacity: 0, duration: .9, ease: E })
        .from('.pl-f > *', { opacity: 0, duration: .5, stagger: { amount: .6 } }, .2)
        .to(pts, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: { amount: 1.1 } }, .45)
        .from('.pt-j', { opacity: 0, duration: .4, stagger: { amount: .5 } }, 1.4)
        .from('.pl-d', { opacity: 0, rotation: -50, transformOrigin: 'left top', duration: .7, stagger: .08 }, 1.3);
      ST.create({ trigger: plan, start: 'top bottom', end: 'bottom top', onLeave: function () { cycle(false); }, onLeaveBack: function () { cycle(false); }, onEnterBack: function () { cycle(true); } });
    });

    /* --- фасад: крышки защёлкиваются --- */
    tasks.push(function () {
      fgrid.setAttribute('data-mode', 'str');
      ST.create({ trigger: fgrid, start: 'top 65%', once: true, onEnter: function () { fgrid.setAttribute('data-mode', 'cap'); } });
      G.from(fgrid, { y: 40, opacity: 0, duration: 1, ease: E, scrollTrigger: { trigger: fgrid, start: 'top 85%', once: true } });
    });

    /* --- ПВХ: створки приоткрываются --- */
    tasks.push(function () {
      $$('#pv li').forEach(function (li, i) {
        G.from(li, { y: 24, opacity: 0, duration: .8, delay: i * .1, scrollTrigger: { trigger: '#pv', start: 'top 78%', once: true } });
        ST.create({ trigger: li, start: 'top 60%', once: true, onEnter: function () { li.classList.add('is-in'); setTimeout(function () { li.classList.remove('is-in'); }, 1500 + i * 200); } });
      });
    });

    /* --- PS-портал: ручка, выход из плоскости, сдвиг --- */
    tasks.push(function () {
      var stage = $('.ps-stage');
      G.set('.ps-arc', { strokeDashoffset: 1 });
      G.set('.ps-parrow', { opacity: 0 });
      G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: stage, start: 'top 62%', end: 'top 4%', scrub: .7 } })
        .to('.ps-arc', { strokeDashoffset: 0, duration: .18 }, 0)
        .to('.ps-handle', { rotation: -90, svgOrigin: '384 220', duration: .18, ease: 'power1.inOut' }, 0)
        .to('.ps-leaf', { scale: 1.035, transformOrigin: 'center', duration: .14, ease: 'power2.out' }, .2)
        .to('.ps-shadow', { opacity: .22, x: -8, y: 10, duration: .14 }, .2)
        .to('.ps-pleaf', { y: 17, duration: .14, ease: 'power2.out' }, .2)
        .to('.ps-parrow', { opacity: 1, duration: .08 }, .3)
        .to('.ps-sash', { x: -262, duration: .6, ease: 'power2.inOut' }, .38)
        .to('.ps-pleaf', { x: -262, duration: .6, ease: 'power2.inOut' }, .38)
        .to('.ps-arc', { opacity: 0, duration: .1 }, .38);
      G.from(stage, { y: 40, opacity: 0, duration: 1, ease: E, scrollTrigger: { trigger: stage, start: 'top 85%', once: true } });
      G.from('.ps-labels li', { opacity: 0, y: 12, duration: .6, stagger: .1, scrollTrigger: { trigger: stage, start: 'top 55%', once: true } });
    });

    /* --- этапы --- */
    tasks.push(function () {
      var steps = $$('#steps li'), line = $('.steps-line b'), vertical = window.matchMedia('(max-width:620px)').matches;
      G.from(steps, { y: 34, opacity: 0, duration: .8, stagger: .08, scrollTrigger: { trigger: '#steps', start: 'top 80%', once: true } });
      var lt = {}; lt[vertical ? 'scaleY' : 'scaleX'] = 1; lt.ease = 'none';
      lt.scrollTrigger = {
        trigger: '#steps', start: 'top 72%', end: vertical ? 'bottom 60%' : 'top 22%', scrub: .5,
        onUpdate: function (self) { steps.forEach(function (li, i) { li.classList.toggle('is-on', self.progress >= (i + .15) / steps.length); }); }
      };
      G.to(line, lt);
    });

    /* --- штамп, FAQ, форма, контакты --- */
    tasks.push(function () {
      G.from('#stamp > *', { opacity: 0, y: 24, duration: .8, stagger: .09, scrollTrigger: { trigger: '#stamp', start: 'top 78%', once: true } });
      G.from('#faqList details', { opacity: 0, y: 22, duration: .7, stagger: .07, scrollTrigger: { trigger: '#faqList', start: 'top 80%', once: true } });
      G.from('#form > *', { opacity: 0, y: 22, duration: .7, stagger: .07, clearProps: 'transform', scrollTrigger: { trigger: '#form', start: 'top 80%', once: true } });
      G.from('#opening', { opacity: 0, scale: .94, duration: 1.1, ease: E, scrollTrigger: { trigger: '#opening', start: 'top 80%', once: true } });
      G.from('#siteplan', { opacity: 0, y: 40, duration: 1, ease: E, scrollTrigger: { trigger: '#siteplan', start: 'top 82%', once: true } });
      G.from('.sp-pin b', { y: -40, opacity: 0, duration: .9, ease: 'bounce.out', scrollTrigger: { trigger: '#siteplan', start: 'top 60%', once: true } });
    });

    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 16); };
    function run() {
      var t = tasks.shift(); if (!t) { softRefresh(); return; }
      t();
      idle(run, { timeout: 300 });
    }
    idle(run, { timeout: 300 });

    window.addEventListener('load', softRefresh);
  } else {
    setNode('warm');
  }

  /* ---------- стартовый язык: ?lang= главнее сохранённого ---------- */
  var q = /[?&]lang=(ru|kk)/.exec(location.search), saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  var start = q ? q[1] : saved;
  if (start === 'kk') setLang('kk', false);
})();
