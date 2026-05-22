/**
 * Предпросмотр фото рослини з картки каталогу
 */

import { applyLocaleToDOM, t } from './i18n.js';

let modalReady = false;

function ensureModal() {
  if (modalReady || document.getElementById('plant-preview')) {
    modalReady = true;
    return;
  }

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div class="plant-preview" id="plant-preview" hidden aria-hidden="true">
      <div class="plant-preview__backdrop" data-preview-close tabindex="-1"></div>
      <div class="plant-preview__glow plant-preview__glow--1" aria-hidden="true"></div>
      <div class="plant-preview__glow plant-preview__glow--2" aria-hidden="true"></div>
      <div class="plant-preview__dialog" role="dialog" aria-modal="true" aria-labelledby="plant-preview-title">
        <div class="plant-preview__border" aria-hidden="true"></div>
        <button type="button" class="plant-preview__close" data-preview-close data-i18n-aria="a11y.close">
          <span class="plant-preview__close-ring" aria-hidden="true"></span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <span class="plant-preview__badge" data-i18n="a11y.preview">Перегляд</span>
        <div class="plant-preview__stage">
          <div class="plant-preview__vine plant-preview__vine--l" aria-hidden="true"></div>
          <div class="plant-preview__vine plant-preview__vine--r" aria-hidden="true"></div>
          <div class="plant-preview__frame">
            <div class="plant-preview__frame-inner">
              <div class="plant-preview__loader" aria-hidden="true"></div>
              <img class="plant-preview__img" id="plant-preview-img" src="" alt="" width="800" height="1000" decoding="async">
            </div>
            <div class="plant-preview__frame-lip" aria-hidden="true"></div>
          </div>
        </div>
        <div class="plant-preview__meta">
          <p class="plant-preview__latin" id="plant-preview-latin"></p>
          <h2 class="plant-preview__title" id="plant-preview-title"></h2>
          <p class="plant-preview__hint">Esc або клік поза вікном — закрити</p>
          <div class="plant-preview__actions">
            <a class="btn btn-primary plant-preview__detail magnetic" id="plant-preview-detail" href="#">
              <span>До сторінки товару</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
    `
  );

  const modal = document.getElementById('plant-preview');
  const img = document.getElementById('plant-preview-img');

  modal?.querySelectorAll('[data-preview-close]').forEach((el) => {
    el.addEventListener('click', closePlantPreview);
  });

  document.getElementById('plant-preview-detail')?.addEventListener('click', (e) => {
    const href = e.currentTarget.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    closePlantPreview();
    void import('./effects.js').then(({ navigateWithTransition }) => {
      navigateWithTransition(href);
    });
  });

  img?.addEventListener('load', () => {
    img.classList.add('is-ready');
    modal?.querySelector('.plant-preview__loader')?.classList.add('is-hidden');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closePlantPreview();
  });

  modalReady = true;
  const locale = t();
  if (locale) applyLocaleToDOM(locale);
}

window.addEventListener('rl:localechange', () => {
  const locale = t();
  if (locale) applyLocaleToDOM(locale);
});

export function openPlantPreview({ src, title, latin, detailUrl }) {
  if (!src) return;
  ensureModal();

  const modal = document.getElementById('plant-preview');
  const img = document.getElementById('plant-preview-img');
  const titleEl = document.getElementById('plant-preview-title');
  const latinEl = document.getElementById('plant-preview-latin');
  const link = document.getElementById('plant-preview-detail');
  const loader = modal?.querySelector('.plant-preview__loader');

  if (!modal || !img) return;

  img.classList.remove('is-ready');
  loader?.classList.remove('is-hidden');

  const markReady = () => {
    img.classList.add('is-ready');
    loader?.classList.add('is-hidden');
  };

  img.src = src;
  img.alt = title || 'Рослина';
  img.onerror = () => {
    img.onerror = null;
    img.src = 'assets/images/placeholder.svg';
    markReady();
  };
  if (img.complete && img.naturalWidth > 0) markReady();

  if (titleEl) titleEl.textContent = title || '';
  if (latinEl) {
    latinEl.textContent = latin || '';
    latinEl.hidden = !latin;
  }
  if (link && detailUrl) {
    link.href = detailUrl;
    link.hidden = false;
  } else if (link) {
    link.hidden = true;
  }

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    modal.classList.add('is-open');
  });
  document.body.classList.add('has-plant-preview');
  modal.querySelector('.plant-preview__close')?.focus();
}

export function closePlantPreview() {
  const modal = document.getElementById('plant-preview');
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('has-plant-preview');

  const img = document.getElementById('plant-preview-img');
  window.setTimeout(() => {
    if (!modal.classList.contains('is-open')) {
      modal.hidden = true;
      if (img) {
        img.src = '';
        img.classList.remove('is-ready');
      }
    }
  }, 420);
}

export function bindPlantPhotoPreview(container) {
  if (!container) return;

  container.querySelectorAll('[data-plant-preview]').forEach((trigger) => {
    if (trigger.dataset.previewBound) return;
    trigger.dataset.previewBound = '1';

    const open = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPlantPreview({
        src: trigger.dataset.previewSrc,
        title: trigger.dataset.previewTitle,
        latin: trigger.dataset.previewLatin,
        detailUrl: trigger.closest('.pot-card')?.dataset.detailUrl,
      });
    };

    trigger.addEventListener('click', open);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') open(e);
    });
  });
}
