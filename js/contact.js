import { t } from './i18n.js';
import { escapeHTML } from './utils.js';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10;
}

function showError(group, message) {
  group.classList.add('has-error');
  let err = group.querySelector('.form-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'form-error';
    err.id = `${group.querySelector('input, textarea')?.id}-error`;
    group.appendChild(err);
  }
  err.textContent = message;
  group.querySelector('input, textarea')?.setAttribute('aria-describedby', err.id);
}

function clearError(group) {
  group.classList.remove('has-error');
  const err = group.querySelector('.form-error');
  if (err) err.remove();
}

function renderFaq() {
  const list = document.getElementById('faq-list');
  const locale = t();
  if (!list || !locale?.contact?.faq) return;

  list.innerHTML = locale.contact.faq
    .map(
      (item) => `
    <div class="faq-item glass-card">
      <button type="button" aria-expanded="false">${escapeHTML(item.q)}</button>
      <div class="faq-item__answer"><p>${escapeHTML(item.a)}</p></div>
    </div>`
    )
    .join('');

  list.querySelectorAll('.faq-item button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.parentElement.classList.toggle('is-open', !open);
    });
  });
}

function initForm() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const locale = t();
    const errors = locale?.contact?.errors || {};
    let valid = true;

    form.querySelectorAll('.form-group').forEach(clearError);

    const name = form.querySelector('#name');
    const email = form.querySelector('#email');
    const phone = form.querySelector('#phone');
    const message = form.querySelector('#message');

    if (!name.value.trim()) {
      showError(name.closest('.form-group'), errors.required);
      valid = false;
    }

    if (!email.value.trim() || !validateEmail(email.value)) {
      showError(email.closest('.form-group'), errors.email);
      valid = false;
    }

    if (phone.value.trim() && !validatePhone(phone.value)) {
      showError(phone.closest('.form-group'), errors.phone);
      valid = false;
    }

    if (!message.value.trim()) {
      showError(message.closest('.form-group'), errors.required);
      valid = false;
    }

    if (!valid) return;

    form.hidden = true;
    success.hidden = false;
    success.classList.add('is-visible');
    success.textContent = locale?.contact?.form?.success || 'Дякуємо!';
    success.setAttribute('role', 'status');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initForm();
  renderFaq();
});

window.addEventListener('rl:localechange', renderFaq);
window.addEventListener('rl:ready', renderFaq);
