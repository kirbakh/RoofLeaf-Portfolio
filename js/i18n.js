/**
 * i18n — UA/EN via JSON locales
 */

let currentLocale = null;
let currentLang = 'ua';

const LANG_KEY = 'rl-lang';

export function getLang() {
  return localStorage.getItem(LANG_KEY) || 'ua';
}

export function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'uk';
}

export async function loadLocale(lang = getLang()) {
  const file = lang === 'en' ? 'locales/en.json' : 'locales/ua.json';
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error('locale fetch failed');
    currentLocale = await res.json();
    currentLang = lang;
    setLang(lang);
    return currentLocale;
  } catch (e) {
    console.error('i18n:', e);
    if (lang !== 'ua') return loadLocale('ua');
    return null;
  }
}

export function t() {
  return currentLocale;
}

/** @param {object} obj @param {string} path dot-separated */
export function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

function setText(sel, text) {
  document.querySelectorAll(sel).forEach((el) => {
    if (text != null) el.textContent = text;
  });
}

function setAttr(sel, attr, text) {
  document.querySelectorAll(sel).forEach((el) => {
    if (text != null) el.setAttribute(attr, text);
  });
}

export function applyLocaleToDOM(locale) {
  if (!locale) return;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const val = getByPath(locale, key);
    if (val != null) el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = getByPath(locale, key);
    if (val != null) el.placeholder = val;
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const val = getByPath(locale, key);
    if (val != null) el.setAttribute('aria-label', val);
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    const val = getByPath(locale, key);
    if (val != null) el.setAttribute('title', val);
  });

  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    const key = el.getAttribute('data-i18n-alt');
    const val = getByPath(locale, key);
    if (val != null) el.setAttribute('alt', val);
  });

  document.querySelectorAll('[data-i18n-sort]').forEach((el) => {
    const key = el.getAttribute('data-i18n-sort');
    const val = getByPath(locale, `sort.${key}`);
    if (val != null) el.textContent = val;
  });

  const uspItems = document.querySelectorAll('[data-i18n-usp]');
  uspItems.forEach((el, i) => {
    const item = locale.usp?.items?.[i];
    if (!item) return;
    const title = el.querySelector('[data-usp-title]');
    const text = el.querySelector('[data-usp-text]');
    if (title) title.textContent = item.title;
    if (text) text.textContent = item.text;
  });

  const page = document.body?.dataset?.page;
  if (page && locale.meta?.[page]) {
    document.title = locale.meta[page];
  }

  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.langBtn === currentLang);
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === currentLang));
  });

  if (locale.theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.dataset.labelLight = locale.theme.toLight;
      btn.dataset.labelDark = locale.theme.toDark;
    });
    import('./theme.js').then(({ applyTheme, getTheme }) => applyTheme(getTheme()));
  }
}

export function initLangSwitch(onChange) {
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const lang = btn.dataset.langBtn;
      if (lang === currentLang) return;
      const locale = await loadLocale(lang);
      applyLocaleToDOM(locale);
      if (onChange) onChange(locale, lang);
    });
  });
}

export async function initI18n(onChange) {
  const lang = getLang();
  const locale = await loadLocale(lang);
  applyLocaleToDOM(locale);
  initLangSwitch(onChange);
  if (onChange) await onChange(locale, lang);
  return locale;
}
