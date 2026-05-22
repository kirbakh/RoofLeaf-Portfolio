import {
  fetchJSON,
  createPlantCard,
  bindFavoriteButtons,
  bindPlantCardOpen,
  bindPlantPhotoPreview,
  escapeHTML,
  formatPrice,
  getPlantIdFromUrl,
  getQueryParam,
  clearPlantNavId,
  getPlantImageUrl,
  onImageError,
} from './utils.js';
import { mountContentLoader } from './loader-ui.js';
import { t } from './i18n.js';
import { bindCartButtons } from './cart.js';
import { onPageReady } from './page-boot.js';
import { localizePlant, priceLocale, ensureContentEn } from './content-i18n.js';
import { initPlantPage } from './plant-page.js';

let loadToken = 0;

function waitForLocale() {
  return new Promise((resolve) => {
    const locale = t();
    if (locale) {
      resolve(locale);
      return;
    }
    window.addEventListener('rl:ready', () => resolve(t()), { once: true });
  });
}

async function loadPlant() {
  const token = ++loadToken;
  const root = document.getElementById('plant-root');
  if (!root) return;

  const locale = await waitForLocale();
  if (token !== loadToken) return;

  await ensureContentEn();
  if (token !== loadToken) return;

  const id = getPlantIdFromUrl();
  const notFound = locale?.sections?.notFound || 'Рослину не знайдено';
  const errMsg = locale?.sections?.loadError || 'Помилка';
  const plocale = priceLocale();
  const plantL = locale?.plant || {};

  if (id) {
    mountContentLoader(root, locale?.sections?.loadingPlant || 'Завантаження рослини…');
  }

  if (!id) {
    root.innerHTML = `
      <div class="not-found-page container">
        <h1>${escapeHTML(notFound)}</h1>
        <p>${escapeHTML(plantL.missingId || 'Оберіть рослину в каталозі.')}</p>
        <a href="catalog.html" class="btn btn-primary">${escapeHTML(locale?.cta?.catalog || 'До каталогу')}</a>
      </div>`;
    return;
  }

  try {
    const plants = await fetchJSON('data/plants.json');
    if (token !== loadToken) return;

    const raw = plants.find((p) => p.id === id);

    if (!raw) {
      document.title = `${notFound} — Root & Leaf`;
      root.innerHTML = `
        <div class="not-found-page container">
          <h1>${escapeHTML(notFound)}</h1>
          <p>ID: ${escapeHTML(id)}</p>
          <a href="catalog.html" class="btn btn-primary">${escapeHTML(locale?.cta?.catalog || 'До каталогу')}</a>
        </div>`;
      return;
    }

    clearPlantNavId();
    if (!getQueryParam('id')) {
      try {
        const u = new URL(window.location.href);
        u.searchParams.set('id', id);
        window.history.replaceState({}, '', u.pathname + u.search);
      } catch {
        /* ignore */
      }
    }

    const plant = localizePlant(raw);
    document.title = `${plant.name} — Root & Leaf`;

    const careLabel = plant.careLevel === 'easy' ? locale.care.easy : locale.care.medium;
    const lightLabel = locale.care.light[plant.light];
    const sizeLabel = locale.care.size[plant.size];
    const paragraphs = plant.description.split('\n\n').map((p) => `<p>${escapeHTML(p)}</p>`).join('');
    const mainSrc = getPlantImageUrl(plant, 0, 'detail');
    const photoLabel = locale?.a11y?.photo || 'Фото';
    const thumbs = plant.images
      .map((_, i) => {
        const thumbSrc = getPlantImageUrl(plant, i, 'thumb');
        const fullSrc = getPlantImageUrl(plant, i, 'detail');
        return `<button type="button" class="${i === 0 ? 'is-active' : ''}" data-thumb="${escapeHTML(fullSrc)}" aria-label="${escapeHTML(photoLabel)} ${i + 1}"><img src="${thumbSrc}" alt="" width="52" height="52" loading="lazy" decoding="async"></button>`;
      })
      .join('');
    const highlights = (plant.highlights || [])
      .map((h) => `<span class="badge">${escapeHTML(h)}</span>`)
      .join('');

    const breadcrumb = `
      <nav class="breadcrumb container" aria-label="${escapeHTML(locale?.a11y?.breadcrumb || 'Breadcrumb')}">
        <a href="index.html">${escapeHTML(locale.nav.home)}</a> /
        <a href="catalog.html">${escapeHTML(locale.nav.catalog)}</a> /
        <span aria-current="page">${escapeHTML(plant.name)}</span>
      </nav>`;

    const careEyebrow = plantL.careEyebrow || 'Гайд по догляду';
    const relatedEyebrow = plantL.relatedEyebrow || 'Колекція';

    root.innerHTML = `
      ${breadcrumb}
      <div class="container plant-detail">
        <div class="plant-scene" aria-hidden="true">
          <span class="plant-scene__orb"></span>
          <span class="plant-scene__orb plant-scene__orb--2"></span>
          <span class="plant-scene__leaf plant-scene__leaf--1"></span>
          <span class="plant-scene__leaf plant-scene__leaf--2"></span>
          <span class="plant-scene__leaf plant-scene__leaf--3"></span>
        </div>
        <div class="plant-hero">
          <div class="plant-hero__gallery glass-card reveal reveal-left tilt-card">
            <div class="plant-hero__frame spotlight-zone zoom-media">
              <span class="plant-hero__vine" aria-hidden="true"></span>
              <figure class="plant-hero__figure img-reveal">
                <img id="plant-main-img" class="plant-hero__img" src="${mainSrc}" alt="${escapeHTML(plant.name)}" width="480" height="600" loading="eager" decoding="async">
              </figure>
            </div>
            <div class="plant-hero__thumbs" role="list">${thumbs}</div>
          </div>
          <div class="plant-hero__panel glass-card reveal reveal-right tilt-card">
            <header class="plant-hero__head plant-reveal" data-reveal-delay="80">
              <p class="plant-hero__latin">${escapeHTML(plant.latinName)}</p>
              <h1 class="plant-hero__title text-gradient-animated">${escapeHTML(plant.name)}</h1>
            </header>
            <div class="plant-hero__badges plant-card__meta plant-reveal" data-reveal-delay="120">
              <span class="badge">${escapeHTML(careLabel)}</span>
              <span class="badge badge--warm">${escapeHTML(lightLabel)}</span>
              <span class="badge badge--muted">${escapeHTML(sizeLabel)}</span>
              <span class="badge">${plant.inStock ? escapeHTML(locale.sections.inStock) : escapeHTML(locale.sections.outOfStock)}</span>
            </div>
            <div class="plant-hero__pricing plant-reveal" data-reveal-delay="160">
              <p class="plant-hero__price">${formatPrice(plant.price, plant.currency, plocale)}</p>
              <p class="plant-hero__rating"><span class="plant-hero__star" aria-hidden="true">★</span> ${plant.rating} · ${plant.reviewCount} ${escapeHTML(plantL.reviews || 'відгуків')} · ${escapeHTML(plant.origin || '')}</p>
            </div>
            <p class="plant-hero__lede plant-reveal" data-reveal-delay="200">${escapeHTML(plant.shortDescription)}</p>
            <dl class="plant-hero__specs plant-reveal" data-reveal-delay="240">
              <div class="plant-hero__spec"><dt>${escapeHTML(plantL.pot || 'Горщик')}</dt><dd>${escapeHTML(plant.potSize || '—')}</dd></div>
              <div class="plant-hero__spec"><dt>${escapeHTML(plantL.size || 'Розмір')}</dt><dd>${escapeHTML(sizeLabel)}</dd></div>
              <div class="plant-hero__spec"><dt>${escapeHTML(plantL.light || 'Світло')}</dt><dd>${escapeHTML(lightLabel)}</dd></div>
              <div class="plant-hero__spec"><dt>${escapeHTML(plantL.care || 'Догляд')}</dt><dd>${escapeHTML(careLabel)}</dd></div>
            </dl>
            ${highlights ? `<div class="plant-hero__highlights plant-reveal" data-reveal-delay="280">${highlights}</div>` : ''}
            <div class="plant-hero__care plant-reveal" data-reveal-delay="320">
              <div class="plant-hero__care-item">
                <span class="plant-hero__care-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></span>
                <div><span class="plant-hero__care-label">${escapeHTML(plantL.watering || 'Полив')}</span><span class="plant-hero__care-value">${escapeHTML(plant.watering)}</span></div>
              </div>
              <div class="plant-hero__care-item">
                <span class="plant-hero__care-icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3"/></svg></span>
                <div><span class="plant-hero__care-label">${escapeHTML(plantL.humidity || 'Вологість')}</span><span class="plant-hero__care-value">${escapeHTML(plant.humidity)}</span></div>
              </div>
            </div>
            <div class="plant-hero__actions plant-reveal" data-reveal-delay="360">
              <button type="button" class="btn btn-primary magnetic" data-add-cart="${escapeHTML(plant.id)}" ${plant.inStock ? '' : 'disabled'}>${plant.inStock ? escapeHTML(locale.cta.addCart) : escapeHTML(locale.sections.outOfStock)}</button>
              <a href="checkout.html" class="btn btn-secondary">${escapeHTML(locale.cta.checkout)}</a>
            </div>
          </div>
        </div>
        <section class="section plant-section plant-section--care">
          <div class="section-header reveal">
            <div>
              <span class="section-eyebrow">${escapeHTML(careEyebrow)}</span>
              <h2 class="section-title scroll-driven">${escapeHTML(locale.sections.care)}</h2>
            </div>
          </div>
          <div class="plant-care-prose article-full__body">${paragraphs}</div>
          <div class="plant-tags plant-card__meta">${plant.tags.map((tag) => `<span class="badge">${escapeHTML(tag)}</span>`).join(' ')}</div>
        </section>
        <section class="section plant-section plant-section--related">
          <div class="section-header reveal">
            <div>
              <span class="section-eyebrow">${escapeHTML(relatedEyebrow)}</span>
              <h2 class="section-title scroll-driven">${escapeHTML(locale.sections.related)}</h2>
            </div>
          </div>
          <div class="plants-grid" id="related-plants"></div>
        </section>
      </div>`;

    const img = document.getElementById('plant-main-img');
    if (img) onImageError(img, plant.name);

    const related = plants
      .filter((p) => p.id !== plant.id && (p.careLevel === plant.careLevel || p.light === plant.light))
      .slice(0, 3);
    const relatedEl = document.getElementById('related-plants');
    if (relatedEl) {
      relatedEl.innerHTML = related.map((p) => createPlantCard(p, locale)).join('');
      bindFavoriteButtons(relatedEl);
      bindPlantCardOpen(relatedEl);
      bindPlantPhotoPreview(relatedEl);
      relatedEl.classList.add('stagger-grid');
      window.reinitEffects?.(relatedEl);
    }
    bindCartButtons(document.getElementById('plant-root'));
    const plantRoot = document.getElementById('plant-root');
    window.reinitEffects?.(plantRoot);
    initPlantPage(plantRoot);
  } catch (e) {
    console.error('plant:', e);
    if (token !== loadToken) return;
    root.innerHTML = `<div class="error-state container" role="alert"><p>${escapeHTML(errMsg)}</p><button type="button" class="btn btn-secondary" onclick="location.reload()">${escapeHTML(locale?.plant?.retry || 'Спробувати знову')}</button></div>`;
  }
}

window.addEventListener('rl:localechange', () => {
  loadPlant();
});

onPageReady(loadPlant);
