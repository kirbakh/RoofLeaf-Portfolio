import { getCartDetails, getCartTotal, saveCart } from './cart.js';
import { formatPrice, escapeHTML, plantImageHtml } from './utils.js';
import { onPageReady } from './page-boot.js';
import { t } from './i18n.js';
import { priceLocale } from './content-i18n.js';

const steps = ['cart', 'delivery', 'payment', 'done'];
let currentStep = 0;

async function renderSummary() {
  const el = document.getElementById('checkout-summary');
  if (!el) return;
  const locale = t();
  const plocale = priceLocale();
  const lines = await getCartDetails();
  if (!lines.length) {
    el.innerHTML = `<p class="cart-empty">${escapeHTML(locale?.cart?.emptyCheckout || 'Кошик порожній.')} <a href="catalog.html">${escapeHTML(locale?.cta?.catalog || 'До каталогу')}</a></p>`;
    return;
  }
  el.innerHTML = lines
    .map(
      (l) => `
    <div class="checkout-line">
      <div class="checkout-line__thumb">${plantImageHtml(l.plant, { className: 'checkout-line__img', width: 56, height: 56, size: 'thumb' })}</div>
      <span>${escapeHTML(l.plant.name)} × ${l.qty}</span>
      <strong>${formatPrice(l.lineTotal, l.plant.currency, plocale)}</strong>
    </div>`
    )
    .join('');
  const total = await getCartTotal();
  document.getElementById('checkout-total').textContent = formatPrice(total, 'UAH', plocale);
  document.getElementById('checkout-total-final').textContent = formatPrice(total + 79, 'UAH', plocale);
}

function showStep(idx) {
  currentStep = idx;
  document.querySelectorAll('[data-checkout-step]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.checkoutStep) !== idx;
  });
  document.querySelectorAll('[data-step-dot]').forEach((dot, i) => {
    dot.classList.toggle('is-active', i === idx);
    dot.classList.toggle('is-done', i < idx);
  });
}

async function initCheckout() {
  showStep(0);
  await renderSummary();

  document.getElementById('btn-to-delivery')?.addEventListener('click', async () => {
    const items = await getCartDetails();
    if (!items.length) return;
    showStep(1);
  });

  document.getElementById('delivery-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showStep(2);
  });

  document.getElementById('payment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const card = document.getElementById('card-number');
    if (card && card.value.replace(/\s/g, '').length < 16) {
      card.closest('.form-group')?.classList.add('has-error');
      return;
    }
    showStep(3);
    saveCart([]);
    window.dispatchEvent(new CustomEvent('rl:cartchange'));
  });

  document.querySelectorAll('[data-step-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) showStep(currentStep - 1);
    });
  });
}

window.addEventListener('rl:localechange', renderSummary);
onPageReady(initCheckout);
