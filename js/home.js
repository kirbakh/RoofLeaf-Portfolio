import {
  fetchJSON,
  createPlantCard,
  bindFavoriteButtons,
  bindPlantCardOpen,
  bindPlantPhotoPreview,
  escapeHTML,
  renderStars,
  resolveMediaUrl,
  getArticleCoverUrl,
} from './utils.js';
import { mountContentLoader } from './loader-ui.js';
import { t, loadLocale } from './i18n.js';
import { bindCartButtons } from './cart.js';
import { onPageReady } from './page-boot.js';
async function runHomeEnhancements() {
  try {
    const { initHomeEnhancements } = await import('./enhancements.js');
    initHomeEnhancements();
  } catch (e) {
    console.error('home enhancements:', e);
  }
}
import {
  localizePlant,
  localizeArticle,
  localizeReview,
  localizeGalleryItem,
  tagLabel,
  ensureContentEn,
} from './content-i18n.js';

async function loadGallery() {
  const grid = document.getElementById('photo-mosaic');
  if (!grid) return;

  let locale = t();
  if (!locale) locale = await loadLocale();
  await ensureContentEn();

  mountContentLoader(grid, locale?.sections?.loadingGallery || 'Завантаження галереї…');

  try {
    const items = await fetchJSON('data/gallery.json');
    grid.innerHTML = items
      .map((item, i) => {
        const g = localizeGalleryItem(item, i);
        return `
      <figure class="photo-mosaic__item reveal reveal-scale img-reveal tilt-card" style="--mosaic-delay:${i * 60}ms">
        <img src="${resolveMediaUrl(g.src, 'card')}" alt="${escapeHTML(g.alt)}" width="400" height="500" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">
        <figcaption>${escapeHTML(g.caption)}</figcaption>
      </figure>
    `;
      })
      .join('');
    window.reinitEffects?.(grid);
  } catch (e) {
    console.error('gallery:', e);
  }
}

async function loadHome() {
  const popularEl = document.getElementById('popular-plants');
  const articlesEl = document.getElementById('home-articles');
  const reviewsEl = document.getElementById('home-reviews');

  let locale = t();
  if (!locale) locale = await loadLocale();
  await ensureContentEn();
  const errMsg = locale?.sections?.loadError || 'Не вдалося завантажити';

  const loadingMsg = locale?.sections?.loading || 'Завантаження…';
  [popularEl, articlesEl, reviewsEl].forEach((el) => {
    if (el) mountContentLoader(el, loadingMsg);
  });

  try {
    const [plants, articles, reviews] = await Promise.all([
      fetchJSON('data/plants.json'),
      fetchJSON('data/articles.json'),
      fetchJSON('data/reviews.json'),
    ]);

    if (popularEl) {
      const popular = [...plants]
        .filter((p) => p.inStock)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4);
      popularEl.innerHTML = popular.map((p) => createPlantCard(p, locale)).join('');
      popularEl.classList.add('stagger-grid');
      bindFavoriteButtons(popularEl);
      bindCartButtons(popularEl);
      bindPlantCardOpen(popularEl);
      bindPlantPhotoPreview(popularEl);
      window.reinitEffects?.(popularEl);
    }

    if (articlesEl) {
      const top = articles.slice(0, 3);
      articlesEl.innerHTML = top
        .map((a) => {
          const art = localizeArticle(a);
          return `
        <article class="journal-card glass-card reveal reveal-scale">
          <a href="journal.html#${escapeHTML(art.id)}" class="journal-card__link">
            <div class="journal-card__media zoom-media">
              <img src="${getArticleCoverUrl(art.cover)}" alt="" loading="lazy" width="400" height="250" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">
              <span class="journal-card__tag">${escapeHTML(tagLabel(art.tag, locale))}</span>
            </div>
            <div class="journal-card__body">
              <h3>${escapeHTML(art.title)}</h3>
              <p>${escapeHTML(art.excerpt)}</p>
              <div class="journal-card__foot"><span>${art.readMinutes} ${locale.sections.minutes}</span><span class="journal-card__cta">${escapeHTML(locale.cta.readArticle)}</span></div>
            </div>
          </a>
        </article>
      `;
        })
        .join('');
      window.reinitEffects?.(articlesEl);
    }

    if (reviewsEl) {
      const ratingLabel = locale?.a11y?.rating || 'Рейтинг';
      reviewsEl.innerHTML = reviews
        .slice(0, 4)
        .map((r, i) => {
          const rev = localizeReview(r, i);
          return `
        <blockquote class="review-card glass-card reveal reveal-scale">
          <div class="review-card__stars" aria-label="${escapeHTML(ratingLabel)} ${r.rating}">${renderStars(r.rating)}</div>
          <p>«${escapeHTML(rev.text)}»</p>
          <footer>
            <div class="review-card__author">${escapeHTML(rev.author)}</div>
            <div class="review-card__city">${escapeHTML(rev.city)}</div>
          </footer>
        </blockquote>
      `;
        })
        .join('');
      window.reinitEffects?.(reviewsEl);
      runHomeEnhancements();
    }
  } catch (e) {
    console.error(e);
    [popularEl, articlesEl, reviewsEl].forEach((el) => {
      if (el) {
        el.innerHTML = `<div class="error-state" role="alert"><p>${escapeHTML(errMsg)}</p></div>`;
      }
    });
  }
}

window.addEventListener('rl:localechange', () => {
  loadGallery();
  loadHome();
});
onPageReady(() => {
  loadGallery();
  loadHome();
  runHomeEnhancements();
});
