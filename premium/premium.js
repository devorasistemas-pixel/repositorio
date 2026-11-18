(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  $('#year').textContent = new Date().getFullYear();

  // Nav link hover (duplicated text slide)
  $$('.nav-links a').forEach(a => {
    a.dataset.text = a.textContent;
    a.innerHTML = `<span>${a.textContent}</span>`;
  });

  // Split helpers
  const splitWords = el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
    return $$('.w > span', el);
  };
  const scrubWords = el => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="sw">${w}</span>`).join(' ');
    return $$('.sw', el);
  };

  // ---------- Fallback without GSAP or with reduced motion ----------
  if (!hasGSAP || reduce) {
    $('#loader')?.remove();
    $$('[data-scrub]').forEach(scrubWords);
    $$('.sw').forEach(w => (w.style.opacity = 1));
    $$('[data-count]').forEach(el => {
      const d = +(el.dataset.decimals || 0);
      el.textContent = (+el.dataset.count).toFixed(d).replace('.', ',');
    });
    const line = $('#steps-line'); if (line) line.style.strokeDashoffset = 0;
    $$('[data-step]').forEach(s => s.classList.add('is-on'));
    setupUI(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // ---------- Smooth scroll ----------
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  document.body.style.overflow = 'hidden';

  setupUI(lenis);

  // ---------- Initial states ----------
  const heroLines = $$('.hero-title .line > span');
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set('[data-hero]', { y: 30, autoAlpha: 0 });
  gsap.set('#hero-frame', { clipPath: 'inset(100% 0% 0% 0% round 28px)' });
  gsap.set('#hero-frame img', { scale: 1.3 });
  gsap.set('.chip', { autoAlpha: 0, y: 30, scale: .9 });
  gsap.set('#nav', { yPercent: -100, autoAlpha: 0 });

  // ---------- Loader ----------
  const num = $('#loader-num');
  const counter = { v: 0 };
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .to('.loader-logo path', { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: .15 }, 0)
    .to('.loader-name', { opacity: 1, duration: .8 }, .4)
    .to(counter, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => (num.textContent = Math.round(counter.v)) }, 0)
    .to('#loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 1.75)
    .add(() => { $('#loader').remove(); document.body.style.overflow = ''; lenis?.start(); }, 2.7)
    .to('#nav', { yPercent: 0, autoAlpha: 1, duration: 1 }, 2.3)
    .to(heroLines, { yPercent: 0, duration: 1.3, stagger: .1 }, 2.2)
    .to('#hero-frame', { clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.5, ease: 'expo.inOut' }, 2.0)
    .to('#hero-frame img', { scale: 1, duration: 2, ease: 'expo.out' }, 2.3)
    .to('[data-hero]', { y: 0, autoAlpha: 1, duration: 1.1, stagger: .1 }, 2.6)
    .to('.chip', { autoAlpha: 1, y: 0, scale: 1, duration: 1, stagger: .12, ease: 'back.out(1.6)' }, 3.0);

  // ---------- Progress bar ----------
  gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  // ---------- Hero parallax ----------
  gsap.to('#hero-frame img', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-blob', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  $$('[data-float]').forEach(el => {
    gsap.to(el, { y: () => -60 * +el.dataset.float, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------- Split titles ----------
  $$('[data-split]').forEach(el => {
    const words = splitWords(el);
    gsap.from(words, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .045, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  // ---------- Fade-up ----------
  $$('[data-up]').forEach(el => {
    gsap.from(el, { y: 40, autoAlpha: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // ---------- Image reveal + parallax ----------
  $$('[data-reveal-img]').forEach(el => {
    gsap.fromTo(el, { clipPath: 'inset(15% 15% 15% 15% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 35%', scrub: true } });
  });
  $$('[data-parallax]').forEach(img => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---------- Scrubbed text ----------
  $$('[data-scrub]').forEach(el => {
    const words = scrubWords(el);
    gsap.to(words, { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  // ---------- Counters ----------
  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count, d = +(el.dataset.decimals || 0), o = { v: 0 };
    gsap.to(o, {
      v: target, duration: 2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => (el.textContent = o.v.toFixed(d).replace('.', ','))
    });
  });

  // ---------- Marquee (velocity reactive) ----------
  const track = $('#marquee');
  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    onUpdate: self => {
      const v = self.getVelocity();
      const dir = self.direction;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 400, 5)), duration: .2, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1, delay: .2 });
    }
  });

  // ---------- Horizontal specialties ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 641px)', () => {
    const trackEl = $('#spec-track');
    const dist = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);
    const tween = gsap.to(trackEl, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.spec', start: 'top top', end: () => '+=' + dist(), pin: '.spec-pin', scrub: 1, invalidateOnRefresh: true,
        onUpdate: s => gsap.set('#spec-bar', { scaleX: s.progress })
      }
    });
    $$('.scard').forEach(card => {
      gsap.from(card, { y: 80, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 95%' } });
    });
    return () => gsap.set('#spec-bar', { scaleX: 0 });
  });
  mm.add('(max-width: 640px)', () => {
    $$('.scard').forEach(card => gsap.from(card, { y: 50, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 90%' } }));
    gsap.to('#spec-bar', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#spec-track', start: 'top 80%', end: 'bottom 60%', scrub: true } });
  });

  // ---------- Journey line + steps ----------
  gsap.to('#steps-line', { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 65%', end: 'bottom 65%', scrub: true } });
  $$('[data-step]').forEach(step => {
    ScrollTrigger.create({ trigger: step, start: 'top 65%', onEnter: () => step.classList.add('is-on'), onLeaveBack: () => step.classList.remove('is-on') });
    gsap.from(step.querySelector('div'), { x: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: step, start: 'top 80%' } });
  });

  // ---------- CTA glow follows mouse ----------
  const cta = $('.cta'), glow = $('#cta-glow');
  if (finePointer) {
    const gx = gsap.quickTo(glow, 'x', { duration: 1.2, ease: 'power3' });
    const gy = gsap.quickTo(glow, 'y', { duration: 1.2, ease: 'power3' });
    cta.addEventListener('mousemove', e => {
      const r = cta.getBoundingClientRect();
      gx(e.clientX - r.left - r.width / 2);
      gy(e.clientY - r.top - r.height / 2);
    });
  }
  gsap.from('.cta-btn', { scale: 0, rotate: -90, duration: 1.4, ease: 'elastic.out(1, .6)', scrollTrigger: { trigger: '.cta-btn', start: 'top 90%' } });

  window.addEventListener('load', () => ScrollTrigger.refresh());

  // ======================================================
  function setupUI(lenis) {
    // Anchor links
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id === '#inicio' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: id === '#inicio' ? 0 : -70, duration: 1.6 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }));

    // Burger menu
    const burger = $('#burger'), menu = $('#menu');
    function closeMenu() {
      menu.classList.remove('is-open'); document.body.classList.remove('menu-open'); menu.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menu');
      lenis?.start();
    }
    burger.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      if (!open) return closeMenu();
      menu.classList.add('is-open'); document.body.classList.add('menu-open'); menu.setAttribute('aria-hidden', 'false');
      burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Fechar menu');
      lenis?.stop();
    });
    document.addEventListener('keydown', e => e.key === 'Escape' && closeMenu());

    // Nav: solid + hide on scroll down
    const nav = $('#nav');
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-solid', y > 40);
      nav.classList.toggle('is-hidden', y > last && y > 400 && !menu.classList.contains('is-open'));
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Active link
    const links = $$('.nav-links a');
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => io.observe(s));

    // Tabs
    const tabs = $$('.tab'), ind = $('#tab-ind');
    const moveInd = t => { if (ind) { ind.style.transform = `translateY(${t.offsetTop}px)`; ind.style.height = t.offsetHeight + 'px'; } };
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => { x.classList.toggle('is-on', x === t); x.setAttribute('aria-selected', x === t); });
      moveInd(t);
      $$('.tpanel').forEach(p => {
        const on = p.id === t.dataset.t;
        p.hidden = !on; p.classList.toggle('is-on', on);
        if (on && window.gsap && !reduce) gsap.fromTo(p.children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, ease: 'expo.out', stagger: .05 });
      });
      if (window.innerWidth <= 1024) t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      window.ScrollTrigger?.refresh();
    }));
    const placeInd = () => moveInd($('.tab.is-on'));
    placeInd();
    window.addEventListener('resize', placeInd);
    document.fonts?.ready.then(placeInd);

    if (!finePointer || reduce || !window.gsap) return;

    // Custom cursor
    const cursor = $('#cursor');
    const cx = gsap.quickTo(cursor, 'x', { duration: .25, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .25, ease: 'power3' });
    window.addEventListener('mousemove', e => { cx(e.clientX); cy(e.clientY); });
    $$('a, button, [data-tilt], .tpanel li').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });

    // Magnetic elements
    $$('[data-magnetic]').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3);
        my((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener('mouseleave', () => { mx(0); my(0); });
    });

    // 3D tilt + spotlight
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
        gsap.to(card, { rotateY: (px - .5) * 12, rotateX: (.5 - py) * 12, transformPerspective: 900, duration: .5, ease: 'power3' });
      });
      card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1, .5)' }));
    });

    // Hero image follows mouse slightly
    const hero = $('.hero'), visual = $('.hero-visual');
    const hx = gsap.quickTo(visual, 'x', { duration: 1, ease: 'power3' });
    const hy = gsap.quickTo(visual, 'y', { duration: 1, ease: 'power3' });
    hero.addEventListener('mousemove', e => {
      hx((e.clientX / innerWidth - .5) * 24);
      hy((e.clientY / innerHeight - .5) * 24);
    });
  }
})();
