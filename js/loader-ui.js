/**
 * Єдиний лоадер «горщик + стебло + квітка» для інтро, переходів і сіток
 */

export const INTRO_LOADER_KEY = 'rl-intro-done';

const VB = '0 0 100 120';
const CX = 50;
const BLOOM_Y = 36;

function escapeLabel(label) {
  return String(label)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** grow-* для інтро; flower-spinner__* для спінера (BEM) */
function loaderCls(prefix, name) {
  return prefix === 'flower-spinner' ? `${prefix}__${name}` : `${prefix}-${name}`;
}

function gradientDefs(id) {
  return `
    <defs>
      <linearGradient id="${id}-pot" x1="20" y1="70" x2="80" y2="112">
        <stop stop-color="#d4b896"/><stop offset="0.45" stop-color="#b8956e"/><stop offset="1" stop-color="#8b6f4a"/>
      </linearGradient>
      <linearGradient id="${id}-rim" x1="24" y1="62" x2="76" y2="72">
        <stop stop-color="#e8d4b8"/><stop offset="1" stop-color="#c4a882"/>
      </linearGradient>
      <linearGradient id="${id}-stem" x1="${CX}" y1="72" x2="${CX}" y2="${BLOOM_Y}">
        <stop stop-color="#5a9e75"/><stop offset="1" stop-color="#8fd4b0"/>
      </linearGradient>
    </defs>`;
}

function potBaseMarkup(gradId, classPrefix) {
  return `
    <ellipse class="${loaderCls(classPrefix, 'saucer')}" cx="${CX}" cy="112" rx="38" ry="7" fill="#3d3530" opacity="0.6"/>
    <path class="${loaderCls(classPrefix, 'pot')}" d="M20 112 L26 70 Q${CX} 56 74 70 L80 112 Z" fill="url(#${gradId}-pot)"/>
    <path class="${loaderCls(classPrefix, 'rim')}" d="M24 70 L76 70 L73 62 Q${CX} 52 27 62 Z" fill="url(#${gradId}-rim)"/>
    <ellipse class="${loaderCls(classPrefix, 'soil')}" cx="${CX}" cy="72" rx="22" ry="6" fill="#2e2620"/>
  `;
}

function petalsMarkup(classPrefix) {
  const fills = ['#a8e8c0', '#8fd4b0', '#b8f0d0', '#8fd4b0', '#a8e8c0'];
  return fills
    .map(
      (fill, i) => `
    <g class="${loaderCls(classPrefix, 'petal-wrap')} ${loaderCls(classPrefix, 'petal-wrap')}--${i + 1}">
      <ellipse class="${loaderCls(classPrefix, 'petal')}" cx="0" cy="-15" rx="7" ry="14" fill="${fill}"/>
    </g>`
    )
    .join('');
}

function bloomMarkup(classPrefix, withCenter = true) {
  const center = withCenter
    ? `<circle class="${loaderCls(classPrefix, 'flower-center')}" r="8" fill="#d4b896"/>
       <circle class="${loaderCls(classPrefix, 'flower-center-inner')}" r="4.5" fill="#c9a87c"/>`
    : `<circle class="${loaderCls(classPrefix, 'flower-center')}" cx="0" cy="0" r="8" fill="#d4b896"/>
       <circle class="${loaderCls(classPrefix, 'flower-center-inner')}" cx="0" cy="0" r="4.5" fill="#c9a87c"/>`;
  return `
    <g class="${loaderCls(classPrefix, 'bloom-anchor')}" transform="translate(${CX}, ${BLOOM_Y})">
      <g class="${loaderCls(classPrefix, 'bloom')}">
        ${petalsMarkup(classPrefix)}
        ${center}
      </g>
    </g>`;
}

/** Інтро: квітка росте з горщика */
export function growLoaderIntroMarkup() {
  return `
    <div class="grow-loader">
      <div class="grow-loader__card">
        <div class="grow-loader__glow" aria-hidden="true"></div>
        <div class="grow-loader__scene" aria-hidden="true">
          <svg class="grow-loader__svg" viewBox="${VB}" fill="none" xmlns="http://www.w3.org/2000/svg">
            ${gradientDefs('grow')}
            <g class="grow-loader__plant">
              ${potBaseMarkup('grow', 'grow')}
              <path class="grow-pot-shine" d="M34 95 L36 78 Q${CX} 72 62 82" stroke="rgba(255,255,255,0.2)" stroke-width="2.5" stroke-linecap="round"/>
              <path class="grow-stem" d="M${CX} 72 C${CX - 2} 58 ${CX + 2} 48 ${CX} ${BLOOM_Y}" stroke="url(#grow-stem)" stroke-width="4.5" stroke-linecap="round"/>
              <path class="grow-leaf grow-leaf--1" d="M${CX} 58 C${CX - 14} 55 ${CX - 20} 46 ${CX - 18} 40 C${CX - 8} 50 ${CX - 2} 56 ${CX} 58 Z" fill="#7ec9a0"/>
              <path class="grow-leaf grow-leaf--2" d="M${CX} 50 C${CX + 14} 47 ${CX + 20} 38 ${CX + 18} 32 C${CX + 8} 42 ${CX + 2} 48 ${CX} 50 Z" fill="#9de0b8"/>
              <g class="grow-bud-anchor" transform="translate(${CX}, ${BLOOM_Y})">
                <g class="grow-bud">
                  <circle class="grow-bud-core" r="5" fill="#5a9e75"/>
                </g>
              </g>
              ${bloomMarkup('grow')}
              <circle class="grow-spark grow-spark--1" cx="${CX - 14}" cy="22" r="2" fill="#8fd4b0" opacity="0"/>
              <circle class="grow-spark grow-spark--2" cx="${CX + 16}" cy="26" r="1.5" fill="#b8e6cc" opacity="0"/>
              <circle class="grow-spark grow-spark--3" cx="${CX}" cy="14" r="2" fill="#8fd4b0" opacity="0"/>
            </g>
          </svg>
        </div>
      </div>
      <div class="grow-loader__text">
        <p class="loader-brand">Root <em>&</em> Leaf</p>
        <p class="loader-hint">Квітка проростає з горщика…</p>
      </div>
    </div>`;
}

function spinnerOrbitMarkup() {
  return `
    <g class="flower-spinner__orbit-anchor" transform="translate(${CX}, ${BLOOM_Y})">
      <g class="flower-spinner__orbit">
        <circle class="flower-spinner__orbit-dot" cx="0" cy="-26" r="2.8" fill="#8fd4b0"/>
        <circle class="flower-spinner__orbit-dot" cx="22" cy="0" r="2.2" fill="#b8f0d0" opacity="0.75"/>
        <circle class="flower-spinner__orbit-dot" cx="0" cy="26" r="2" fill="#a8e8c0" opacity="0.55"/>
        <circle class="flower-spinner__orbit-dot" cx="-22" cy="0" r="2.2" fill="#8fd4b0" opacity="0.75"/>
      </g>
    </g>`;
}

/** Спінер для переходів і завантаження контенту */
export function flowerSpinnerHtml(size = '') {
  const mod = size ? ` flower-spinner--${size}` : '';
  return `
    <div class="flower-spinner${mod}" aria-hidden="true">
      <span class="flower-spinner__halo" aria-hidden="true"></span>
      <span class="flower-spinner__halo flower-spinner__halo--2" aria-hidden="true"></span>
      <svg class="flower-spinner__svg" viewBox="${VB}" fill="none" xmlns="http://www.w3.org/2000/svg">
        ${gradientDefs('spin')}
        <g class="flower-spinner__unit">
          ${potBaseMarkup('spin', 'flower-spinner')}
          <path class="flower-spinner__stem" d="M${CX} 72 C${CX - 3} 58 ${CX + 3} 48 ${CX} ${BLOOM_Y + 2}" stroke="url(#spin-stem)" stroke-width="4" stroke-linecap="round"/>
          <path class="flower-spinner__leaf" d="M${CX} 58 C${CX - 12} 55 ${CX - 17} 48 ${CX - 15} 43 C${CX - 6} 51 ${CX - 1} 56 ${CX} 58 Z" fill="#7ec9a0" opacity="0.9"/>
          ${bloomMarkup('flower-spinner', false)}
          ${spinnerOrbitMarkup()}
        </g>
      </svg>
    </div>`;
}

export function contentLoaderHtml(message = 'Завантаження…') {
  const safe = escapeLabel(message);
  return `
    <div class="content-loader" role="status" aria-live="polite">
      <div class="content-loader__visual">
        ${flowerSpinnerHtml('')}
      </div>
      <p class="content-loader__text">${safe}</p>
    </div>`;
}

export function mountContentLoader(el, message = 'Завантаження…') {
  if (!el) return;
  el.classList.add('is-content-loading');
  el.innerHTML = contentLoaderHtml(message);
}

export function routeTransitionInnerHtml(label = 'Переходимо…') {
  return `
    <div class="page-transition__inner">
      <div class="page-transition__visual">${flowerSpinnerHtml('lg')}</div>
      <p class="page-transition__label">${escapeLabel(label)}</p>
    </div>`;
}

export function routeLoaderInnerHtml(label = 'Завантаження сторінки…') {
  return `
    <div class="route-loader__inner">
      <div class="route-loader__visual">${flowerSpinnerHtml('lg')}</div>
      <p class="route-loader__label">${escapeLabel(label)}</p>
    </div>`;
}
