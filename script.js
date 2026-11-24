(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  if (hasGSAP && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);

  const navbar = $('#navbar'), burger = $('#burger'), menu = $('#menu');
  let menuOpen = false;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    window.lenis = lenis;
    if (hasGSAP && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const goTo = target => (lenis ? lenis.scrollTo(target) : target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- Navbar: hide on down, show on up, blur after scroll ---------- */
  let lastY = scrollY, scrollVel = 0;
  addEventListener('scroll', () => {
    const y = scrollY, dy = y - lastY;
    scrollVel = dy;
    navbar.classList.toggle('navbar--scrolled', y > 60);
    if (!menuOpen) {
      if (dy > 4 && y > 200) navbar.classList.add('navbar--hidden');
      else if (dy < -4 || y <= 200) navbar.classList.remove('navbar--hidden');
    }
    lastY = y;
  }, { passive: true });

  /* ---------- Fullscreen menu ---------- */
  const links = $$('.menu__link span');
  const foot = $('.menu__foot');
  let menuTl = null;
  if (hasGSAP && !reduce) {
    gsap.set(links, { yPercent: 115 });
    menuTl = gsap.timeline({
      paused: true, defaults: { ease: 'expo.inOut' },
      onReverseComplete: () => { menu.style.visibility = 'hidden'; }
    })
      .set(menu, { visibility: 'visible' })
      .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.9 })
      .to(links, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, 0.35)
      .fromTo(foot, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.8);
  }
  const setMenu = open => {
    menuOpen = open;
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('menu-open', open);
    navbar.classList.toggle('navbar--menu', open);
    if (open) navbar.classList.remove('navbar--hidden');
    if (lenis) open ? lenis.stop() : lenis.start();
    if (menuTl) open ? menuTl.play() : menuTl.reverse();
    else { menu.style.visibility = open ? 'visible' : 'hidden'; menu.style.clipPath = open ? 'inset(0)' : ''; }
    if (open) $('.menu__link').focus({ preventScroll: true });
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });

  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!/^#[A-Za-z][\w-]*$/.test(href)) return; // "#" aur "#/route" links browser/router sambhalega
    if (window.vastraView && window.vastraView() !== 'home') { if (menuOpen) setMenu(false); return; }
    const t = $(href);
    if (!t) return;
    e.preventDefault();
    if (menuOpen) { setMenu(false); setTimeout(() => goTo(t), 450); } else goTo(t);
  }));

  /* ---------- Cart badge bounce ---------- */


  /* ---------- Hero ---------- */
  // Split each headline line into words, each inside its own mask
  $$('#heroTitle .line').forEach(line => {
    line.innerHTML = line.textContent.trim().split(/\s+/)
      .map(w => `<span class="word"><span class="word__in" aria-hidden="true">${w}</span></span>`).join(' ');
  });
  const words = $$('.word__in');

  if (hasGSAP && !reduce) {
    gsap.set(words, { yPercent: 115 });
    gsap.set([$('.hero__sub'), $('#cta')], { opacity: 0, y: 24 });
    gsap.set($('#badge'), { scale: 0, rotate: -40 });
    gsap.set(navbar, { yPercent: -100 });
    gsap.set('.scroll-cue', { opacity: 0 });

    gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.2 })
      .fromTo('#heroBg', { scale: 1.25 }, { scale: 1, duration: 2.2, ease: 'power3.out' }, 0)
      .to(words, { yPercent: 0, duration: 1.3, stagger: 0.1 }, 0.3)
      .to('.hero__sub', { opacity: 1, y: 0, duration: 1 }, 0.9)
      .to('#cta', { opacity: 1, y: 0, duration: 1 }, 1.05)
      .to('#badge', { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.6)' }, 1.0)
      .to(navbar, { yPercent: 0, duration: 1 }, 0.8)
      .to('.scroll-cue', { opacity: 1, duration: 1 }, 1.4)
      .add(() => gsap.to('#badge', { y: -14, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

    // Scroll parallax on the background
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.to('#heroParallax', {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    if (!touch) {
      // Mouse parallax
      const px = gsap.quickTo('#heroParallax', 'x', { duration: 1.4, ease: 'power3.out' });
      const py = gsap.quickTo('#heroParallax', 'y', { duration: 1.4, ease: 'power3.out' });
      $('#hero').addEventListener('pointermove', e => {
        px((e.clientX / innerWidth - 0.5) * -36);
        py((e.clientY / innerHeight - 0.5) * -24);
      });

      // Magnetic CTA
      const cta = $('#cta'), label = $('.btn__label', cta);
      const cx = gsap.quickTo(cta, 'x', { duration: 0.6, ease: 'power3.out' });
      const cy = gsap.quickTo(cta, 'y', { duration: 0.6, ease: 'power3.out' });
      const lx = gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3.out' });
      const ly = gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3.out' });
      cta.addEventListener('pointermove', e => {
        const r = cta.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        cx(dx * 0.35); cy(dy * 0.5); lx(dx * 0.15); ly(dy * 0.2);
      });
      cta.addEventListener('pointerleave', () => { cx(0); cy(0); lx(0); ly(0); });
    }
  }

  /* ---------- Marquee: velocity-driven speed + direction ---------- */
  const track = $('#marqueeTrack');
  const group = $('.marquee__group', track);
  const fill = () => {
    $$('.marquee__group', track).slice(1).forEach(g => g.remove());
    const w = group.getBoundingClientRect().width;
    const copies = Math.ceil((innerWidth * 2) / w) + 1;
    for (let i = 0; i < copies; i++) { const c = group.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); }
    return w;
  };
  let groupW = fill(), x = 0, dir = 1, vel = 0;
  addEventListener('resize', () => { groupW = fill(); });
  document.fonts && document.fonts.ready.then(() => { groupW = fill(); });

  if (!reduce) {
    const base = 0.8; // px per frame at rest
    const tick = () => {
      vel += (scrollVel - vel) * 0.1;           // smooth the scroll speed
      scrollVel *= 0.9;                          // decay when scrolling stops
      if (Math.abs(vel) > 0.6) dir = vel > 0 ? 1 : -1; // scroll down: left, scroll up: reverse
      x -= dir * (base + Math.min(Math.abs(vel) * 0.9, 24));
      if (x <= -groupW) x += groupW;
      if (x > 0) x -= groupW;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
/* ===== PART 3: Collections + Featured ===== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Collections: pinned horizontal scroll (desktop), stacked (mobile) ---------- */
  const pin = $('#colPin'), track = $('#colTrack');
  const reveal = (card, st) => {
    const trigger = { trigger: card, once: true, ...st };
    gsap.fromTo(card, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: trigger });
    gsap.fromTo($('.col-card__img', card), { scale: 1.35 }, { scale: 1, duration: 1.6, ease: 'expo.out', scrollTrigger: trigger });
  };
  if (hasGSAP && !reduce && pin && track) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      const g = () => parseFloat(getComputedStyle(pin).paddingLeft);
      const dist = () => track.scrollWidth + 2 * g() - pin.clientWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true }
      });
      $$('.col-card').forEach(c => reveal(c, { containerAnimation: tween, start: 'left 92%' }));
    });
    mm.add('(max-width: 1023px)', () => {
      $$('.col-card').forEach(c => reveal(c, { start: 'top 85%' }));
    });
  }

  /* ---------- Featured products ---------- */
  const u = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;
  const PRODUCTS = [
    {
      id: 'linen-overshirt',
      name: 'Linen overshirt',
      cat: 'Outerwear',
      price: 3490,
      a: 'photo-1551028719-00167b16eac5',
      b: 'photo-1591047139829-d91aecb6caea'
    },
    {
      id: 'everyday-tee',
      name: 'Everyday tee',
      cat: 'Tops',
      price: 1290,
      a: 'photo-1576566588028-4147f3842f27',
      b: 'photo-1583743814966-8936f5b7be1a'
    },
    {
      id: 'pleated-trousers',
      name: 'Pleated trousers',
      cat: 'Bottoms',
      price: 2890,
      a: 'photo-1542272604-787c3835535d',
      b: 'photo-1434389677669-e08b4cac3105'
    },
    {
      id: 'quilted-jacket',
      name: 'Quilted jacket',
      cat: 'Outerwear',
      price: 5990,
      a: 'photo-1591047139829-d91aecb6caea',
      b: 'photo-1551028719-00167b16eac5'
    },
    {
      id: 'rib-knit-top',
      name: 'Rib knit top',
      cat: 'Tops',
      price: 1890,
      a: 'photo-1515886657613-9f3515b0c78f',
      b: 'photo-1469334031218-e382a71b716b'
    },
    {
      id: 'wide-leg-denim',
      name: 'Wide leg denim',
      cat: 'Bottoms',
      price: 3290,
      a: 'photo-1542272604-787c3835535d',
      b: 'photo-1445205170230-053b83016050'
    },
    {
      id: 'cotton-shirt',
      name: 'Cotton shirt',
      cat: 'Tops',
      price: 2190,
      a: 'photo-1594938298603-c8148c4dae35',
      b: 'photo-1483985988355-763728e1935b'
    },
    {
      id: 'utility-shorts',
      name: 'Utility shorts',
      cat: 'Bottoms',
      price: 1990,
      a: 'photo-1434389677669-e08b4cac3105',
      b: 'photo-1542272604-787c3835535d'
    }
  ];
  window.VASTRA_PRODUCTS = PRODUCTS;
  const money = n => '\u20B9' + n.toLocaleString('en-IN');
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const WISHLIST_KEY = 'vastra_wishlist';
  let wishlist = new Set();

  try {
    const saved = JSON.parse(
      localStorage.getItem(WISHLIST_KEY) || '[]'
    );

    if (Array.isArray(saved)) {
      wishlist = new Set(saved.map(String));
    }
  } catch {
    wishlist = new Set();
  }

  function saveWishlist() {
    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify([...wishlist])
    );
  }
  const grid = $('#productGrid');
  if (!grid) return;
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="p-card" data-cat="${p.cat}" data-id="${p.id}">
      <div class="p-card__media">
        <img src="${u(p.a)}" alt="${p.name}" loading="lazy">
        <img src="${u(p.b)}" alt="" loading="lazy">
        <button class="p-card__wish" type="button" data-id="${p.id}"  aria-pressed="${wishlist.has(p.id)}" aria-label="Save ${p.name}">${heart}</button>
        <button class="p-card__add" type="button"  data-id="${p.id}">Quick add</button>
      </div>
      <div class="p-card__meta">
        <div><div class="p-card__name"><a href="#/product/${p.id}">${p.name}</a></div><div class="p-card__cat">${p.cat}</div></div>
        <div class="p-card__price">${money(p.price)}</div>
      </div>
    </article>`).join('');

  const cards = $$('.p-card', grid);

  // Wishlist pop + quick add
  grid.addEventListener('click', e => {
    const wish = e.target.closest('.p-card__wish');
    const add = e.target.closest('.p-card__add');
    if (wish) {
      const id = wish.dataset.id;
       try { wishlist = new Set(JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]').map(String)); } catch { wishlist = new Set(); }
  const on = !wishlist.has(id);

      if (on) {
        wishlist.add(id);
      } else {
        wishlist.delete(id);
      }

      saveWishlist();

     $('#checkoutBtn').addEventListener('click', () => {
    closeCart();
    setTimeout(() => {
      if (!window.vastraAuth || window.vastraAuth.requireLogin('#/checkout')) location.hash = '#/checkout';
    }, 650);
  });
  document.dispatchEvent(new Event('vastra:wishlist'));
      wish.setAttribute(
        'aria-label',
        `${on ? 'Remove' : 'Save'} ${wish.closest('.p-card')
          .querySelector('.p-card__name').textContent
        }`
      );

      if (hasGSAP && !reduce) {
        gsap.fromTo(
          $('svg', wish),
          { scale: 0.5 },
          {
            scale: 1,
            duration: 0.8,
            ease: 'elastic.out(1.2, 0.4)'
          }
        );
      }
    }
    if (add) {
      const card = add.closest('.p-card');
      const product = PRODUCTS.find(
        p => p.id === card.dataset.id
      );

      if (product && typeof window.addToCart === 'function') {
        window.addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          img: u(product.a)
        });

        add.textContent = 'Added';
        setTimeout(() => {
          add.textContent = 'Quick add';
        }, 1400);
      }
    }
    if (!wish && !add) {
      const card = e.target.closest('.p-card');
      if (card) location.hash = '#/product/' + card.dataset.id;
    }
  });

  // Scroll reveal (batched, staggered)
  if (hasGSAP && !reduce) {
    gsap.set(cards, { opacity: 0, y: 40 });
    ScrollTrigger.batch(cards, {
      start: 'top 90%', once: true,
      onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', overwrite: true })
    });
  }

  // Filter tabs: cards animate out, list swaps, cards animate in
  const tabs = $$('.tab');
  let busy = false;
  tabs.forEach(tab => tab.addEventListener('click', () => {
    if (busy || tab.getAttribute('aria-selected') === 'true') return;
    tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
    const f = tab.dataset.filter;
    const swap = () => {
      cards.forEach(c => (c.hidden = !(f === 'All' || c.dataset.cat === f)));
      const next = cards.filter(c => !c.hidden);
      if (!hasGSAP || reduce) { busy = false; return; }
      gsap.fromTo(next, { opacity: 0, y: 30, scale: 0.96 }, {
        opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.06, ease: 'power3.out',
        onComplete: () => { busy = false; ScrollTrigger.refresh(); }
      });
    };
    if (!hasGSAP || reduce) { swap(); return; }
    busy = true;
    gsap.to(cards.filter(c => !c.hidden), { opacity: 0, y: -20, scale: 0.96, duration: 0.35, stagger: 0.03, ease: 'power2.in', onComplete: swap });
  }));
})();
/* ===================================================
   VASTRA · Part 2 — Lookbook, Cart, Newsletter, Footer
   =================================================== */
(() => {
  'use strict';
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INK = '#0e0e0e', ACCENT = '#c8a96a', MUTED = 'rgba(14,14,14,0.18)';

  /* ---- scroll lock (works with or without Lenis) ---- */
  const getLenis = () => window.lenis || null;
  let locks = 0;
  const lockScroll = () => {
    if (locks++ === 0) { document.documentElement.classList.add('is-locked'); getLenis()?.stop(); }
  };
  const unlockScroll = () => {
    if (--locks <= 0) { locks = 0; document.documentElement.classList.remove('is-locked'); getLenis()?.start(); }
  };

  /* =========================================================
     LOOKBOOK — masonry + parallax columns
     ========================================================= */
  const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;
  const LOOKS = [
    { id: 'photo-1469334031218-e382a71b716b', alt: 'Linen layers in warm light', r: '3/4' },
    { id: 'photo-1509631179647-0177331693ae', alt: 'Everyday dress, city walk', r: '4/5' },
    { id: 'photo-1496747611176-843222e1e57c', alt: 'Flowing summer dress', r: '2/3' },
    { id: 'photo-1483985988355-763728e1935b', alt: 'Street style, new season', r: '1/1' },
    { id: 'photo-1529139574466-a303027c1d8b', alt: 'Tailored monochrome look', r: '2/3' },
    { id: 'photo-1485968579580-b6d095142e6e', alt: 'Soft neutrals, relaxed fit', r: '3/4' },
    { id: 'photo-1487222477894-8943e31ef7b2', alt: 'Studio portrait in outerwear', r: '4/5' },
    { id: 'photo-1445205170230-053b83016050', alt: 'Wardrobe essentials', r: '1/1' },
    { id: 'photo-1434389677669-e08b4cac3105', alt: 'Garments on the rail', r: '3/4' },
    { id: 'photo-1490481651871-ab68de25d43d', alt: 'Campaign image, SS26', r: '2/3' },
    { id: 'photo-1515886657613-9f3515b0c78f', alt: 'Evening layers', r: '4/5' },
    { id: 'photo-1441986300917-64674bd600d8', alt: 'Inside the store', r: '3/4' }
  ];
  const SPEEDS = [70, -50, 100, -30]; // px of drift per column

  const grid = $('#lookGrid');
  let lookCtx = null, curCols = 0;
  const colCount = () => (innerWidth >= 1024 ? 4 : innerWidth >= 640 ? 3 : 2);

  function buildLook() {
    if (!grid) return;
    const n = colCount();
    if (n === curCols) return;
    curCols = n;

    lookCtx && lookCtx.revert();
    grid.innerHTML = '';
    const cols = Array.from({ length: n }, () => {
      const c = document.createElement('div');
      c.className = 'look__col';
      grid.appendChild(c);
      return c;
    });

    LOOKS.forEach((l, i) => {
      const fig = document.createElement('figure');
      fig.className = 'look__item';
      fig.style.setProperty('--r', l.r);
      fig.innerHTML =
        `<button class="look__btn" type="button" aria-label="View look: ${l.alt}">` +
        `<img src="${img(l.id)}" alt="${l.alt}" loading="lazy" decoding="async"></button>`;
      cols[i % n].appendChild(fig);
    });

    lookCtx = gsap.context(() => {
      // reveal each image
      $$('.look__item').forEach((item) => {
        gsap.from(item, {
          opacity: 0, y: 50, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 92%' }
        });
        gsap.from($('img', item), {
          scale: 1.25, duration: 1.4, ease: 'power3.out',
          scrollTrigger: { trigger: item, start: 'top 92%' }
        });
      });
      // parallax: every column drifts at its own speed
      if (!reduce) {
        cols.forEach((col, i) => {
          const s = SPEEDS[i % SPEEDS.length];
          gsap.fromTo(col, { y: s }, {
            y: -s, ease: 'none',
            scrollTrigger: { trigger: grid, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        });
      }
    }, grid);

    ScrollTrigger.refresh();
  }
  buildLook();
  let rzT;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(buildLook, 200); });

  /* ---- Lightbox: scale from thumbnail ---- */
  const lb = $('#lightbox'), lbBg = $('.lightbox__bg'), lbClose = $('#lbClose'), lbCap = $('#lbCap');
  let lbState = null, lbBusy = false;

  function openLB(btn) {
    if (lbState || lbBusy) return;
    const thumb = $('img', btn);
    const r = thumb.getBoundingClientRect();
    const ratio = (thumb.naturalWidth && thumb.naturalHeight) ? thumb.naturalWidth / thumb.naturalHeight : r.width / r.height;
    const maxW = innerWidth * (innerWidth < 640 ? 0.94 : 0.86);
    const maxH = innerHeight * 0.82;
    let w = maxW, h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }

    const clone = document.createElement('img');
    clone.className = 'lightbox__img';
    clone.src = thumb.currentSrc || thumb.src;
    clone.alt = thumb.alt;
    gsap.set(clone, { position: 'fixed', left: r.left, top: r.top, width: r.width, height: r.height, margin: 0 });
    lb.appendChild(clone);
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    lockScroll();
    thumb.style.visibility = 'hidden';
    lbCap.textContent = thumb.alt;
    lbState = { thumb, clone, btn };
    lbBusy = true;

    gsap.timeline({ onComplete: () => (lbBusy = false) })
      .to(lbBg, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
      .to(clone, { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h, duration: 0.85, ease: 'expo.inOut' }, 0)
      .fromTo([lbClose, lbCap], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.08 }, 0.5);
    lbClose.focus({ preventScroll: true });
  }

  function closeLB() {
    if (!lbState || lbBusy) return;
    const { thumb, clone, btn } = lbState;
    const r = thumb.getBoundingClientRect();
    lbBusy = true;
    gsap.timeline({
      onComplete() {
        thumb.style.visibility = '';
        clone.remove();
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        unlockScroll();
        lbState = null; lbBusy = false;
        btn.focus({ preventScroll: true });
      }
    })
      .to([lbClose, lbCap], { opacity: 0, duration: 0.2 }, 0)
      .to(clone, { left: r.left, top: r.top, width: r.width, height: r.height, duration: 0.75, ease: 'expo.inOut' }, 0)
      .to(lbBg, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.25);
  }

  grid?.addEventListener('click', (e) => {
    const b = e.target.closest('.look__btn');
    if (b) openLB(b);
  });
  lb?.addEventListener('click', (e) => {
    if (e.target === lbClose || lbClose.contains(e.target)) return;
    closeLB();
  });
  lbClose?.addEventListener('click', closeLB);

  /* =========================================================
     CART DRAWER
     ========================================================= */
  const KEY = 'vastra_cart';
  const drawer = $('#cartDrawer'), overlay = $('#drawerOverlay');
  const listEl = $('#cartList'), emptyEl = $('#cartEmpty'), footEl = $('#drawerFoot');
  const totalEl = $('#cartTotal'), countEl = $('#drawerCount');
  const cartBtn = $('#cartBtn'), badge = $('#cartBadge');
  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const parsePrice = (p) => (typeof p === 'number' ? p : parseFloat(String(p).replace(/[^\d.]/g, '')) || 0);

  let cart = [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(raw)) {
      cart = raw.filter((i) => i && i.id != null && i.name && Number.isFinite(+i.price) && +i.qty > 0)
        .map((i) => ({ id: String(i.id), name: String(i.name), price: +i.price, img: i.img || '', qty: Math.floor(+i.qty) }));
    }
  } catch (_) { cart = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (_) { } };

  const tot = { v: 0 };
  let isOpen = false;
  gsap.set(drawer, { xPercent: 100 });

  const itemEl = (id) => listEl.querySelector(`[data-id="${CSS.escape(id)}"]`);

  function buildItem(item) {
    const li = document.createElement('li');
    li.className = 'citem';
    li.dataset.id = item.id;
    li.innerHTML =
      `<div class="citem__img"><img alt=""></div>` +
      `<div class="citem__info"><h3 class="citem__name"></h3><p class="citem__price"></p>` +
      `<div class="qty"><button type="button" data-act="dec" aria-label="Decrease quantity">−</button>` +
      `<span class="qty__n"></span><button type="button" data-act="inc" aria-label="Increase quantity">+</button></div></div>` +
      `<div class="citem__side"><button type="button" class="citem__rm" data-act="rm" aria-label="Remove item">` +
      `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>` +
      `<strong class="citem__sub"></strong></div>`;
    const im = $('img', li);
    if (item.img) im.src = item.img;
    im.alt = item.name;
    $('.citem__name', li).textContent = item.name;
    $('.citem__price', li).textContent = fmt(item.price);
    syncItem(li, item);
    return li;
  }
  function syncItem(li, item) {
    $('.qty__n', li).textContent = item.qty;
    $('.citem__sub', li).textContent = fmt(item.price * item.qty);
  }

  function syncState(instant) {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const empty = cart.length === 0;
    if (badge) badge.textContent = count;
    if (cartBtn) cartBtn.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`);
    countEl.textContent = `(${count})`;
    emptyEl.classList.toggle('is-visible', empty);
    footEl.hidden = empty;
    if (instant) { tot.v = total; totalEl.textContent = fmt(total); }
    else {
      gsap.to(tot, { v: total, duration: 0.5, ease: 'power2.out', overwrite: true, onUpdate: () => (totalEl.textContent = fmt(Math.round(tot.v))) });
    }
  }

  function render() {
    listEl.innerHTML = '';
    cart.forEach((i) => listEl.appendChild(buildItem(i)));
    syncState(true);
  }

  function bump() {
    if (badge) gsap.fromTo(badge, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
  }

  function addToCart(product, qty = 1) {
    if (!product || product.id == null || !product.name) { console.warn('addToCart: need {id, name, price, img}'); return; }
    const id = String(product.id);
    const found = cart.find((i) => i.id === id);
    if (found) found.qty += qty;
    else cart.push({ id, name: String(product.name), price: parsePrice(product.price), img: product.img || '', qty });
    save();
    bump();

    if (!isOpen) { openCart(); return; }
    emptyEl.classList.remove('is-visible');
    let li = itemEl(id);
    if (li) { syncItem(li, cart.find((i) => i.id === id)); gsap.fromTo($('.qty__n', li), { scale: 1.5 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }); }
    else {
      li = buildItem(cart.find((i) => i.id === id));
      listEl.appendChild(li);
      gsap.from(li, { x: 60, opacity: 0, duration: 0.6, ease: 'power3.out' });
    }
    syncState();
  }

  function removeItem(id) {
    const li = itemEl(id);
    cart = cart.filter((i) => i.id !== id);
    save();
    syncState();
    const done = () => { li && li.remove(); syncState(true); if (!cart.length) gsap.from('.drawer__empty > *', { y: 24, opacity: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out' }); };
    if (!li) return done();
    // keep the empty state hidden until the row has animated out
    if (!cart.length) emptyEl.classList.remove('is-visible');
    gsap.to(li, { x: 70, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.45, ease: 'power2.inOut', onComplete: done });
  }

  function changeQty(id, d) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    if (item.qty + d <= 0) return removeItem(id);
    item.qty += d;
    save();
    const li = itemEl(id);
    if (li) { syncItem(li, item); gsap.fromTo($('.qty__n', li), { y: d > 0 ? -8 : 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }); }
    syncState();
  }

  listEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.closest('.citem').dataset.id;
    if (b.dataset.act === 'inc') changeQty(id, 1);
    else if (b.dataset.act === 'dec') changeQty(id, -1);
    else removeItem(id);
  });

  function openCart() {
    if (isOpen) return;
    isOpen = true;
    render();
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    lockScroll();
    gsap.to(overlay, { opacity: 1, duration: 0.45, ease: 'power2.out', overwrite: true });
    gsap.to(drawer, { xPercent: 0, duration: 0.75, ease: 'expo.out', overwrite: true });
    if (cart.length) {
      gsap.fromTo($$('.citem'), { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.65, stagger: 0.08, delay: 0.25, ease: 'power3.out' });
    } else {
      gsap.fromTo('.drawer__empty > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'power3.out' });
    }
    $('#drawerClose').focus({ preventScroll: true });
  }

  function closeCart() {
    if (!isOpen) return;
    isOpen = false;
    gsap.to(overlay, { opacity: 0, duration: 0.45, ease: 'power2.in', overwrite: true });
    gsap.to(drawer, {
      xPercent: 100, duration: 0.6, ease: 'expo.inOut', overwrite: true,
      onComplete() {
        drawer.classList.remove('is-open');
        overlay.classList.remove('is-open');
        drawer.setAttribute('aria-hidden', 'true');
        unlockScroll();
      }
    });
    cartBtn?.focus({ preventScroll: true });
  }

  cartBtn?.addEventListener('click', openCart);
  $('#drawerClose').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  $('#emptyShop').addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', () => alert('Checkout is not connected yet. Hook this button to your payment flow.'));

  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, a[href], input', drawer).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (lbState) closeLB(); else closeCart();
  });

  // optional: any element with data attributes can add to cart
  // <button class="js-add" data-id="p1" data-name="Linen Shirt" data-price="2499" data-img="...">
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.js-add, [data-add-to-cart]');
    if (!b) return;
    const d = b.dataset;
    addToCart({ id: d.id, name: d.name, price: d.price, img: d.img });
  });

  syncState(true);

  // Global API for the other sections
  window.addToCart = addToCart;
  window.openCart = openCart;
  window.closeCart = closeCart;
    window.getCart = () => cart.map(i => ({ ...i }));
  window.clearCart = () => { cart = []; save(); render(); syncState(true); };

  /* =========================================================
     NEWSLETTER
     ========================================================= */
  const nt = $('#newsTitle');
  if (nt) {
    const text = nt.textContent.trim();
    const hl = /^(first|access|drops|quiet)$/i;
    nt.setAttribute('aria-label', text);
    nt.innerHTML = text.split(/\s+/).map((w) => `<span class="w${hl.test(w.replace(/[^\w]/g, '')) ? ' hl' : ''}" aria-hidden="true">${w}</span>`).join(' ');
    const words = $$('.w', nt);
    gsap.set(words, { color: MUTED });
    gsap.to(words, {
      color: (i, el) => (el.classList.contains('hl') ? ACCENT : INK),
      ease: 'none', stagger: 0.25, duration: 1,
      scrollTrigger: { trigger: nt, start: 'top 82%', end: 'bottom 48%', scrub: true }
    });
    gsap.from('.news__eyebrow, .news__form', {
      y: 30, opacity: 0, duration: 0.9, stagger: 0.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.news__inner', start: 'top 80%' }
    });
  }

  const form = $('#newsForm');
  if (form) {
    const input = $('#newsEmail'), field = $('#newsField'), btn = $('#newsBtn'), msg = $('#newsMsg');
    const circ = $('.news__check circle'), tick = $('.news__check path');
    const arrow = $('.news__arrow'), check = $('.news__check');
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      msg.classList.remove('is-error');
      field.classList.remove('is-error');

      if (!re.test(val)) {
        field.classList.add('is-error');
        msg.classList.add('is-error');
        msg.textContent = 'Please enter a valid email address.';
        gsap.fromTo(field, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,0.3)' });
        input.focus();
        return;
      }

      btn.classList.add('is-loading');
      btn.disabled = true;
      input.readOnly = true;

      // Replace this timeout with your real API call (fetch → then success()).
      setTimeout(success, 800);
    });

    function success() {
      btn.classList.remove('is-loading');
      btn.classList.add('is-done');
      field.classList.add('is-done');
      const lc = circ.getTotalLength(), lt = tick.getTotalLength();
      gsap.set(circ, { strokeDasharray: lc, strokeDashoffset: lc });
      gsap.set(tick, { strokeDasharray: lt, strokeDashoffset: lt });
      gsap.timeline()
        .to(arrow, { opacity: 0, scale: 0.4, duration: 0.25 })
        .set(check, { opacity: 1 })
        .to(circ, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' })
        .to(tick, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, '-=0.1')
        .fromTo(msg, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, onStart: () => (msg.textContent = 'You’re in. Welcome to VASTRA.') }, '-=0.3');
    }
  }

  /* =========================================================
     FOOTER
     ========================================================= */
  const chars = $$('.foot__brand .ch i');
  if (chars.length) {
      gsap.from(chars, {
      yPercent: 115, stagger: 0.08, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.foot__brand', start: 'top 98%', once: true }
    });
  }
  gsap.from('.foot__intro, .foot__col', {
    y: 36, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.foot__top', start: 'top 88%' }
  });

  /* ---- Back to top + progress ring ---- */
  const toTop = $('#toTop'), bar = $('#toTopBar');
  const C = 2 * Math.PI * 25; // circumference, r = 25
  if (toTop && bar) {
    bar.style.strokeDasharray = C;
    bar.style.strokeDashoffset = C;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate(self) {
        bar.style.strokeDashoffset = C * (1 - self.progress);
        toTop.classList.toggle('is-visible', self.scroll() > 400);
      }
    });
    toTop.addEventListener('click', () => {
      const l = getLenis();
      if (l) l.scrollTo(0, { duration: 1.6 });
      else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
})();
/* ===== PART 5: Router + Product page ===== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const home = $('#main'), view = $('#viewProduct');
  const PRODUCTS = window.VASTRA_PRODUCTS || [];
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const pic = (id, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
  const SIZES = ['S', 'M', 'L', 'XL'];
  // Placeholder copy: apni asli product details se badal lena
  const INFO = {
    Tops: { desc: 'A soft, breathable top cut for easy layering, from morning commutes to late evenings.', fabric: 'Organic cotton, mid-weight. Pre-washed for a lived-in feel.', fit: 'Relaxed fit. Size down for a closer cut.' },
    Bottoms: { desc: 'Easy, structured bottoms with room to move and a clean line that holds through the day.', fabric: 'Cotton-blend, mid-weight, with a soft hand-feel.', fit: 'Regular fit through the leg. True to size.' },
    Outerwear: { desc: 'A light outer layer made for changing weather, easy to throw on and easy to pack.', fabric: 'Breathable woven shell with a smooth lining.', fit: 'Slightly oversized to sit over layers.' }
  };
  const lenis = () => window.lenis || null;
  const toTop = () => (lenis() ? lenis().scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0));
  let current = 'home', homeY = 0;
  window.vastraView = () => current;

  const parse = () => {
    const h = location.hash;
    const m = h.match(/^#\/product\/([\w-]+)$/);
    if (m) return { name: 'product', id: m[1] };
        if (/^#\/(login|signup|forgot|wishlist|checkout)$/.test(h)) return { name: 'auth' };
    return { name: 'home', anchor: h.length > 1 && !h.startsWith('#/') ? h.slice(1) : '' };
  };

  function render(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) {
      view.innerHTML = `<div class="pp pp-nf"><h1>Product not found</h1><a class="btn" href="#featured" style="color:var(--ink);border-color:var(--ink)"><span class="btn__fill"></span><span class="btn__label">Back to shop</span></a></div>`;
      document.title = 'Not found | VASTRA';
      return null;
    }
    const info = INFO[p.cat] || INFO.Tops;
    const imgs = [p.a, p.b];
    const related = PRODUCTS.filter(x => x.id !== p.id).sort((a, b) => (b.cat === p.cat) - (a.cat === p.cat)).slice(0, 4);
    document.title = `${p.name} | VASTRA`;
    view.innerHTML = `
    <div class="pp" data-id="${p.id}">
      <nav class="pp__crumbs" aria-label="Breadcrumb"><a href="#hero">Home</a><span>/</span><a href="#featured">${p.cat}</a><span>/</span><span aria-current="page">${p.name}</span></nav>
      <div class="pp__layout">
        <div class="pp__gallery">
          <div class="pp__thumbs">${imgs.map((s, i) => `<button class="pp__thumb" type="button" data-src="${s}" aria-current="${i === 0}" aria-label="View image ${i + 1}"><img src="${pic(s, 200)}" alt=""></button>`).join('')}</div>
          <div class="pp__main" id="ppMain"><img src="${pic(imgs[0])}" alt="${p.name}"></div>
        </div>
        <div class="pp__info">
          <h1 class="pp__title">${p.name}</h1>
          <p class="pp__price">${fmt(p.price)}</p>
          <p class="pp__desc">${info.desc}</p>
          <p class="pp__label" id="sizeLbl">Size</p>
          <div class="pp__sizes" role="radiogroup" aria-labelledby="sizeLbl">${SIZES.map(s => `<button class="size" type="button" role="radio" aria-checked="false" data-size="${s}">${s}</button>`).join('')}</div>
          <div class="pp__buy">
            <div class="pp-qty"><button type="button" data-q="-1" aria-label="Decrease quantity">−</button><span id="ppQty" aria-live="polite">1</span><button type="button" data-q="1" aria-label="Increase quantity">+</button></div>
            <button class="pp__add" type="button" id="ppAdd">Add to cart</button>
          </div>
          <p class="pp__msg" id="ppMsg" role="status"></p>
          <div class="acc">
            ${[['Fabric and care', info.fabric + ' Machine wash cold, line dry.'], ['Fit', info.fit], ['Shipping and returns', 'Free shipping on orders above ₹2,999. Easy 7-day returns on unworn items.']]
        .map(([t, b], i) => `<div class="acc__item"><button class="acc__btn" type="button" aria-expanded="${i === 0}">${t}</button><div class="acc__panel"><div><p>${b}</p></div></div></div>`).join('')}
          </div>
        </div>
      </div>
      <section class="pp__more" aria-labelledby="moreT">
        <h2 id="moreT">You may also like</h2>
        <div class="pp__more-grid">${related.map(r => `<a class="rel" href="#/product/${r.id}"><div class="rel__img"><img src="${pic(r.a, 700)}" alt="${r.name}" loading="lazy"></div><div class="rel__meta"><span>${r.name}</span><span>${fmt(r.price)}</span></div></a>`).join('')}</div>
      </section>
    </div>`;
    return p;
  }

  function animateIn() {
    if (!hasGSAP || reduce) return;
    gsap.from('.pp__main', { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'expo.out' });
    gsap.from('.pp__main img', { scale: 1.25, duration: 1.6, ease: 'expo.out' });
    gsap.from('.pp__crumbs, .pp__info > *, .pp__thumb', { y: 28, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', delay: 0.15 });
  }

  function route() {
    const r = parse(), was = current;
        const navbar = $('#navbar');
    if (r.name === 'auth') {
      if (was === 'home') homeY = scrollY;
      home.hidden = true; view.hidden = true;
          document.body.classList.add('is-page');
      document.body.classList.toggle('is-auth', /^#\/(login|signup|forgot)$/.test(location.hash));
      document.title = 'Account | VASTRA';
      current = 'auth';
      if (navbar) navbar.classList.remove('navbar--hidden');
      toTop();
      return;
    }
    document.body.classList.remove('is-auth');
    if (r.name === 'product') {
      if (was === 'home') homeY = scrollY;
      const p = render(r.id);
      home.hidden = true; view.hidden = false;
      document.body.classList.add('is-page');
      current = 'product';
      if (navbar) navbar.classList.remove('navbar--hidden');
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      toTop();
      if (p) animateIn();
    } else {
      view.hidden = true; home.hidden = false;
      document.body.classList.remove('is-page');
      document.title = 'VASTRA';
      current = 'home';
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      const t = r.anchor && document.getElementById(r.anchor);
      const go = () => {
        if (t) (lenis() ? lenis().scrollTo(t, { immediate: was !== 'home' }) : t.scrollIntoView());
        else if (was !== 'home') (lenis() ? lenis().scrollTo(homeY, { immediate: true, force: true }) : scrollTo(0, homeY));
      };
      requestAnimationFrame(go);
    }
  }
  addEventListener('hashchange', route);
  route();

  /* ---------- Product page interactions (delegated, view content gets re-rendered) ---------- */
  view.addEventListener('click', e => {
    const root = e.target.closest('.pp');
    if (!root) return;
    const p = PRODUCTS.find(x => x.id === root.dataset.id);
    const msg = $('#ppMsg', root);

    const thumb = e.target.closest('.pp__thumb');
    if (thumb) {
      $$('.pp__thumb', root).forEach(t => t.setAttribute('aria-current', t === thumb));
      const im = $('#ppMain img', root);
      const next = pic(thumb.dataset.src);
      if (hasGSAP && !reduce) gsap.to(im, { opacity: 0, duration: 0.2, onComplete: () => { im.src = next; im.onload = () => gsap.to(im, { opacity: 1, duration: 0.4 }); } });
      else im.src = next;
    }

    const size = e.target.closest('.size');
    if (size) {
      $$('.size', root).forEach(s => s.setAttribute('aria-checked', s === size));
      msg.textContent = '';
    }

    const q = e.target.closest('[data-q]');
    if (q) {
      const el = $('#ppQty', root);
      el.textContent = Math.min(10, Math.max(1, +el.textContent + +q.dataset.q));
    }

    const acc = e.target.closest('.acc__btn');
    if (acc) acc.setAttribute('aria-expanded', acc.getAttribute('aria-expanded') !== 'true');

    if (e.target.closest('#ppAdd') && p) {
      const chosen = $('.size[aria-checked="true"]', root);
      if (!chosen) {
        msg.textContent = 'Please select a size.';
        if (hasGSAP && !reduce) gsap.fromTo('.pp__sizes', { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
        return;
      }
      if (typeof window.addToCart === 'function') {
        window.addToCart({ id: `${p.id}-${chosen.dataset.size}`, name: `${p.name} · ${chosen.dataset.size}`, price: p.price, img: pic(p.a, 300) }, +$('#ppQty', root).textContent);
      }
    }
  });

  // Hover zoom follows the cursor
  view.addEventListener('pointermove', e => {
    const m = e.target.closest('.pp__main');
    if (!m) return;
    const r = m.getBoundingClientRect();
    m.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
    m.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
  });
})();
/* ===== PART 6: Auth (login / sign up / forgot) ===== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const view = $('#viewAuth');
  if (!view) return;

  /* ---------- Demo backend (localStorage). Replace `api` with real fetch() calls. ---------- */
  const USERS = 'vastra_users', SESSION = 'vastra_session', AFTER = 'vastra_after_login';
  const read = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch { return fb; } };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const hash = async (pw, email) => {
    const data = new TextEncoder().encode(email + '|' + pw + '|vastra');
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', data);
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    return 'fallback:' + btoa(String.fromCharCode(...data)); // only when SubtleCrypto is unavailable
  };
  const api = {
    async signup({ name, email, password }) {
      await wait(800);
      const users = read(USERS, {});
      if (users[email]) throw new Error('An account with this email already exists. Try logging in.');
      users[email] = { name, hash: await hash(password, email) };
      localStorage.setItem(USERS, JSON.stringify(users));
      return { name, email };
    },
    async login({ email, password }) {
      await wait(800);
      const u = read(USERS, {})[email];
      if (!u || u.hash !== await hash(password, email)) throw new Error('Incorrect email or password.');
      return { name: u.name, email };
    },
    async forgot() { await wait(700); return true; } // never reveal whether an email exists
  };

  /* ---------- Session ---------- */
  const getUser = () => {
    for (const s of [localStorage, sessionStorage]) {
      try { const v = JSON.parse(s.getItem(SESSION)); if (v && v.email) return v; } catch {}
    }
    return null;
  };
  const setUser = (u, remember) => {
    try { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(u)); } catch {}
  };

  /* ---------- Navbar account button ---------- */
  const acct = $('#acctBtn'), pop = $('#acctPop');
  const syncNav = () => {
    if (!acct) return;
    const u = getUser();
    acct.classList.toggle('is-in', !!u);
    acct.setAttribute('aria-label', u ? 'Account menu' : 'Log in');
    if (u) {
      $('#acctIni').textContent = u.name.trim().charAt(0).toUpperCase();
      $('#acctName').textContent = 'Hi, ' + u.name.trim().split(/\s+/)[0];
      $('#acctMail').textContent = u.email;
      acct.setAttribute('aria-haspopup', 'true');
      acct.setAttribute('aria-expanded', 'false');
    } else {
      acct.removeAttribute('aria-haspopup'); acct.removeAttribute('aria-expanded');
      if (pop) pop.hidden = true;
    }
  };
  const logout = () => {
    try { localStorage.removeItem(SESSION); sessionStorage.removeItem(SESSION); } catch {}
    syncNav();
  };
  if (acct && pop) {
    acct.addEventListener('click', e => {
      if (!getUser()) return;            // logged out: normal link to #/login
      e.preventDefault();
      const open = pop.hidden;
      pop.hidden = !open;
      acct.setAttribute('aria-expanded', open);
      if (open && hasGSAP && !reduce) gsap.fromTo(pop, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' });
    });
    document.addEventListener('click', e => { if (!pop.hidden && !e.target.closest('.acct-wrap')) pop.hidden = true; });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; acct.focus(); } });
    $('#logoutBtn').addEventListener('click', () => { logout(); pop.hidden = true; });
  }
  syncNav();

  // Other parts (e.g. checkout) can use this
  window.vastraAuth = {
    user: getUser, logout,
    requireLogin(after) {
      if (getUser()) return true;
      try { sessionStorage.setItem(AFTER, after || location.hash || '#hero'); } catch {}
      location.hash = '#/login';
      return false;
    }
  };

  /* ---------- Markup (built once) ---------- */
  const EYE = '<button class="af__eye" type="button" aria-label="Show password" aria-pressed="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path class="slash" d="M4 4l16 16"/></svg></button>';
  const F = (id, type, label, auto) =>
    `<div class="af"><input id="${id}" name="${id}" type="${type}" placeholder=" " autocomplete="${auto}" aria-describedby="${id}Err"${type === 'email' ? ' inputmode="email" autocapitalize="off" spellcheck="false"' : ''}><label for="${id}">${label}</label>${type === 'password' ? EYE : ''}<p class="af__err" id="${id}Err" aria-live="polite"></p></div>`;
  const BTN = t => `<button class="auth__btn" type="submit"><span class="auth__btn-t">${t}</span></button>`;

  let built = false;
  function build() {
    if (built) return;
    built = true;
    view.innerHTML = `
    <div class="auth">
      <div class="auth__panel">
        <nav class="auth__tabs" id="authTabs" aria-label="Account">
          <a class="auth__tab" id="tabLogin" href="#/login">Log in</a>
          <a class="auth__tab" id="tabSignup" href="#/signup">Sign up</a>
          <span class="auth__ind" id="authInd"></span>
        </nav>

        <form id="fLogin" novalidate>
          <h1 class="auth__title">Welcome back</h1>
          <p class="auth__sub">Log in to see your orders and check out faster.</p>
          ${F('lEmail', 'email', 'Email address', 'email')}
          ${F('lPass', 'password', 'Password', 'current-password')}
          <div class="auth__row">
            <label class="chk"><input type="checkbox" id="lRemember"> Remember me</label>
            <a class="auth__link" href="#/forgot">Forgot password?</a>
          </div>
          ${BTN('Log in')}
          <p class="auth__msg" role="alert"></p>
          <p class="auth__alt">New here? <a href="#/signup">Create an account</a></p>
        </form>

        <form id="fSignup" novalidate hidden>
          <h1 class="auth__title">Create your account</h1>
          <p class="auth__sub">Save your favourites and get first access to new drops.</p>
          ${F('sName', 'text', 'Full name', 'name')}
          ${F('sEmail', 'email', 'Email address', 'email')}
          ${F('sPass', 'password', 'Password', 'new-password')}
          <div class="meter" id="meter" data-s="0" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <p class="meter__txt" id="meterTxt"></p>
          ${F('sConf', 'password', 'Confirm password', 'new-password')}
          <div class="chk-wrap"><label class="chk"><input type="checkbox" id="sTerms" aria-describedby="sTermsErr"> I agree to the Terms and Privacy Policy</label><p class="af__err" id="sTermsErr" aria-live="polite"></p></div>
          ${BTN('Create account')}
          <p class="auth__msg" role="alert"></p>
          <p class="auth__alt">Already have an account? <a href="#/login">Log in</a></p>
        </form>

        <form id="fForgot" novalidate hidden>
          <h1 class="auth__title">Reset password</h1>
          <p class="auth__sub">Enter your email and we will send you a reset link.</p>
          ${F('fEmail', 'email', 'Email address', 'email')}
          ${BTN('Send reset link')}
          <p class="auth__msg" role="status"></p>
          <p class="auth__alt"><a href="#/login">Back to log in</a></p>
        </form>

        <div class="auth__ok" id="authOk" hidden>
          <svg class="auth__tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15 27l8 8 15-17"/></svg>
          <h1 class="auth__title" id="okTitle"></h1>
          <p class="auth__sub">Taking you back to the shop…</p>
        </div>
      </div>
      <aside class="auth__art" aria-hidden="true">
        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=80" alt="">
        <p class="auth__quote">Clothes that move <em>with you.</em></p>
      </aside>
    </div>`;
  }

  /* ---------- Validation ---------- */
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.';
  const V = {
    lEmail: emailOk, lPass: v => !!v || 'Please enter your password.',
    sName: v => v.trim().length > 1 || 'Please enter your name.', sEmail: emailOk,
    sPass: v => (v.length >= 8 && /[a-z]/i.test(v) && /\d/.test(v)) || 'Use 8+ characters with a letter and a number.',
    sConf: v => (!!v && v === $('#sPass').value) || 'Passwords do not match.',
    sTerms: c => c || 'Please accept the terms to continue.',
    fEmail: emailOk
  };
  const box = el => el.closest('.af, .chk-wrap');
  const setErr = (el, msg) => {
    const b = box(el);
    if (b) b.classList.toggle('is-error', !!msg);
    const e = $('#' + el.id + 'Err'); if (e) e.textContent = msg || '';
    el.setAttribute('aria-invalid', !!msg);
  };
  const check = el => {
    const r = V[el.id](el.type === 'checkbox' ? el.checked : el.value);
    setErr(el, r === true ? '' : r);
    return r === true;
  };
  const shake = els => { if (hasGSAP && !reduce) gsap.fromTo(els, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' }); };
  const validate = form => {
    const bad = $$('input[id]', form).filter(i => V[i.id] && !check(i));
    if (bad.length) { bad[0].focus(); shake(bad.map(box)); return false; }
    return true;
  };
  const formMsg = (form, text, ok) => { const m = $('.auth__msg', form); m.textContent = text; m.classList.toggle('is-ok', !!ok); };
  const busy = (form, on) => { const b = $('.auth__btn', form); b.classList.toggle('is-loading', on); b.disabled = on; };
  const clearForm = f => {
    $$('.is-error', f).forEach(n => n.classList.remove('is-error'));
    $$('.af__err', f).forEach(n => (n.textContent = ''));
    $$('input', f).forEach(i => i.removeAttribute('aria-invalid'));
    formMsg(f, '');
    busy(f, false);
  };

  const score = v => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
    return v ? Math.max(1, s) : 0;
  };

  /* ---------- Delegated events ---------- */
  view.addEventListener('input', e => {
    const el = e.target;
    if (!V[el.id]) return;
    el.dataset.touched = '1';
    if (box(el).classList.contains('is-error')) check(el);
    if (el.id === 'sPass') {
      const s = score(el.value);
      $('#meter').dataset.s = s;
      $('#meterTxt').textContent = ['', 'Weak', 'Fair', 'Good', 'Strong'][s];
      if ($('#sConf').dataset.touched) check($('#sConf'));
    }
  });
  view.addEventListener('change', e => { if (e.target.type === 'checkbox' && V[e.target.id]) check(e.target); });
  view.addEventListener('focusout', e => { if (V[e.target.id] && e.target.dataset.touched) check(e.target); });
  view.addEventListener('click', e => {
    const eye = e.target.closest('.af__eye');
    if (!eye) return;
    const input = $('input', eye.parentElement);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    eye.setAttribute('aria-pressed', show);
    eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  const finish = (user, remember, text) => {
    setUser(user, remember);
    syncNav();
    $$('form', view).forEach(f => (f.hidden = true));
    $('#authTabs').hidden = true;
    const ok = $('#authOk');
    ok.hidden = false;
    $('#okTitle').textContent = `${text}, ${user.name.trim().split(/\s+/)[0]}.`;
    const circ = $('.auth__tick circle'), tick = $('.auth__tick path');
    if (hasGSAP && !reduce) {
      const lc = circ.getTotalLength(), lt = tick.getTotalLength();
      gsap.set(circ, { strokeDasharray: lc, strokeDashoffset: lc });
      gsap.set(tick, { strokeDasharray: lt, strokeDashoffset: lt });
      gsap.timeline()
        .to(circ, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' })
        .to(tick, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, '-=0.1')
        .from('#okTitle, #authOk .auth__sub', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, '-=0.2');
    }
    setTimeout(() => {
      let to = '#hero';
      try { to = sessionStorage.getItem(AFTER) || '#hero'; sessionStorage.removeItem(AFTER); } catch {}
      location.hash = to;
    }, reduce ? 900 : 1600);
  };

  const norm = v => v.trim().toLowerCase();
  const handlers = {
    async fLogin(f) {
      if (!validate(f)) return;
      busy(f, true); formMsg(f, '');
      try {
        const u = await api.login({ email: norm($('#lEmail').value), password: $('#lPass').value });
        finish(u, $('#lRemember').checked, 'Welcome back');
      } catch (err) { busy(f, false); formMsg(f, err.message); shake($('.auth__btn', f)); }
    },
    async fSignup(f) {
      if (!validate(f)) return;
      busy(f, true); formMsg(f, '');
      try {
        const u = await api.signup({ name: $('#sName').value.trim(), email: norm($('#sEmail').value), password: $('#sPass').value });
        finish(u, true, 'Welcome to VASTRA');
      } catch (err) { busy(f, false); formMsg(f, err.message); shake($('.auth__btn', f)); }
    },
    async fForgot(f) {
      if (!validate(f)) return;
      busy(f, true); formMsg(f, '');
      try {
        await api.forgot({ email: norm($('#fEmail').value) });
        busy(f, false);
        formMsg(f, 'If an account exists for that email, a reset link is on its way.', true);
      } catch (err) { busy(f, false); formMsg(f, 'Something went wrong. Please try again.'); }
    }
  };
  view.addEventListener('submit', e => { e.preventDefault(); handlers[e.target.id]?.(e.target); });

  /* ---------- Mode switching ---------- */
  const FORMS = { login: 'fLogin', signup: 'fSignup', forgot: 'fForgot' };
  let mode = null;
  const moveInd = () => {
    const t = $('.auth__tab[aria-current="page"]'), ind = $('#authInd');
    if (!t || !ind) return;
    ind.style.width = t.offsetWidth + 'px';
    ind.style.transform = `translateX(${t.offsetLeft}px)`;
  };
  function showMode(next) {
    const first = mode === null;
    mode = next;
    $('#authOk').hidden = true;
    $('#authTabs').hidden = next === 'forgot';
    $('#tabLogin').toggleAttribute('aria-current', next === 'login');
    $('#tabSignup').toggleAttribute('aria-current', next === 'signup');
    if (next === 'login') $('#tabLogin').setAttribute('aria-current', 'page');
    else $('#tabLogin').removeAttribute('aria-current');
    if (next === 'signup') $('#tabSignup').setAttribute('aria-current', 'page');
    else $('#tabSignup').removeAttribute('aria-current');

    let target;
    Object.entries(FORMS).forEach(([k, id]) => {
      const f = $('#' + id);
      f.hidden = k !== next;
      if (k === next) { clearForm(f); target = f; }
    });
    moveInd();
    document.title = { login: 'Log in', signup: 'Sign up', forgot: 'Reset password' }[next] + ' | VASTRA';

    if (hasGSAP && !reduce) {
      const items = $$('.auth__title, .auth__sub, .af, .auth__row, .meter, .meter__txt, .chk-wrap, .auth__btn, .auth__alt', target);
      gsap.fromTo(items, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity', delay: first ? 0.2 : 0 });
      if (first) gsap.from('.auth__art', { clipPath: 'inset(0 0 100% 0)', duration: 1.3, ease: 'expo.out', clearProps: 'clipPath' });
    }
    if (!coarse) { const i = $('input', target); if (i) i.focus({ preventScroll: true }); }
  }

  function onRoute() {
    const m = location.hash.match(/^#\/(login|signup|forgot)$/);
    if (!m) { view.hidden = true; return; }
    if (getUser() && m[1] !== 'forgot') { location.replace('#hero'); return; } // already logged in
    build();
    view.hidden = false;
    showMode(m[1]);
  }
  addEventListener('hashchange', onRoute);
  addEventListener('resize', moveInd);
  document.fonts && document.fonts.ready.then(moveInd);
  onRoute();
})();
/* ===== PART 7: Wishlist + Checkout ===== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const hasGSAP = typeof gsap !== 'undefined';
  const vW = $('#viewWish'), vC = $('#viewCheckout'), vP = $('#viewProduct');
  if (!vW || !vC) return;

  const PRODUCTS = window.VASTRA_PRODUCTS || [];
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pic = (id, w = 700) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  const animIn = (sel, root) => {
    if (hasGSAP && !reduce) gsap.fromTo($$(sel, root), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity' });
  };

  /* ---------- Wishlist storage (shared with Part 3 cards) ---------- */
  const WKEY = 'vastra_wishlist', OKEY = 'vastra_orders';
  const getWish = () => { try { const a = JSON.parse(localStorage.getItem(WKEY) || '[]'); return Array.isArray(a) ? a.map(String) : []; } catch { return []; } };
  const setWish = a => { try { localStorage.setItem(WKEY, JSON.stringify(a)); } catch {} document.dispatchEvent(new Event('vastra:wishlist')); };
  const toggleWish = id => {
    const a = getWish(), on = !a.includes(id);
    setWish(on ? [...a, id] : a.filter(x => x !== id));
    return on;
  };

  let lastCount = null;
  const syncAll = () => {
    const ids = new Set(getWish());
    const n = PRODUCTS.filter(p => ids.has(p.id)).length;
    const b = $('#wlBadge'), btn = $('#wlBtn');
    if (b) {
      b.hidden = n === 0; b.textContent = n;
      if (lastCount !== null && n > lastCount && hasGSAP && !reduce) gsap.fromTo(b, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
    }
    if (btn) btn.setAttribute('aria-label', `Wishlist, ${n} item${n === 1 ? '' : 's'}`);
    lastCount = n;
    $$('.p-card__wish').forEach(w => {
      const on = ids.has(w.dataset.id), name = w.closest('.p-card')?.querySelector('.p-card__name')?.textContent || '';
      w.setAttribute('aria-pressed', on);
      w.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${name}`);
    });
    const pw = $('.pp__wish', vP), pid = $('.pp', vP)?.dataset.id;
    if (pw && pid) pw.setAttribute('aria-pressed', ids.has(pid));
  };
  document.addEventListener('vastra:wishlist', syncAll);

  /* Heart button on the product page (Part 5 re-renders it, so inject on each render) */
  if (vP) {
    new MutationObserver(() => {
      const buy = $('.pp__buy', vP), root = $('.pp', vP);
      if (!buy || !root || $('.pp__wish', buy)) return;
      const on = getWish().includes(root.dataset.id);
      buy.insertAdjacentHTML('beforeend', `<button class="pp__wish" type="button" aria-pressed="${on}" aria-label="Save to wishlist">${HEART}</button>`);
    }).observe(vP, { childList: true });
    vP.addEventListener('click', e => {
      const b = e.target.closest('.pp__wish'); if (!b) return;
      toggleWish($('.pp', vP).dataset.id);
      if (hasGSAP && !reduce) gsap.fromTo($('svg', b), { scale: 0.5 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1.2, 0.4)' });
    });
  }

  /* ---------- Wishlist page ---------- */
  const addProduct = p => { if (typeof window.addToCart === 'function') window.addToCart({ id: p.id, name: p.name, price: p.price, img: pic(p.a, 300) }); };
  function renderWish(animate) {
    const items = getWish().map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
    const card = p => `
      <article class="wl-card" data-id="${p.id}">
        <a class="wl-card__img" href="#/product/${p.id}"><img src="${pic(p.a)}" alt="${esc(p.name)}" loading="lazy"></a>
        <button class="wl-card__rm" type="button" data-rm aria-label="Remove ${esc(p.name)} from wishlist"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <div class="wl-card__meta"><div><a class="wl-card__name" href="#/product/${p.id}">${esc(p.name)}</a><p class="wl-card__cat">${p.cat}</p></div><span>${fmt(p.price)}</span></div>
        <button class="wl-card__add" type="button" data-add>Add to cart</button>
      </article>`;
    vW.innerHTML = `
      <div class="wl-page">
        <header class="wl-page__head"><h1>Wishlist <span>(${items.length})</span></h1>${items.length ? '<button class="wl-page__all" type="button" id="wlAll">Add all to cart</button>' : ''}</header>
        ${items.length ? `<div class="wl-grid">${items.map(card).join('')}</div>` : `
        <div class="wl-empty">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>
          <h2>Nothing saved yet</h2><p>Tap the heart on anything you love and it will wait for you here.</p>
          <a class="auth__btn co__cta" href="#featured"><span class="auth__btn-t">Browse the collection</span></a>
        </div>`}
      </div>`;
    if (animate) animIn('.wl-page__head, .wl-card, .wl-empty > *', vW);
  }
  vW.addEventListener('click', e => {
    const cardEl = e.target.closest('.wl-card');
    const p = cardEl && PRODUCTS.find(x => x.id === cardEl.dataset.id);
    if (e.target.closest('[data-rm]') && p) {
      const done = () => { setWish(getWish().filter(x => x !== p.id)); renderWish(false); };
      if (hasGSAP && !reduce) gsap.to(cardEl, { opacity: 0, scale: 0.94, duration: 0.35, ease: 'power2.in', onComplete: done });
      else done();
    }
    const add = e.target.closest('[data-add]');
    if (add && p) { addProduct(p); add.textContent = 'Added'; setTimeout(() => (add.textContent = 'Add to cart'), 1400); }
    if (e.target.closest('#wlAll')) {
      getWish().map(id => PRODUCTS.find(x => x.id === id)).filter(Boolean).forEach(addProduct);
    }
  });

  /* ---------- Checkout ---------- */
  const SHIP = {
    standard: { label: 'Standard delivery', note: '4 to 6 business days', days: 5, fee: sub => (sub >= 2999 ? 0 : 99) },
    express: { label: 'Express delivery', note: '1 to 2 business days', days: 2, fee: () => 249 }
  };
  const PAYLABEL = { upi: 'UPI', card: 'Card', cod: 'Cash on delivery' };
  const COD_FEE = 50;
  let st = { ship: 'standard', pay: 'upi' };
  const getCart = () => (window.getCart ? window.getCart() : []);
  const totals = cart => {
    const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const ship = SHIP[st.ship].fee(sub), cod = st.pay === 'cod' ? COD_FEE : 0;
    return { sub, ship, cod, total: sub + ship + cod };
  };
  const sumHTML = cart => {
    const t = totals(cart);
    return `<h2>Order summary</h2>
      ${cart.map(i => `<div class="co-item"><div class="co-item__img"><img src="${esc(i.img)}" alt=""><span class="co-item__qty">${i.qty}</span></div><span>${esc(i.name)}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
      <div class="co-line"><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
      <div class="co-line"><span>Shipping</span><span>${t.ship ? fmt(t.ship) : 'Free'}</span></div>
      ${t.cod ? `<div class="co-line"><span>Cash on delivery fee</span><span>${fmt(t.cod)}</span></div>` : ''}
      <div class="co-line co-line--total"><span>Total</span><span>${fmt(t.total)}</span></div>`;
  };
  const F = (id, type, label, auto, value = '', extra = '') =>
    `<div class="af"><input id="${id}" name="${id}" type="${type}" placeholder=" " autocomplete="${auto}" value="${esc(value)}" aria-describedby="${id}Err" ${extra}><label for="${id}">${label}</label><p class="af__err" id="${id}Err" aria-live="polite"></p></div>`;

  function renderCheckout() {
    const cart = getCart();
    if (!cart.length) {
      vC.innerHTML = `<div class="co co--ok"><h1 class="co__title">Your cart is empty</h1><p style="color:var(--ink-soft);margin-bottom:1.8rem">Add something you love and come back to check out.</p><a class="auth__btn co__cta" href="#featured"><span class="auth__btn-t">Start shopping</span></a></div>`;
      animIn('.co > *', vC);
      return;
    }
    const u = (window.vastraAuth && window.vastraAuth.user()) || {};
    const sub = totals(cart).sub;
    vC.innerHTML = `
    <div class="co">
      <h1 class="co__title">Checkout</h1>
      <div class="co__layout">
        <form id="coForm" class="co__form" novalidate>
          <section class="co__sec"><h2>Contact</h2>${F('cEmail', 'email', 'Email address', 'email', u.email || '', 'inputmode="email" autocapitalize="off" spellcheck="false"')}</section>
          <section class="co__sec"><h2>Shipping address</h2>
            ${F('cName', 'text', 'Full name', 'name', u.name || '')}
            ${F('cPhone', 'tel', 'Mobile number', 'tel', '', 'inputmode="tel"')}
            ${F('cAddr', 'text', 'Address (house, street, area)', 'street-address')}
            <div class="co__row">${F('cCity', 'text', 'City', 'address-level2')}${F('cState', 'text', 'State', 'address-level1')}</div>
            ${F('cPin', 'text', 'PIN code', 'postal-code', '', 'inputmode="numeric" maxlength="6"')}
          </section>
          <section class="co__sec"><h2>Delivery</h2>
            ${Object.entries(SHIP).map(([k, s]) => `<label class="opt"><input type="radio" name="ship" value="${k}" ${k === st.ship ? 'checked' : ''}><span class="opt__body"><strong>${s.label}</strong><small>${s.note}</small></span><span class="opt__price" ${k === 'standard' ? 'id="shipStd"' : ''}>${s.fee(sub) ? fmt(s.fee(sub)) : 'Free'}</span></label>`).join('')}
          </section>
          <section class="co__sec"><h2>Payment</h2>
            ${Object.entries(PAYLABEL).map(([k, l]) => `<label class="opt"><input type="radio" name="pay" value="${k}" ${k === st.pay ? 'checked' : ''}><span class="opt__body"><strong>${l}</strong></span>${k === 'cod' ? `<span class="opt__price">+${fmt(COD_FEE)}</span>` : ''}</label>`).join('')}
            <div class="co__pay" data-pay="upi">${F('cUpi', 'text', 'UPI ID (name@bank)', 'off', '', 'autocapitalize="off" spellcheck="false"')}</div>
            <div class="co__pay" data-pay="card" hidden>
              ${F('cNum', 'text', 'Card number', 'cc-number', '', 'inputmode="numeric" maxlength="23"')}
              <div class="co__row">${F('cExp', 'text', 'Expiry (MM/YY)', 'cc-exp', '', 'inputmode="numeric" maxlength="5"')}${F('cCvv', 'password', 'CVV', 'cc-csc', '', 'inputmode="numeric" maxlength="4"')}</div>
            </div>
            <div class="co__pay" data-pay="cod" hidden><p class="co__note">Pay in cash when your order arrives. A small handling fee applies.</p></div>
          </section>
          <button class="auth__btn co__place" type="submit"><span class="auth__btn-t">Place order · ${fmt(totals(cart).total)}</span></button>
          <p class="auth__msg" role="alert"></p>
        </form>
        <aside class="co__sum" id="coSum" aria-label="Order summary">${sumHTML(cart)}</aside>
      </div>
    </div>`;
    animIn('.co__title, .co__sec, .co__sum', vC);
  }

  function refreshSummary() {
    if (!$('#coForm', vC)) return;
    const cart = getCart();
    if (!cart.length) return renderCheckout();
    $('#coSum').innerHTML = sumHTML(cart);
    const t = totals(cart), lbl = $('.co__place .auth__btn-t', vC);
    if (lbl) lbl.textContent = `Place order · ${fmt(t.total)}`;
    const sp = $('#shipStd'); if (sp) sp.textContent = SHIP.standard.fee(t.sub) ? fmt(SHIP.standard.fee(t.sub)) : 'Free';
  }
  const drawer = $('#cartDrawer');
  if (drawer) new MutationObserver(() => { if (!drawer.classList.contains('is-open') && location.hash === '#/checkout') refreshSummary(); }).observe(drawer, { attributes: true, attributeFilter: ['class'] });

  /* Validation */
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.';
  const luhn = v => {
    const d = v.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(d)) return false;
    let s = 0, alt = false;
    for (let i = d.length - 1; i >= 0; i--) { let n = +d[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } s += n; alt = !alt; }
    return s % 10 === 0;
  };
  const expOk = v => {
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) return 'Enter a valid expiry like 08/28.';
    return new Date(2000 + +m[2], +m[1], 1) > new Date() || 'This card has expired.';
  };
  const V = {
    cEmail: emailOk,
    cName: v => v.trim().length > 1 || 'Please enter your full name.',
    cPhone: v => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '')) || 'Enter a valid 10-digit mobile number.',
    cAddr: v => v.trim().length > 5 || 'Please enter your full address.',
    cCity: v => v.trim().length > 1 || 'Please enter your city.',
    cState: v => v.trim().length > 1 || 'Please enter your state.',
    cPin: v => /^\d{6}$/.test(v.trim()) || 'Enter a 6-digit PIN code.',
    cUpi: v => /^[\w.\-]{2,}@[A-Za-z]{2,}$/.test(v.trim()) || 'Enter a valid UPI ID, like name@bank.',
    cNum: v => luhn(v) || 'Enter a valid card number.',
    cExp: expOk,
    cCvv: v => /^\d{3,4}$/.test(v) || 'Enter the 3 or 4 digit code.'
  };
  const required = () => ['cEmail', 'cName', 'cPhone', 'cAddr', 'cCity', 'cState', 'cPin', ...({ upi: ['cUpi'], card: ['cNum', 'cExp', 'cCvv'], cod: [] })[st.pay]];
  const setErr = (el, msg) => {
    el.closest('.af').classList.toggle('is-error', !!msg);
    $('#' + el.id + 'Err').textContent = msg || '';
    el.setAttribute('aria-invalid', !!msg);
  };
  const check = el => { const r = V[el.id](el.value); setErr(el, r === true ? '' : r); return r === true; };

  vC.addEventListener('input', e => {
    const el = e.target;
    if (!V[el.id]) return;
    if (el.id === 'cNum') el.value = el.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
    if (el.id === 'cExp') { const d = el.value.replace(/\D/g, '').slice(0, 4); el.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; }
    if (el.id === 'cPin' || el.id === 'cCvv') el.value = el.value.replace(/\D/g, '');
    el.dataset.touched = '1';
    if (el.closest('.af').classList.contains('is-error')) check(el);
  });
  vC.addEventListener('focusout', e => { if (V[e.target.id] && e.target.dataset.touched) check(e.target); });
  vC.addEventListener('change', e => {
    const r = e.target;
    if (r.name === 'ship') { st.ship = r.value; refreshSummary(); }
    if (r.name === 'pay') {
      st.pay = r.value;
      $$('.co__pay', vC).forEach(p => (p.hidden = p.dataset.pay !== st.pay));
      refreshSummary();
    }
  });

  vC.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.target.id !== 'coForm') return;
    const f = e.target, btn = $('.co__place', f), msg = $('.auth__msg', f);
    msg.textContent = '';
    const bad = required().map(id => $('#' + id, f)).filter(el => !check(el));
    if (bad.length) {
      bad[0].focus();
      if (hasGSAP && !reduce) gsap.fromTo(bad.map(b => b.closest('.af')), { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    btn.classList.add('is-loading'); btn.disabled = true;
    try {
      await wait(1300); // TODO: replace with your real payment gateway call (Razorpay, Stripe, etc.)
      const cart = getCart(), t = totals(cart);
      const order = {
        id: 'VST-' + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase(),
        date: new Date().toISOString(),
        name: $('#cName').value.trim(), city: $('#cCity').value.trim(), pin: $('#cPin').value.trim(),
        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        ship: st.ship, pay: st.pay, total: t.total   // card / UPI details are never stored
      };
      try { const all = JSON.parse(localStorage.getItem(OKEY) || '[]'); all.unshift(order); localStorage.setItem(OKEY, JSON.stringify(all.slice(0, 20))); } catch {}
      if (typeof window.clearCart === 'function') window.clearCart();
      renderSuccess(order);
    } catch (err) {
      btn.classList.remove('is-loading'); btn.disabled = false;
      msg.textContent = 'Payment could not be completed. Please try again.';
    }
  });

  function renderSuccess(o) {
    const eta = new Date(Date.now() + SHIP[o.ship].days * 864e5).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    vC.innerHTML = `
    <div class="co co--ok">
      <svg class="auth__tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="23"/><path d="M15 27l8 8 15-17"/></svg>
      <h1 class="co__title">Order placed</h1>
      <p>Thank you, ${esc(o.name.split(/\s+/)[0])}. Your order <strong>${o.id}</strong> is confirmed.</p>
      <dl class="co-ok__meta">
        <div><dt>Estimated delivery</dt><dd>${eta}</dd></div>
        <div><dt>Payment</dt><dd>${PAYLABEL[o.pay]}</dd></div>
        <div><dt>Total</dt><dd>${fmt(o.total)}</dd></div>
      </dl>
      <a class="auth__btn co__cta" href="#featured"><span class="auth__btn-t">Continue shopping</span></a>
    </div>`;
    toTop();
    if (hasGSAP && !reduce) {
      const c = $('.auth__tick circle', vC), t = $('.auth__tick path', vC), lc = c.getTotalLength(), lt = t.getTotalLength();
      gsap.set(c, { strokeDasharray: lc, strokeDashoffset: lc });
      gsap.set(t, { strokeDasharray: lt, strokeDashoffset: lt });
      gsap.timeline().to(c, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }).to(t, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, '-=0.1')
        .from('.co--ok > *:not(svg)', { y: 24, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, '-=0.2');
    }
  }
  const toTop = () => (window.lenis ? window.lenis.scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0));

  /* ---------- Routes ---------- */
  function onRoute() {
    const h = location.hash, isW = h === '#/wishlist', isC = h === '#/checkout';
    if (isC && window.vastraAuth && !window.vastraAuth.user()) { window.vastraAuth.requireLogin('#/checkout'); return; }
    vW.hidden = !isW; vC.hidden = !isC;
    document.body.classList.toggle('is-checkout', isC);
    if (isW) { renderWish(true); document.title = 'Wishlist | VASTRA'; }
    if (isC) { st = { ship: 'standard', pay: 'upi' }; renderCheckout(); document.title = 'Checkout | VASTRA'; }
    syncAll();
  }
  addEventListener('hashchange', onRoute);
  onRoute();
})();
/* ===== FIX: Checkout button ===== */
(() => {
  const old = document.getElementById('checkoutBtn');
  if (!old) return;
  const btn = old.cloneNode(true);   // clone karne se purana alert wala handler hat jata hai
  old.replaceWith(btn);
  if (typeof window.getCart !== 'function') {
    window.getCart = () => {
      try { const a = JSON.parse(localStorage.getItem('vastra_cart')); return Array.isArray(a) ? a : []; }
      catch { return []; }
    };
  }
  btn.addEventListener('click', () => {
    if (typeof window.closeCart === 'function') window.closeCart();
    setTimeout(() => {
      if (!window.vastraAuth || window.vastraAuth.requireLogin('#/checkout')) location.hash = '#/checkout';
    }, 650);
  });
})();