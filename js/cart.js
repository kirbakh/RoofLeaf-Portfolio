/**
 * Mock cart + drawer + checkout helpers
 */

import { fetchJSON, formatPrice, escapeHTML, plantImageHtml } from './utils.js';
import { t } from './i18n.js';
import { applyLocaleToDOM } from './i18n.js';
import { localizePlant, priceLocale } from './content-i18n.js';

export const CART_KEY = 'rl-cart';

let plantsCache = null;

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('rl:cartchange'));
}

export function getCartCount() {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

export async function getPlantsMap() {
  if (!plantsCache) plantsCache = await fetchJSON('data/plants.json');
  return Object.fromEntries(plantsCache.map((p) => [p.id, p]));
}

export async function addToCart(plantId, qty = 1) {
  const map = await getPlantsMap();
  const plant = map[plantId];
  if (!plant?.inStock) return false;

  const cart = getCart();
  const item = cart.find((i) => i.id === plantId);
  if (item) item.qty += qty;
  else cart.push({ id: plantId, qty });
  saveCart(cart);
  return true;
}

export function updateCartQty(plantId, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((i) => i.id !== plantId);
  else {
    const item = cart.find((i) => i.id === plantId);
    if (item) item.qty = qty;
  }
  saveCart(cart);
}

export function removeFromCart(plantId) {
  saveCart(getCart().filter((i) => i.id !== plantId));
}

export async function getCartDetails() {
  const map = await getPlantsMap();
  return getCart()
    .map((item) => {
      const plant = map[item.id];
      if (!plant) return null;
      const localized = localizePlant(plant);
      return { ...item, plant: localized, lineTotal: plant.price * item.qty };
    })
    .filter(Boolean);
}

export async function getCartTotal() {
  const lines = await getCartDetails();
  return lines.reduce((s, l) => s + l.lineTotal, 0);
}

function injectCartUI() {
  if (document.getElementById('cart-drawer')) return;

  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div class="cart-drawer" id="cart-drawer" aria-hidden="true">
      <div class="cart-drawer__backdrop" data-cart-close></div>
      <aside class="cart-drawer__panel glass-card" role="dialog" data-i18n-aria="a11y.cart">
        <header class="cart-drawer__head">
          <h2 data-i18n="cart.title">Кошик</h2>
          <button type="button" class="icon-btn" data-cart-close data-i18n-aria="a11y.close">✕</button>
        </header>
        <div class="cart-drawer__body" id="cart-drawer-body"></div>
        <footer class="cart-drawer__foot">
          <div class="cart-drawer__total">
            <span data-i18n="cart.total">Разом</span>
            <strong id="cart-drawer-total">0 ₴</strong>
          </div>
          <a href="checkout.html" class="btn btn-primary magnetic" id="cart-checkout-btn" data-i18n="cta.checkout">Оформити замовлення</a>
        </footer>
      </aside>
    </div>
    <div class="ui-toast-host" id="ui-toast-host" aria-live="polite">
      <div class="cart-toast" id="cart-toast" role="status" hidden></div>
    </div>
    `
  );

  document.querySelectorAll('[data-cart-close]').forEach((el) => {
    el.addEventListener('click', closeCartDrawer);
  });

  const locale = t();
  if (locale) applyLocaleToDOM(locale);
}

export function refreshCartChrome(locale = t()) {
  if (!locale) return;
  injectCartUI();
  applyLocaleToDOM(locale);
}

let cartToastTimer = null;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Листок летить від кнопки до іконки кошика */
export function playCartAddAnimation(sourceBtn) {
  const cartBtn = document.querySelector('[data-cart-open]');
  if (!sourceBtn || !cartBtn) return;

  sourceBtn.classList.add('is-cart-adding');
  setTimeout(() => sourceBtn.classList.remove('is-cart-adding'), 750);

  const bumpCart = () => {
    cartBtn.classList.add('cart-icon-bump');
    setTimeout(() => cartBtn.classList.remove('cart-icon-bump'), 600);
  };

  if (prefersReducedMotion()) {
    bumpCart();
    return;
  }

  const from = sourceBtn.getBoundingClientRect();
  const targetEl = document.querySelector('[data-cart-count]') || cartBtn;
  const to = targetEl.getBoundingClientRect();
  const size = 30;
  const x0 = from.left + from.width / 2 - size / 2;
  const y0 = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - (x0 + size / 2);
  const dy = to.top + to.height / 2 - (y0 + size / 2);

  const fly = document.createElement('div');
  fly.className = 'cart-fly';
  fly.setAttribute('aria-hidden', 'true');
  fly.innerHTML =
    '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 2C8 8 6 14 12 22 18 14 16 8 12 2Z" fill="currentColor"/></svg>';
  fly.style.left = `${x0}px`;
  fly.style.top = `${y0}px`;
  fly.style.setProperty('--cart-dx', `${dx}px`);
  fly.style.setProperty('--cart-dy', `${dy}px`);
  document.body.appendChild(fly);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => fly.classList.add('is-flying'));
  });

  const done = () => {
    fly.remove();
    bumpCart();
  };
  fly.addEventListener('animationend', done, { once: true });
  setTimeout(done, 1000);
}

export function showCartToast(message) {
  injectCartUI();
  const toast = document.getElementById('cart-toast');
  if (!toast || !message) return;

  clearTimeout(cartToastTimer);
  toast.hidden = false;
  toast.textContent = message;
  toast.classList.remove('is-visible');
  toast.classList.add('is-success');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('is-visible'));
  });

  cartToastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    cartToastTimer = setTimeout(() => {
      if (!toast.classList.contains('is-visible')) {
        toast.textContent = '';
        toast.hidden = true;
      }
    }, 450);
  }, 3000);
}

export async function renderCartDrawer() {
  const body = document.getElementById('cart-drawer-body');
  const totalEl = document.getElementById('cart-drawer-total');
  if (!body) return;

  const lines = await getCartDetails();
  const locale = t();
  const plocale = priceLocale();

  if (!lines.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <p>${escapeHTML(locale?.cart?.empty || 'Кошик порожній')}</p>
        <a href="catalog.html" class="btn btn-secondary">${escapeHTML(locale?.cta?.catalog || 'До каталогу')}</a>
      </div>`;
    if (totalEl) totalEl.textContent = formatPrice(0, 'UAH', plocale);
    return;
  }

  body.innerHTML = lines
    .map(
      (line) => `
    <div class="cart-line" data-cart-line="${escapeHTML(line.id)}">
      <div class="cart-line__thumb">${plantImageHtml(line.plant, { className: 'cart-line__img', width: 72, height: 72, size: 'thumb' })}</div>
      <div class="cart-line__info">
        <strong>${escapeHTML(line.plant.name)}</strong>
        <span>${formatPrice(line.plant.price, line.plant.currency, plocale)}</span>
        <div class="cart-line__qty">
          <button type="button" data-qty-minus data-i18n-aria="a11y.less">−</button>
          <span>${line.qty}</span>
          <button type="button" data-qty-plus data-i18n-aria="a11y.more">+</button>
        </div>
      </div>
      <button type="button" class="cart-line__remove" data-cart-remove data-i18n-aria="a11y.remove">×</button>
    </div>
  `
    )
    .join('');

  if (locale) applyLocaleToDOM(locale);

  const total = lines.reduce((s, l) => s + l.lineTotal, 0);
  if (totalEl) totalEl.textContent = formatPrice(total, 'UAH', plocale);

  body.querySelectorAll('[data-qty-minus]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('[data-cart-line]').dataset.cartLine;
      const line = getCart().find((i) => i.id === id);
      if (line) updateCartQty(id, line.qty - 1);
      await renderCartDrawer();
      updateCartBadge();
    });
  });

  body.querySelectorAll('[data-qty-plus]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('[data-cart-line]').dataset.cartLine;
      const line = getCart().find((i) => i.id === id);
      if (line) updateCartQty(id, line.qty + 1);
      await renderCartDrawer();
      updateCartBadge();
    });
  });

  body.querySelectorAll('[data-cart-remove]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.closest('[data-cart-line]').dataset.cartLine;
      removeFromCart(id);
      await renderCartDrawer();
      updateCartBadge();
    });
  });
}

export function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    const prev = Number(el.dataset.countPrev || 0);
    el.textContent = String(count);
    el.classList.toggle('is-hidden', count === 0);
    if (count > prev) {
      el.classList.remove('is-bump');
      void el.offsetWidth;
      el.classList.add('is-bump');
    }
    el.dataset.countPrev = String(count);
  });
}

export function bindCartButtons(container) {
  container?.querySelectorAll('[data-add-cart]').forEach((btn) => {
    if (btn.dataset.cartBound) return;
    btn.dataset.cartBound = '1';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.addCart;
      const ok = await addToCart(id);
      if (ok) {
        const locale = t();
        playCartAddAnimation(btn);
        showCartToast(locale?.cta?.addedToast || 'Додано в кошик');
        updateCartBadge();
        btn.classList.add('is-added');
        setTimeout(() => btn.classList.remove('is-added'), 1400);
      }
    });
  });
}

export function bindCartTriggers() {
  document.querySelectorAll('[data-cart-open]').forEach((btn) => {
    if (btn.dataset.cartTrigger) return;
    btn.dataset.cartTrigger = '1';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });
}

export function initCart() {
  injectCartUI();
  updateCartBadge();
  bindCartTriggers();
  window.addEventListener('rl:cartchange', () => {
    updateCartBadge();
    if (document.getElementById('cart-drawer')?.classList.contains('is-open')) {
      renderCartDrawer();
    }
  });
  window.addEventListener('rl:localechange', () => {
    refreshCartChrome();
    if (document.getElementById('cart-drawer')?.classList.contains('is-open')) {
      renderCartDrawer();
    }
  });
}

export function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  renderCartDrawer();
}

export function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
}
