import {
  fetchJSON,
  createPlantCard,
  bindFavoriteButtons,
  bindPlantCardOpen,
  bindPlantPhotoPreview,
  debounce,
  escapeHTML,
} from './utils.js';
import { mountContentLoader } from './loader-ui.js';
import { loadLocale, t, getLang } from './i18n.js';
import { ensureContentEn, priceLocale } from './content-i18n.js';
import { bindCartButtons } from './cart.js';
import { onPageReady } from './page-boot.js';

let allPlants = [];
let filtersBound = false;
const state = {
  search: '',
  light: [],
  care: [],
  size: [],
  maxPrice: 99999,
  sort: 'ratingDesc',
};

function getFilters() {
  const readChips = (name) =>
    [...document.querySelectorAll(`[data-filter="${name}"].is-active`)].map((el) => el.dataset.value);

  state.light = readChips('light');
  state.care = readChips('care');
  state.size = readChips('size');
  const priceEl = document.getElementById('price-range');
  if (priceEl) state.maxPrice = Number(priceEl.value);
  const sortEl = document.getElementById('sort-select');
  if (sortEl) state.sort = sortEl.value;
  const searchEl = document.getElementById('search-input');
  if (searchEl) state.search = searchEl.value.trim().toLowerCase();
}

function filterPlants() {
  let list = [...allPlants];
  if (state.search) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(state.search) ||
        p.latinName.toLowerCase().includes(state.search) ||
        p.tags.some((tag) => tag.toLowerCase().includes(state.search))
    );
  }
  if (state.light.length) list = list.filter((p) => state.light.includes(p.light));
  if (state.care.length) list = list.filter((p) => state.care.includes(p.careLevel));
  if (state.size.length) list = list.filter((p) => state.size.includes(p.size));
  list = list.filter((p) => p.price <= state.maxPrice);

  switch (state.sort) {
    case 'priceAsc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'priceDesc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'nameAsc': {
      const collator = getLang() === 'en' ? 'en' : 'uk';
      list.sort((a, b) => a.name.localeCompare(b.name, collator));
      break;
    }
    default:
      list.sort((a, b) => b.rating - a.rating);
  }
  return list;
}

function initFiltersPanel() {
  const wrap = document.querySelector('.filters-wrap');
  if (!wrap) return;
  wrap.open = window.matchMedia('(min-width: 960px)').matches;
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => {
    wrap.open = e.matches;
  });
}

async function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  let locale = t();
  if (!locale) locale = await loadLocale();

  const filtered = filterPlants();
  const countEl = document.getElementById('catalog-count');
  if (countEl) countEl.textContent = `${filtered.length} / ${allPlants.length}`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state is-visible"><p>${escapeHTML(locale?.sections?.emptyCatalog || 'Нічого не знайдено')}</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map((p) => createPlantCard(p, locale)).join('');
  bindFavoriteButtons(grid);
  bindCartButtons(grid);
  bindPlantCardOpen(grid);
  bindPlantPhotoPreview(grid);
  window.reinitEffects?.(grid);
}

function bindFilters() {
  if (filtersBound) return;
  filtersBound = true;

  document.querySelectorAll('[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('is-active');
      getFilters();
      renderCatalog();
    });
  });

  document.getElementById('price-range')?.addEventListener('input', (e) => {
    const label = document.getElementById('price-label');
    if (label) label.textContent = `${e.target.value} ₴`;
    getFilters();
    renderCatalog();
  });

  document.getElementById('sort-select')?.addEventListener('change', () => {
    getFilters();
    renderCatalog();
  });

  const search = document.getElementById('search-input');
  if (search) {
    search.addEventListener('input', debounce(() => {
      getFilters();
      renderCatalog();
    }, 280));
  }

  document.getElementById('filter-reset')?.addEventListener('click', () => {
    document.querySelectorAll('[data-filter].is-active').forEach((c) => c.classList.remove('is-active'));
    const price = document.getElementById('price-range');
    if (price) {
      price.value = price.max;
      document.getElementById('price-label').textContent = `${price.value} ₴`;
    }
    if (search) search.value = '';
    state.search = '';
    state.light = [];
    state.care = [];
    state.size = [];
    getFilters();
    renderCatalog();
  });
}

function updateFilterLabels() {
  const locale = t();
  if (!locale) return;
  document.querySelectorAll('[data-filter="light"]').forEach((btn) => {
    btn.textContent = locale.care.light[btn.dataset.value] || btn.dataset.value;
  });
  document.querySelectorAll('[data-filter="care"]').forEach((btn) => {
    btn.textContent = btn.dataset.value === 'easy' ? locale.care.easy : locale.care.medium;
  });
  document.querySelectorAll('[data-filter="size"]').forEach((btn) => {
    btn.textContent = locale.care.size[btn.dataset.value] || btn.dataset.value;
  });
}

async function initCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  let locale = t();
  if (!locale) locale = await loadLocale();
  await ensureContentEn();
  mountContentLoader(grid, locale?.sections?.loadingPlants || 'Завантаження рослин…');
  const errMsg = locale?.sections?.loadError || 'Не вдалося завантажити';

  try {
    allPlants = await fetchJSON('data/plants.json');
    const maxPrice = Math.max(...allPlants.map((p) => p.price));
    const priceEl = document.getElementById('price-range');
    if (priceEl) {
      priceEl.max = maxPrice;
      priceEl.value = maxPrice;
      const label = document.getElementById('price-label');
      if (label) label.textContent = `${maxPrice} ₴`;
      state.maxPrice = maxPrice;
    }
    initFiltersPanel();
    bindFilters();
    updateFilterLabels();
    await renderCatalog();
  } catch (e) {
    console.error('catalog:', e);
    const retry = locale?.sections?.retry || 'Спробувати знову';
    grid.innerHTML = `<div class="error-state is-visible" role="alert"><p>${escapeHTML(errMsg)}</p><button type="button" class="btn btn-secondary" onclick="location.reload()">${escapeHTML(retry)}</button></div>`;
  }
}

window.addEventListener('rl:localechange', () => {
  updateFilterLabels();
  renderCatalog();
});

onPageReady(initCatalog);
