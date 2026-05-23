/**
 * Анімації та інтерактив сторінки товару
 */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = () => window.matchMedia('(hover: none)').matches;

function revealPlantElements(root) {
  root.querySelectorAll('.plant-reveal:not(.is-visible)').forEach((el, i) => {
    const delay = Number(el.dataset.revealDelay ?? i * 65);
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    setTimeout(() => el.classList.add('is-visible'), 60 + delay);
  });

  const figure = root.querySelector('.plant-hero__figure');
  if (figure) {
    setTimeout(() => figure.classList.add('is-visible'), 140);
  }

  setTimeout(() => root.querySelector('.plant-hero')?.classList.add('is-mounted'), 80);
}

function initSpotlights(root) {
  if (reduced() || touch()) return;

  root.querySelectorAll('.spotlight-zone:not([data-spotlight-ready])').forEach((zone) => {
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

function sameImageSrc(current, next) {
  try {
    return new URL(current, window.location.href).href === new URL(next, window.location.href).href;
  } catch {
    return current === next;
  }
}

function swapPlantImage(img, src) {
  if (!img || !src || sameImageSrc(img.src, src)) return;
  img.classList.add('is-swapping');
  window.setTimeout(() => {
    img.src = src;
    img.classList.remove('is-swapping');
    img.classList.add('is-swapped');
    window.requestAnimationFrame(() => img.classList.remove('is-swapped'));
  }, 220);
}

function bindThumbSwap(root) {
  const img = root.querySelector('#plant-main-img');
  if (!img) return;

  root.querySelectorAll('[data-thumb]').forEach((btn) => {
    if (btn.dataset.thumbBound) return;
    btn.dataset.thumbBound = '1';
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-thumb]').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      swapPlantImage(img, btn.dataset.thumb);
    });
  });
}

function initSceneParallax(root) {
  if (reduced() || touch()) return;
  const scene = root.querySelector('.plant-scene');
  if (!scene || scene.dataset.parallaxBound) return;
  scene.dataset.parallaxBound = '1';

  const hero = root.querySelector('.plant-hero');
  if (!hero) return;

  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    scene.style.setProperty('--scene-x', `${nx * 14}px`);
    scene.style.setProperty('--scene-y', `${ny * 10}px`);
  });

  hero.addEventListener('mouseleave', () => {
    scene.style.setProperty('--scene-x', '0px');
    scene.style.setProperty('--scene-y', '0px');
  });
}

function initCareIcons(root) {
  if (reduced()) return;
  const items = root.querySelectorAll('.plant-hero__care-item');
  if (!items.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-animated');
      });
    },
    { threshold: 0.5 }
  );
  items.forEach((el) => obs.observe(el));
}

function pulseCartButton(root) {
  const btn = root.querySelector('[data-add-cart]');
  if (!btn || btn.dataset.cartPulseBound) return;
  btn.dataset.cartPulseBound = '1';
  btn.addEventListener('click', () => {
    if (btn.disabled || reduced()) return;
    btn.classList.add('is-pulse');
    window.setTimeout(() => btn.classList.remove('is-pulse'), 700);
  });
}

function initPlantSections(root) {
  root.querySelectorAll('.plant-section').forEach((section) => {
    section.classList.add('section--scroll', 'is-inview');
  });
}

/** Контент «Догляд» не повинен залежати від scroll-reveal */
export function unlockCareSection(root) {
  const care = root.querySelector('.plant-section--care');
  if (!care) return;

  care.classList.add('is-inview', 'plant-section--care-ready');
  const layout = care.querySelector('.plant-care-layout');
  if (layout) {
    layout.style.opacity = '1';
    layout.style.visibility = 'visible';
    layout.style.transform = 'none';
    layout.style.filter = 'none';
  }

  care.querySelectorAll(
    '.reveal, .fade-in, .plant-care-layout, .plant-care-layout__title, .plant-care-prose, .plant-care-prose p, .plant-tag-guide, .plant-tag-card, .plant-tag-card__desc, .plant-care-fact, .plant-care-fact__value'
  ).forEach((el) => {
    el.classList.add('is-visible');
    el.classList.remove('reveal-left', 'reveal-right', 'reveal-scale', 'reveal-blur', 'reveal-fade', 'reveal-flip');
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
  });
}

/**
 * @param {HTMLElement | null} [root]
 */
export function initPlantPage(root = document.getElementById('plant-root')) {
  if (!root?.querySelector('.plant-hero')) return;

  document.body.classList.add('is-plant-page');
  initPlantSections(root);
  unlockCareSection(root);

  if (reduced()) {
    root.querySelectorAll('.plant-reveal, .reveal').forEach((el) => el.classList.add('is-visible'));
    root.querySelector('.plant-hero__figure')?.classList.add('is-visible');
    root.querySelector('.plant-hero')?.classList.add('is-mounted');
    return;
  }

  revealPlantElements(root);
  initSpotlights(root);
  bindThumbSwap(root);
  initSceneParallax(root);
  initCareIcons(root);
  pulseCartButton(root);
}
