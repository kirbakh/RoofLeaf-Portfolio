/**
 * Effects: loader, leaf cursor, floating leaves, reveals
 */

import {
  INTRO_LOADER_KEY,
  growLoaderIntroMarkup,
  routeTransitionInnerHtml,
  routeLoaderInnerHtml,
} from './loader-ui.js';
import { PAGE_TRANSITION_MS } from './nav-timing.js';

export { PAGE_TRANSITION_MS };
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = () => window.matchMedia('(hover: none)').matches;
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

function initDeviceClasses() {
  document.body.classList.toggle('is-touch', isTouch());
  document.body.classList.toggle('is-mobile', isMobile());
  if (isTouch()) document.body.classList.add('no-custom-cursor');
}

let resizeTimer;
function onViewportChange() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    initDeviceClasses();
    tuneAmbientLayers();
  }, 150);
}

let revealObserver = null;

export function revealNow(container = document) {
  const root = container?.querySelectorAll ? container : document;
  const els = root.querySelectorAll('.reveal:not(.is-visible), .fade-in:not(.is-visible)');
  els.forEach((el, i) => {
    const delay = Number(el.dataset.revealDelay || i * 50);
    setTimeout(() => el.classList.add('is-visible'), delay);
  });
  root.querySelectorAll('.text-reveal:not(.is-visible)').forEach((el, i) => {
    setTimeout(() => el.classList.add('is-visible'), i * 60);
  });
}

export function revealInViewport(container = document) {
  const root = container?.querySelectorAll ? container : document;
  const vh = window.innerHeight * 0.92;
  root.querySelectorAll('.reveal:not(.is-visible), .fade-in:not(.is-visible), .text-reveal:not(.is-visible)').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh && rect.bottom > 0) el.classList.add('is-visible');
  });
}

export function applyStaggerChildren(grid) {
  if (!grid?.children) return;
  [...grid.children].forEach((child, i) => {
    if (child.classList.contains('error-state') || child.classList.contains('empty-state')) return;
    child.classList.add('reveal', 'reveal-stagger');
    child.classList.remove('is-visible');
    const delay = child.dataset.revealDelay || String(i * 85);
    child.dataset.revealDelay = delay;
    child.style.setProperty('--reveal-delay', `${delay}ms`);
  });
}

function autoRevealMarkup() {
  document.querySelectorAll('.section').forEach((section) => {
    section.classList.add('section--scroll');
    const container = section.querySelector('.container');
    if (container && !section.querySelector('.section-divider')) {
      const divider = document.createElement('div');
      divider.className = 'section-divider reveal';
      divider.setAttribute('aria-hidden', 'true');
      section.insertBefore(divider, container);
    }
  });

  const cards = '.usp-card, .stat-card, .team-card, .journal-card, .review-card, .filters-panel, .cta-block, .newsletter-strip, .promo-banner, .contact-card, .faq-item, .plant-detail__info';
  document.querySelectorAll(cards).forEach((el, i) => {
    el.classList.remove('is-visible');
    if (!el.classList.contains('reveal')) {
      el.classList.add('reveal');
      const mod = i % 5;
      if (mod === 1) el.classList.add('reveal-left');
      else if (mod === 2) el.classList.add('reveal-right');
      else if (mod === 3) el.classList.add('reveal-scale');
      else if (mod === 4) el.classList.add('reveal-flip');
    }
  });

  document.querySelectorAll('.stagger-grid').forEach((grid) => applyStaggerChildren(grid));

  document.querySelectorAll('.section-eyebrow:not(.reveal)').forEach((el) => el.classList.add('reveal', 'reveal-fade'));
  document.querySelectorAll('.section-title:not(.reveal):not(.text-reveal)').forEach((el) => {
    if (!el.closest('.hero')) el.classList.add('reveal', 'reveal-blur');
  });

  document.querySelectorAll('.page-title').forEach((block) => {
    block.querySelector('h1:not(.text-reveal)')?.classList.add('text-reveal');
    block.querySelector('p:not(.reveal)')?.classList.add('reveal');
    block.querySelector('.section-eyebrow:not(.reveal)')?.classList.add('reveal', 'reveal-fade');
  });

  document.querySelectorAll('.footer-col').forEach((el, i) => {
    el.classList.add('reveal');
    el.dataset.revealDelay = String(i * 90);
  });

  document.querySelectorAll('.hero-stat').forEach((el, i) => {
    el.classList.add('reveal', 'reveal-scale');
    el.dataset.revealDelay = String(180 + i * 110);
  });

  document.querySelectorAll('.catalog-toolbar, .pagination').forEach((el) => {
    el.classList.add('reveal', 'reveal-fade');
  });

  document.querySelectorAll('.hero-title-accent').forEach((el) => el.classList.add('text-gradient-animated'));
  document.querySelector('.hero-visual')?.classList.add('spotlight-zone', 'img-reveal');
  document.querySelectorAll('.section-title:not(.scroll-driven)').forEach((el) => {
    if (!el.closest('.hero')) el.classList.add('scroll-driven');
  });

  const heavyFx = !prefersReduced() && !isMobile() && !isTouch();
  if (heavyFx) {
    const tiltSel = '.usp-card, .stat-card, .team-card, .journal-card, .journal-featured__card, .review-card, .pot-card, .photo-mosaic__item, .cta-block, .newsletter-strip, .plant-hero__gallery, .plant-hero__panel';
    document.querySelectorAll(tiltSel).forEach((el) => el.classList.add('tilt-card'));
    document.querySelectorAll('.glass-card').forEach((el) => el.classList.add('glass-shimmer'));
  }

  document.querySelectorAll('.btn-primary, .btn-secondary').forEach((el) => {
    el.classList.add('btn-shine', 'btn-ripple');
  });

  document.querySelectorAll('.marquee').forEach((el) => el.classList.add('marquee--enhanced'));
}

function tuneAmbientLayers() {
  const wrap = document.querySelector('.floating-leaves');
  if (!wrap) return;

  const count = prefersReduced() ? 0 : isMobile() ? 4 : isTouch() ? 8 : 18;
  if (wrap.dataset.leafCount === String(count)) return;

  wrap.dataset.leafCount = String(count);
  wrap.innerHTML = Array.from({ length: count }, (_, i) => {
    const left = 5 + (i * 7) % 90;
    const delay = (i * 0.7) % 8;
    const dur = 14 + (i % 5) * 2;
    const size = 12 + (i % 4) * 6;
    return `<span class="floating-leaf" style="left:${left}%;animation-delay:${delay}s;animation-duration:${dur}s;width:${size}px;height:${size}px" aria-hidden="true"></span>`;
  }).join('');
}

export function injectChrome() {
  if (document.querySelector('.ambient-bg')) {
    tuneAmbientLayers();
    return;
  }

  document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <div class="ambient-bg" aria-hidden="true">
      <div class="ambient-orb ambient-orb--1"></div>
      <div class="ambient-orb ambient-orb--2"></div>
      <div class="ambient-orb ambient-orb--3"></div>
      <div class="ambient-vine ambient-vine--1" aria-hidden="true"></div>
      <div class="ambient-vine ambient-vine--2" aria-hidden="true"></div>
      <div class="floating-leaves" data-leaf-count="0"></div>
    </div>
    <div class="scroll-progress" id="scroll-progress" aria-hidden="true"></div>
    <div class="page-loader" id="page-loader" aria-hidden="true">
      ${growLoaderIntroMarkup()}
    </div>
    <div class="cursor-leaf" id="cursor-leaf" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2C8 8 6 14 12 22 18 14 16 8 12 2Z" fill="currentColor"/></svg>
    </div>
    <div class="cursor-glow" id="cursor-glow" aria-hidden="true"></div>
    <div class="page-transition" id="page-transition" aria-hidden="true">${routeTransitionInnerHtml()}</div>
    <div class="route-loader" id="route-loader" aria-hidden="true">
      <div class="route-loader__box">${routeLoaderInnerHtml()}</div>
    </div>
    <button type="button" class="back-to-top" id="back-to-top" data-i18n-aria="a11y.backToTop" data-i18n-title="a11y.backToTopTitle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    </button>
    `
  );
  tuneAmbientLayers();
  initBackToTop();
}

function finishLoader(loader) {
  loader?.classList.add('is-done');
  try {
    sessionStorage.setItem(INTRO_LOADER_KEY, '1');
  } catch {
    /* ignore */
  }
  document.body.classList.add('is-loaded');
  document.body.dataset.introDone = '1';
  revealNow(document.querySelector('.hero') || document);
  setTimeout(() => loader?.remove(), 750);
}

function skipIntroLoader(loader) {
  loader?.remove();
  document.body.classList.add('is-loaded');
  document.body.dataset.introDone = '1';
  revealNow();
}

function initRouteLoader() {
  const route = document.getElementById('route-loader');
  if (!route || prefersReduced() || isMobile()) {
    document.body.classList.add('is-loaded');
    route?.classList.remove('is-active');
    route?.removeAttribute('aria-busy');
    revealNow();
    return;
  }

  let introDone = false;
  try {
    introDone = !!sessionStorage.getItem(INTRO_LOADER_KEY);
  } catch {
    introDone = false;
  }

  if (!introDone) return;

  document.body.classList.remove('is-loaded');
  route.classList.add('is-active');
  route.setAttribute('aria-busy', 'true');

  const done = () => {
    route.classList.remove('is-active');
    route.removeAttribute('aria-busy');
    document.body.classList.add('is-loaded');
    revealNow();
  };

  const minMs = 420;
  const start = performance.now();
  const finish = () => {
    const left = Math.max(0, minMs - (performance.now() - start));
    setTimeout(done, left);
  };

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
}

function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) {
    initRouteLoader();
    return;
  }

  if (prefersReduced()) {
    loader.remove();
    try {
      sessionStorage.setItem(INTRO_LOADER_KEY, '1');
    } catch {
      /* ignore */
    }
    skipIntroLoader(null);
    return;
  }

  let introDone = false;
  try {
    introDone = !!sessionStorage.getItem(INTRO_LOADER_KEY);
  } catch {
    introDone = false;
  }

  if (introDone || isMobile()) {
    skipIntroLoader(loader);
    if (isMobile()) {
      try {
        sessionStorage.setItem(INTRO_LOADER_KEY, '1');
      } catch {
        /* ignore */
      }
    }
    initRouteLoader();
    return;
  }

  document.body.classList.remove('is-loaded');
  loader.classList.add('is-animating');
  setTimeout(() => {
    loader.classList.add('is-bloom');
  }, 2400);
  setTimeout(() => {
    loader.classList.add('is-complete');
    setTimeout(() => finishLoader(loader), 800);
  }, 3800);
}

function initScrollUX() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  let ticking = false;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    bar.style.setProperty('--scroll', `${p}%`);
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}

function initCursor() {
  if (prefersReduced() || isTouch()) {
    document.getElementById('cursor-leaf')?.remove();
    document.getElementById('cursor-glow')?.remove();
    document.body.classList.add('no-custom-cursor');
    return;
  }

  const leaf = document.getElementById('cursor-leaf');
  const glow = document.getElementById('cursor-glow');
  if (!leaf || !glow) return;

  let mx = 0;
  let my = 0;
  let gx = 0;
  let gy = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    leaf.style.transform = `translate(${mx}px, ${my}px) rotate(${mx * 0.02}deg)`;
  });

  const loop = () => {
    gx += (mx - gx) * 0.12;
    gy += (my - gy) * 0.12;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(loop);
  };
  loop();

  document.querySelectorAll('a, button, .magnetic, input, textarea').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      leaf.classList.add('is-hover');
      glow.classList.add('is-hover');
    });
    el.addEventListener('mouseleave', () => {
      leaf.classList.remove('is-hover');
      glow.classList.remove('is-hover');
    });
  });
}

function initTextReveal() {
  document.querySelectorAll('.text-reveal').forEach((el) => {
    if (el.dataset.revealReady) return;
    const text = el.textContent.trim();
    el.innerHTML = `<span class="text-reveal-inner">${text}</span>`;
    el.dataset.revealReady = '1';
  });
}

function initReveal() {
  if (prefersReduced()) {
    revealNow();
    return;
  }

  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.revealDelay || 0);
        el.style.setProperty('--reveal-delay', `${delay}ms`);
        setTimeout(() => el.classList.add('is-visible'), delay);
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );

  document.querySelectorAll('.reveal:not(.is-visible), .fade-in:not(.is-visible), .text-reveal:not(.is-visible), .section-divider:not(.is-visible)').forEach((el, i) => {
    if (!el.dataset.revealDelay) el.dataset.revealDelay = String((i % 6) * 65);
    revealObserver.observe(el);
  });
}

function initSectionInView() {
  if (prefersReduced()) {
    document.querySelectorAll('.section--scroll').forEach((s) => s.classList.add('is-inview'));
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-inview');
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -10% 0px' }
  );

  document.querySelectorAll('.section--scroll').forEach((s) => obs.observe(s));
}

function initParallax() {
  if (prefersReduced() || isTouch() || isMobile()) return;
  const items = document.querySelectorAll('[data-parallax]');
  if (!items.length) return;

  const onScroll = () => {
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const offset = (rect.top - window.innerHeight * 0.35) * (Number(el.dataset.parallax) || 0.08);
      const img = el.querySelector('img') || el;
      if (img) img.style.transform = `translate3d(0, ${offset}px, 0) scale(1.03)`;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initMagnetic(root = document) {
  if (prefersReduced() || isTouch() || isMobile()) return;
  root.querySelectorAll('.magnetic').forEach((btn) => {
    if (btn.dataset.magneticBound) return;
    btn.dataset.magneticBound = '1';
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.15;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.15;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

function initCountUp() {
  const els = document.querySelectorAll('[data-count]:not([data-counted])');
  if (!els.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = Number(el.dataset.decimals || 0);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 1600, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      el.textContent = `${(target * ease).toFixed(decimals)}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
      else el.dataset.counted = '1';
    };
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  els.forEach((el) => obs.observe(el));
}

function initNavbarMorph() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-morphed', window.scrollY > 48);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initScrollState() {
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    let state = 'top';
    if (max > 0 && y >= max - 24) state = 'end';
    else if (y > 80) state = 'scrolled';
    document.body.dataset.scroll = state;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';

  const toggle = () => btn.classList.toggle('is-visible', window.scrollY > 420);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
  });
}

function isInternalLink(a) {
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank') return false;
  try {
    const url = new URL(href, location.href);
    return url.origin === location.origin && !href.endsWith('.pdf');
  } catch {
    return false;
  }
}

function showNavLoader(overlay) {
  overlay.classList.add('is-active');
  overlay.setAttribute('aria-busy', 'true');
  document.body.classList.add('is-leaving');
}

/** Перехід на сторінку товару: короткий лоадер → сторінка */
export function navigateWithTransition(href) {
  if (!href) return;
  const reduced = prefersReduced() || isMobile();

  let targetUrl;
  try {
    targetUrl = new URL(href, window.location.href);
  } catch {
    location.href = href;
    return;
  }

  const plantId = targetUrl.searchParams.get('id');
  if (plantId) {
    try {
      sessionStorage.setItem('rl-plant-id', plantId);
    } catch {
      /* ignore */
    }
  }

  const goToPage = () => {
    const overlay = document.getElementById('page-transition');
    if (overlay && !reduced) {
      showNavLoader(overlay);
      setTimeout(() => {
        location.assign(targetUrl.href);
      }, PAGE_TRANSITION_MS);
    } else {
      location.assign(targetUrl.href);
    }
  };

  goToPage();
}

function initPageTransition() {
  if (prefersReduced() || isMobile()) return;
  const overlay = document.getElementById('page-transition');
  if (!overlay) return;

  document.querySelectorAll('a[href]').forEach((a) => {
    if (!isInternalLink(a) || a.dataset.transitionBound) return;
    a.dataset.transitionBound = '1';
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute('href');
      if (!href || href === location.pathname + location.search) return;

      e.preventDefault();
      showNavLoader(overlay);
      setTimeout(() => {
        location.href = href;
      }, PAGE_TRANSITION_MS);
    });
  });
}

function initLinkPrefetch() {
  if (isTouch()) return;
  const prefetched = new Set();

  document.querySelectorAll('a[href]').forEach((a) => {
    if (!isInternalLink(a)) return;
    a.addEventListener('mouseenter', () => {
      const href = a.getAttribute('href');
      if (!href || prefetched.has(href)) return;
      prefetched.add(href);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    }, { once: false, passive: true });
  });
}

function initTilt(root = document) {
  if (prefersReduced() || isTouch()) return;

  root.querySelectorAll?.('.tilt-card')?.forEach((card) => {
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = '1';

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 14;
      const y = ((e.clientY - r.top) / r.height - 0.5) * -14;
      card.style.setProperty('--tilt-x', `${x}deg`);
      card.style.setProperty('--tilt-y', `${y}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
}

function initSpotlights(root = document) {
  if (prefersReduced() || isTouch()) return;

  const scope = root?.querySelectorAll ? root : document;
  scope.querySelectorAll('.spotlight-zone:not([data-spotlight-ready])').forEach((zone) => {
    zone.dataset.spotlightReady = '1';

    let glow = zone.querySelector('.spotlight-glow');
    if (!glow) {
      glow = document.createElement('div');
      glow.className = 'spotlight-glow';
      glow.setAttribute('aria-hidden', 'true');
      zone.appendChild(glow);
    }

    zone.addEventListener('mousemove', (e) => {
      const r = zone.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      zone.style.setProperty('--spot-x', `${x}%`);
      zone.style.setProperty('--spot-y', `${y}%`);
      zone.classList.add('is-spotlight-active');
    });

    zone.addEventListener('mouseleave', () => zone.classList.remove('is-spotlight-active'));
  });
}

function initSpotlight() {
  initSpotlights(document);
}

function initRipple(root = document) {
  root.querySelectorAll?.('.btn-ripple')?.forEach((btn) => {
    if (btn.dataset.rippleBound) return;
    btn.dataset.rippleBound = '1';
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}

function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('button');
    if (!btn || btn.dataset.faqBound) return;
    btn.dataset.faqBound = '1';

    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item.is-open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          other.querySelector('button')?.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('is-open', !wasOpen);
      btn.setAttribute('aria-expanded', String(!wasOpen));
    });
  });
}

function initMarqueePause() {
  document.querySelectorAll('.marquee').forEach((el) => {
    el.addEventListener('mouseenter', () => el.classList.add('is-paused'));
    el.addEventListener('mouseleave', () => el.classList.remove('is-paused'));
    el.addEventListener('focusin', () => el.classList.add('is-paused'));
    el.addEventListener('focusout', () => el.classList.remove('is-paused'));
  });
}

export function initEffects() {
  initDeviceClasses();
  window.addEventListener('resize', onViewportChange, { passive: true });
  injectChrome();
  autoRevealMarkup();
  initLoader();
  initScrollUX();
  initScrollState();
  initCursor();
  initTextReveal();
  initSectionInView();
  initReveal();
  initParallax();
  initMagnetic();
  initCountUp();
  initNavbarMorph();
  initSpotlight();
  initTilt();
  initRipple();
  initFaqAccordion();
  initMarqueePause();
  initPageTransition();
  initLinkPrefetch();
}

function boot() {
  initEffects();
}

if (document.body) boot();
else document.addEventListener('DOMContentLoaded', boot);

document.addEventListener('DOMContentLoaded', () => {
  autoRevealMarkup();
  initTextReveal();
  initSectionInView();
  initReveal();
  initMagnetic();
  initCountUp();
  initTilt();
  initRipple();
  initSpotlight();
  initPageTransition();
  initFaqAccordion();
});

window.rlNavigate = navigateWithTransition;

window.reinitEffects = (container = document) => {
  const scope = container?.querySelectorAll ? container : document;
  const heavyFx = !prefersReduced() && !isMobile() && !isTouch();
  scope.querySelectorAll?.('.stagger-grid').forEach((grid) => applyStaggerChildren(grid));
  if (heavyFx) {
    scope.querySelectorAll?.('.glass-card:not(.glass-shimmer)').forEach((el) => el.classList.add('glass-shimmer'));
  }
  scope.querySelectorAll?.('.btn-primary:not(.btn-shine), .btn-secondary:not(.btn-shine)').forEach((el) => {
    el.classList.add('btn-shine', 'btn-ripple');
  });
  initTextReveal();
  revealInViewport(container);
  initReveal();
  initMagnetic(container);
  initCountUp();
  initTilt(container);
  initRipple(container);
  initSpotlights(container);
};
