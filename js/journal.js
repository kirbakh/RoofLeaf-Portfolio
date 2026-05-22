import { fetchJSON, escapeHTML, getArticleCoverUrl } from './utils.js';
import { mountContentLoader } from './loader-ui.js';
import { loadLocale, t, getLang } from './i18n.js';
import { onPageReady } from './page-boot.js';
import { localizeArticle, tagLabel, ensureContentEn } from './content-i18n.js';
import {
  formatArticleDate,
  sortArticlesByDate,
  pickFeaturedArticle,
  countUniqueTags,
} from './journal-utils.js';

let articles = [];
let tagsBound = false;

function setReadingMode(isReading) {
  document.querySelector('.journal-page')?.classList.toggle('is-reading', isReading);
}

function cardHtml(art, locale) {
  const dateStr = formatArticleDate(art.date, getLang());
  return `
    <article class="journal-card glass-card reveal reveal-scale" id="${escapeHTML(art.id)}">
      <a href="journal.html#${escapeHTML(art.id)}" class="journal-card__link">
        <div class="journal-card__media zoom-media">
          <img src="${getArticleCoverUrl(art.cover)}" alt="" loading="lazy" width="400" height="260" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">
          <span class="journal-card__tag">${escapeHTML(tagLabel(art.tag, locale))}</span>
          <span class="journal-card__read">${art.readMinutes} ${escapeHTML(locale.sections.minutes)}</span>
        </div>
        <div class="journal-card__body">
          <h3>${escapeHTML(art.title)}</h3>
          <p>${escapeHTML(art.excerpt)}</p>
          <div class="journal-card__foot">
            <span class="journal-card__date">${escapeHTML(dateStr)}</span>
            <span class="journal-card__cta">${escapeHTML(locale.cta.readArticle)}</span>
          </div>
        </div>
      </a>
    </article>
  `;
}

function renderFeatured(filtered, filterTag, locale) {
  const featuredEl = document.getElementById('journal-featured');
  if (!featuredEl) return;

  const raw = pickFeaturedArticle(filtered, filterTag);
  if (!raw) {
    featuredEl.hidden = true;
    featuredEl.innerHTML = '';
    return;
  }

  const art = localizeArticle(raw);
  const dateStr = formatArticleDate(art.date, getLang());
  const label = locale.journal?.featuredLabel || 'Рекомендуємо';

  featuredEl.hidden = false;
  featuredEl.innerHTML = `
    <a href="journal.html#${escapeHTML(art.id)}" class="journal-featured__card glass-card reveal reveal-blur">
      <div class="journal-featured__media zoom-media">
        <img src="${getArticleCoverUrl(art.cover, 'hero')}" alt="" loading="lazy" width="800" height="500" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">
        <span class="journal-featured__badge">${escapeHTML(label)}</span>
      </div>
      <div class="journal-featured__body">
        <span class="journal-featured__tag">${escapeHTML(tagLabel(art.tag, locale))}</span>
        <h2>${escapeHTML(art.title)}</h2>
        <p class="journal-featured__excerpt">${escapeHTML(art.excerpt)}</p>
        <div class="journal-featured__meta">
          <span>${art.readMinutes} ${escapeHTML(locale.sections.minutes)}</span>
          <span>${escapeHTML(dateStr)}</span>
          <span class="journal-featured__cta">${escapeHTML(locale.cta.readArticle)}</span>
        </div>
      </div>
    </a>
  `;
  window.reinitEffects?.(featuredEl);
}

function updateHeroStats(filtered, locale) {
  const countEl = document.getElementById('journal-stat-count');
  const topicsEl = document.getElementById('journal-stat-topics');
  if (countEl) countEl.textContent = String(filtered.length);
  if (topicsEl) topicsEl.textContent = String(countUniqueTags(articles));
}

async function renderList(filterTag = 'all') {
  const list = document.getElementById('journal-list');
  if (!list) return;

  let locale = t();
  if (!locale) locale = await loadLocale();

  const filtered =
    filterTag === 'all' ? sortArticlesByDate(articles) : sortArticlesByDate(articles.filter((a) => a.tag === filterTag));

  updateHeroStats(filtered, locale);
  renderFeatured(articles, filterTag, locale);

  if (!filtered.length) {
    list.classList.remove('is-content-loading');
    list.innerHTML = `<p class="empty-state is-visible">${escapeHTML(locale?.sections?.emptyJournal || 'Статей не знайдено')}</p>`;
    return;
  }

  const featuredId = pickFeaturedArticle(articles, filterTag)?.id;
  const gridItems =
    filterTag === 'all' && featuredId ? filtered.filter((a) => a.id !== featuredId) : filtered;

  list.innerHTML = gridItems
    .map((a) => cardHtml(localizeArticle(a), locale))
    .join('');

  list.classList.remove('is-content-loading');
  window.reinitEffects?.(list);
}

function relatedArticlesHtml(currentId, locale) {
  const current = articles.find((a) => a.id === currentId);
  if (!current) return '';

  const related = sortArticlesByDate(
    articles.filter((a) => a.id !== currentId && a.tag === current.tag)
  ).slice(0, 2);

  if (!related.length) return '';

  const title = locale.journal?.relatedTitle || 'Читайте також';
  const items = related
    .map((raw) => {
      const art = localizeArticle(raw);
      return `
      <a href="journal.html#${escapeHTML(art.id)}" class="article-related__link glass-card">
        <strong>${escapeHTML(art.title)}</strong>
        <span>${art.readMinutes} ${escapeHTML(locale.sections.minutes)}</span>
      </a>
    `;
    })
    .join('');

  return `
    <aside class="article-related">
      <h2>${escapeHTML(title)}</h2>
      <div class="article-related__grid">${items}</div>
    </aside>
  `;
}

function renderArticle(id) {
  const detail = document.getElementById('article-detail');
  const locale = t() || {
    sections: { minutes: 'хв читання', allArticles: 'Усі статті' },
    cta: { readArticle: 'Читати →' },
    journal: { relatedTitle: 'Читайте також' },
  };
  const raw = articles.find((a) => a.id === id);
  if (!detail || !raw) {
    setReadingMode(false);
    if (detail) detail.hidden = true;
    return;
  }

  const article = localizeArticle(raw);
  const dateStr = formatArticleDate(article.date, getLang());

  setReadingMode(true);
  detail.hidden = false;
  detail.innerHTML = `
    <div class="journal-article-wrap container">
      <article class="article-full reveal reveal-blur">
        <a href="journal.html" class="btn btn-ghost article-full__back">← ${escapeHTML(locale.sections.allArticles)}</a>
        <header class="article-hero">
          <img src="${getArticleCoverUrl(article.cover, 'hero')}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">
          <div class="article-hero__overlay" aria-hidden="true"></div>
          <div class="article-hero__content">
            <span class="article-hero__tag">${escapeHTML(tagLabel(article.tag, locale))}</span>
            <h1 class="article-hero__title">${escapeHTML(article.title)}</h1>
            <p class="article-hero__meta">${article.readMinutes} ${escapeHTML(locale.sections.minutes)} · ${escapeHTML(dateStr)}</p>
          </div>
        </header>
        <div class="article-full__body">${article.body.join('')}</div>
        ${relatedArticlesHtml(id, locale)}
      </article>
    </div>
  `;
  detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.reinitEffects?.(detail);
}

function bindTags() {
  const tagsEl = document.getElementById('journal-tags');
  if (!tagsEl || !articles.length) return;

  const tags = ['all', ...new Set(articles.map((a) => a.tag))];
  const locale = t() || { sections: { allArticles: 'Усі статті' }, tags: { all: 'Усі' } };

  tagsEl.innerHTML = tags
    .map(
      (tag) =>
        `<button type="button" class="chip ${tag === 'all' ? 'is-active' : ''}" data-tag="${escapeHTML(tag)}">${escapeHTML(tagLabel(tag, locale))}</button>`
    )
    .join('');

  if (tagsBound) return;
  tagsBound = true;

  tagsEl.querySelectorAll('[data-tag]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      tagsEl.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
      btn.classList.add('is-active');
      await renderList(btn.dataset.tag);
      const detail = document.getElementById('article-detail');
      if (detail) {
        detail.hidden = true;
        detail.innerHTML = '';
      }
      setReadingMode(false);
      history.replaceState(null, '', 'journal.html');
    });
  });
}

async function initJournal() {
  const list = document.getElementById('journal-list');
  if (!list) return;

  let locale = t();
  if (!locale) locale = await loadLocale();
  await ensureContentEn();
  mountContentLoader(list, locale?.sections?.loadingArticles || 'Завантаження статей…');
  const errMsg = locale?.sections?.loadError || 'Помилка';

  try {
    articles = await fetchJSON('data/articles.json');
    bindTags();
    await renderList();

    const hash = window.location.hash.replace('#', '');
    if (hash) renderArticle(hash);
    else setReadingMode(false);
  } catch (e) {
    console.error('journal:', e);
    list.classList.remove('is-content-loading');
    list.innerHTML = `<div class="error-state is-visible"><p>${escapeHTML(errMsg)}</p></div>`;
  }
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) renderArticle(hash);
  else {
    setReadingMode(false);
    const detail = document.getElementById('article-detail');
    if (detail) {
      detail.hidden = true;
      detail.innerHTML = '';
    }
  }
});

window.addEventListener('rl:localechange', async () => {
  tagsBound = false;
  bindTags();
  await renderList(document.querySelector('#journal-tags .chip.is-active')?.dataset.tag || 'all');
  const hash = window.location.hash.replace('#', '');
  if (hash) renderArticle(hash);
});

onPageReady(initJournal);
