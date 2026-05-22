/**
 * Root & Leaf — shared UI (header, cookie, scroll, nav, fade-in)
 */

import { initI18n } from './i18n.js';
import { initCart, refreshCartChrome } from './cart.js';
import { loadContentEn, clearContentEnCache } from './content-i18n.js';
import { initTheme } from './theme.js';

const COOKIE_KEY = 'rl-cookies-accepted';

function initHeader() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.nav-mobile');

  const main = document.getElementById('main');

  const closeNav = () => {
    mobileNav?.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    main?.removeAttribute('aria-hidden');
  };

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) main?.setAttribute('aria-hidden', 'true');
      else main?.removeAttribute('aria-hidden');
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) closeNav();
    });
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function setActiveNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll('.nav-desktop a, .nav-mobile a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const isActive =
      (page === 'home' && (href === 'index.html' || href === '/' || href === '')) ||
      href.includes(`${page}.html`);
    link.classList.toggle('is-active', isActive);
  });
}

function initCookieBanner() {
  const banner = document.querySelector('.cookie-banner');
  const accept = document.querySelector('[data-cookie-accept]');
  if (!banner) return;

  if (!localStorage.getItem(COOKIE_KEY)) {
    banner.classList.add('is-visible');
  }

  accept?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, '1');
    banner.classList.remove('is-visible');
  });
}

/* scroll reveal handled by effects.js */

function initNewsletterMock() {
  document.querySelectorAll('.newsletter-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (input && !input.value.trim()) {
        input.focus();
        return;
      }
      form.reset();
      const msg = document.createElement('p');
      msg.setAttribute('role', 'status');
      msg.style.marginTop = '0.5rem';
      const { t } = await import('./i18n.js');
      msg.textContent = t()?.home?.newsletterSuccess || '✓';
      form.appendChild(msg);
      setTimeout(() => msg.remove(), 4000);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initHeader();
  setActiveNav();
  initCookieBanner();
  initNewsletterMock();
  initCart();

  initI18n(async (locale, lang) => {
    clearContentEnCache();
    if (lang === 'en') await loadContentEn();
    refreshCartChrome(locale);
    window.dispatchEvent(new CustomEvent('rl:localechange'));
    requestAnimationFrame(() => {
      window.__rlLocaleReady = true;
      window.dispatchEvent(new CustomEvent('rl:ready'));
    });
  });
});
