/**
 * Root & Leaf — shared UI (header, cookie, scroll, nav, fade-in)
 */

import { initI18n } from './i18n.js';
import { initCart, refreshCartChrome } from './cart.js';
import { loadContentEn, clearContentEnCache } from './content-i18n.js';
import { initTheme } from './theme.js';

const COOKIE_KEY = 'rl-cookies-accepted';
/** Панель справа: backdrop + links (без важких ефектів) */
function setupMobileNav(nav) {
  if (!nav || nav.dataset.navReady) return;

  let backdrop = nav.querySelector('.nav-mobile__backdrop');
  if (!backdrop) {
    backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'nav-mobile__backdrop';
    backdrop.setAttribute('aria-label', 'Закрити меню');
    nav.insertBefore(backdrop, nav.firstChild);
  }

  let panel = nav.querySelector('.nav-mobile__panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'nav-mobile__panel';
    nav.appendChild(panel);
  }

  nav.querySelectorAll(':scope > a').forEach((link) => panel.appendChild(link));

  if (nav.parentElement !== document.body) {
    document.body.appendChild(nav);
  }

  nav.dataset.navReady = '1';
  addMobileNavTools(panel);
}

function addMobileNavTools(panel) {
  if (!panel || panel.querySelector('.nav-mobile__tools')) return;

  const themeSrc = document.querySelector('[data-theme-toggle]');
  if (!themeSrc) return;

  const tools = document.createElement('div');
  tools.className = 'nav-mobile__tools';

  const themeBtn = document.createElement('button');
  themeBtn.type = 'button';
  themeBtn.className = 'nav-mobile__tool nav-mobile__tool--theme';
  themeBtn.setAttribute('data-i18n', 'nav.theme');
  themeBtn.innerHTML = '<span aria-hidden="true">◐</span><span>Тема</span>';
  themeBtn.addEventListener('click', () => {
    themeSrc.click();
    window.__rlCloseNav?.();
  });

  tools.appendChild(themeBtn);
  panel.appendChild(tools);
}

function initHeader() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.nav-mobile');

  setupMobileNav(mobileNav);

  const backdrop = mobileNav?.querySelector('.nav-mobile__backdrop');
  const panel = mobileNav?.querySelector('.nav-mobile__panel');

  const closeNav = () => {
    if (!mobileNav) return;
    mobileNav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  };

  window.__rlCloseNav = closeNav;

  const openNav = () => {
    if (!mobileNav) return;
    mobileNav.classList.add('is-open');
    document.body.classList.add('nav-open');
    toggle?.classList.add('is-open');
    toggle?.setAttribute('aria-expanded', 'true');
  };

  if (toggle && mobileNav && panel) {
    toggle.addEventListener('click', () => {
      if (mobileNav.classList.contains('is-open')) closeNav();
      else openNav();
    });

    backdrop?.addEventListener('click', closeNav);

    panel.querySelectorAll('a').forEach((link) => {
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
  document.querySelectorAll('.nav-desktop a, .nav-mobile__panel a').forEach((link) => {
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
      const strip = form.closest('.newsletter-strip');
      strip?.classList.add('is-success');
      setTimeout(() => strip?.classList.remove('is-success'), 1200);

      const { spawnLeafConfetti } = await import('./confetti.js');
      spawnLeafConfetti(20);

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
