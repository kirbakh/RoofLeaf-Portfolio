/**
 * Root & Leaf — shared utilities
 */

import { localizePlant, priceLocale } from './content-i18n.js';
import { t } from './i18n.js';

export const FAVORITES_KEY = 'rl-favorites';

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function formatPrice(price, currency = 'UAH', locale = 'uk-UA') {
  if (currency === 'UAH') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'UAH',
      maximumFractionDigits: 0,
    }).format(price);
  }
  return `${price} ${currency}`;
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const PLANT_NAV_KEY = 'rl-plant-id';

/** ID рослини з URL або з навігації з каталогу (fallback) */
export function getPlantIdFromUrl() {
  const fromUrl = getQueryParam('id');
  if (fromUrl?.trim()) return fromUrl.trim();
  try {
    const stored = sessionStorage.getItem(PLANT_NAV_KEY);
    return stored?.trim() || '';
  } catch {
    return '';
  }
}

export function rememberPlantNavId(id) {
  if (!id) return;
  try {
    sessionStorage.setItem(PLANT_NAV_KEY, id);
  } catch {
    /* ignore */
  }
}

export function clearPlantNavId() {
  try {
    sessionStorage.removeItem(PLANT_NAV_KEY);
  } catch {
    /* ignore */
  }
}

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return favs.includes(id);
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}

export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const IMG_FALLBACK = 'assets/images/placeholder.svg';

const IMG_SIZES = {
  thumb: { w: 144, h: 144, q: 70 },
  card: { w: 320, h: 400, q: 75 },
  detail: { w: 720, h: 900, q: 80 },
  hero: { w: 800, h: 1000, q: 80 },
};

/** Локальний або віддалений URL медіа */
export function resolveMediaUrl(url, size = 'card') {
  if (!url || typeof url !== 'string') return IMG_FALLBACK;
  if (url.startsWith('assets/')) return url;
  return optimizeUnsplashUrl(url, size);
}

/** Оптимізований URL (Unsplash — менший розмір / якість) */
export function optimizeUnsplashUrl(url, size = 'card') {
  if (!url || typeof url !== 'string') return IMG_FALLBACK;
  if (!url.includes('images.unsplash.com')) return url;

  const preset = IMG_SIZES[size] || IMG_SIZES.card;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(preset.w));
    u.searchParams.set('h', String(preset.h));
    u.searchParams.set('q', String(preset.q));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}

export function getPlantImageUrl(plant, index = 0, size = 'card') {
  const url = plant?.images?.[index] ?? plant?.images?.[0];
  return resolveMediaUrl(url, size);
}

/** Обкладинки статей журналу */
export function getArticleCoverUrl(url, size = 'cover') {
  if (!url) return IMG_FALLBACK;
  if (url.startsWith('assets/')) return url;

  const presets = {
    cover: { w: 640, h: 400, q: 78 },
    hero: { w: 960, h: 540, q: 80 },
  };
  if (!url.includes('images.unsplash.com')) return url;
  const preset = presets[size] || presets.cover;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(preset.w));
    u.searchParams.set('h', String(preset.h));
    u.searchParams.set('q', String(preset.q));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}

export function plantImageHtml(plant, opts = {}) {
  const { width = 320, height = 400, className = '', index = 0, size = 'card' } = opts;
  const src = getPlantImageUrl(plant, index, size);
  const loc = localizePlant(plant);
  const alt = loc?.name ? escapeHTML(loc.name) : escapeHTML(t()?.plant?.altFallback || 'Рослина');
  const cls = className ? ` class="${className}"` : '';
  const local = src.startsWith('assets/');
  const ref = local ? '' : ' referrerpolicy="no-referrer"';
  const sizes = opts.sizes || '(max-width: 767px) 46vw, (max-width: 959px) 33vw, 280px';
  return `<img${cls} src="${src}" alt="${alt}" width="${width}" height="${height}" sizes="${sizes}" loading="lazy" decoding="async" fetchpriority="low"${ref} onerror="this.onerror=null;this.src='${IMG_FALLBACK}'">`;
}

const LOCALE_FALLBACK = {
  care: {
    easy: 'Легкий догляд',
    medium: 'Середній догляд',
    light: { low: 'Мало світла', medium: 'Розсіяне', bright: 'Яскраве' },
    size: { S: 'S', M: 'M', L: 'L' },
  },
  sections: { inStock: 'В наявності', outOfStock: 'Немає в наявності', emptyCatalog: 'Нічого не знайдено' },
  cta: { addFavorite: 'В обране', removeFavorite: 'Прибрати', addCart: 'В кошик', inCart: 'Додано' },
};

export function createPlantCard(plant, locale, options = {}) {
  const p = localizePlant(plant);
  const L = { ...LOCALE_FALLBACK, ...locale, care: { ...LOCALE_FALLBACK.care, ...locale?.care }, sections: { ...LOCALE_FALLBACK.sections, ...locale?.sections }, cta: { ...LOCALE_FALLBACK.cta, ...locale?.cta } };
  const careLabel = p.careLevel === 'easy' ? L.care.easy : L.care.medium;
  const lightLabel = L.care.light[p.light] || p.light;
  const fav = isFavorite(p.id);
  const addCartLabel = L.cta?.addCart || 'В кошик';
  const stockBadge = p.inStock
    ? `<span class="badge">${escapeHTML(L.sections.inStock)}</span>`
    : `<span class="badge badge--muted">${escapeHTML(L.sections.outOfStock)}</span>`;

  const heartLabel = fav ? L.cta.removeFavorite : L.cta.addFavorite;
  const potColor = p.careLevel === 'easy' ? '#c4a882' : '#b8956e';

  const plantImg = plantImageHtml(p, { className: 'pot-card__plant', width: 360, height: 420, size: 'card' });
  const previewSrc = getPlantImageUrl(p, 0, 'detail');
  const detailUrl = `plant.html?id=${encodeURIComponent(p.id)}`;
  const potDark = p.careLevel === 'easy' ? '#9a7d5c' : '#8a7048';
  const excerptRaw = p.shortDescription || '';
  const excerpt =
    excerptRaw.length > 80 ? `${excerptRaw.slice(0, 80).trim()}…` : excerptRaw;
  const openLabel = L.cta?.viewPlant || 'Відкрити картку рослини';
  const previewAria = `${L.a11y?.previewPhoto || 'Переглянути фото'}: ${p.name}`;
  const zoomHint = L.plant?.zoomHint || 'Фото — збільшити · картка — деталі';
  const plocale = priceLocale();

  return `
    <article
      class="pot-card pot-card--interactive reveal reveal-scale"
      data-id="${escapeHTML(p.id)}"
      data-detail-url="${detailUrl}"
      tabindex="0"
      aria-label="${escapeHTML(p.name)} — ${escapeHTML(openLabel)}"
      style="--pot-color:${potColor};--pot-dark:${potDark}"
    >
      <div class="pot-card__unit">
        <div class="pot-card__head">
          <span class="pot-card__rating">★ ${p.rating}</span>
          <button type="button" class="pot-card__fav ${fav ? 'is-active' : ''}" data-fav="${escapeHTML(p.id)}" aria-label="${escapeHTML(heartLabel)}" aria-pressed="${fav}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="${fav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <div class="pot-card__photo-zone">
          <div class="pot-card__planter" aria-hidden="true">
            <div class="pot-card__planter-shadow"></div>
            <div class="pot-card__planter-box">
              <div class="pot-card__planter-lip"></div>
              <div class="pot-card__planter-cavity">
                <div class="pot-card__planter-soil"></div>
                <button
                  type="button"
                  class="pot-card__plant-figure"
                  data-plant-preview
                  data-preview-src="${previewSrc.replace(/"/g, '&quot;')}"
                  data-preview-title="${escapeHTML(p.name)}"
                  data-preview-latin="${escapeHTML(p.latinName)}"
                  aria-label="${escapeHTML(previewAria)}"
                >${plantImg}</button>
              </div>
              <div class="pot-card__planter-face pot-card__planter-face--left"></div>
              <div class="pot-card__planter-face pot-card__planter-face--right"></div>
            </div>
            <div class="pot-card__planter-feet">
              <span></span><span></span>
            </div>
          </div>
          <span class="pot-card__zoom-hint" aria-hidden="true">${escapeHTML(zoomHint)}</span>
        </div>
        <div class="pot-card__saucer">
          <h3 class="pot-card__title">${escapeHTML(p.name)}</h3>
          <p class="pot-card__latin">${escapeHTML(p.latinName)}</p>
          ${excerpt ? `<p class="pot-card__excerpt">${escapeHTML(excerpt)}</p>` : ''}
          <p class="pot-card__price">${formatPrice(p.price, p.currency, plocale)}</p>
          <div class="pot-card__chips">
            <span class="badge">${escapeHTML(careLabel)}</span>
            ${stockBadge}
          </div>
          <button type="button" class="btn btn-primary btn-sm magnetic pot-card__cart" data-add-cart="${escapeHTML(p.id)}" ${p.inStock ? '' : 'disabled'}>${escapeHTML(addCartLabel)}</button>
        </div>
      </div>
    </article>
  `;
}

export function bindPlantCardOpen(container) {
  if (!container) return;

  const activate = (card, e) => {
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('[data-fav], [data-add-cart], .pot-card__cart, [data-plant-preview], .pot-card__plant-figure')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    const href = card.dataset.detailUrl;
    try {
      const u = new URL(href, window.location.href);
      const pid = u.searchParams.get('id');
      if (pid) rememberPlantNavId(pid);
    } catch {
      /* ignore */
    }
    if (typeof window.rlNavigate === 'function') {
      window.rlNavigate(href);
    } else {
      void import('./effects.js').then(({ navigateWithTransition }) => {
        navigateWithTransition(href);
      });
    }
  };

  container.querySelectorAll('.pot-card[data-detail-url]').forEach((card) => {
    if (card.dataset.openBound) return;
    card.dataset.openBound = '1';

    card.addEventListener('click', (e) => activate(card, e));
    card.addEventListener('keydown', (e) => {
      if (e.target.closest('[data-plant-preview]')) return;
      if (e.key === 'Enter' || e.key === ' ') activate(card, e);
    });
  });
}

export { bindPlantPhotoPreview } from './plant-preview.js';

export function bindFavoriteButtons(container) {
  container?.querySelectorAll('[data-fav]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.fav;
      const active = toggleFavorite(id);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', active ? 'currentColor' : 'none');
    });
  });
}

export function renderStars(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export function placeholderSVG(title = 'Plant') {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#0f1219" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#00ff9d" font-family="sans-serif" font-size="18">${title}</text></svg>`
  )}`;
}

export function onImageError(img, title) {
  img.addEventListener('error', () => {
    img.src = placeholderSVG(title);
  }, { once: true });
}
