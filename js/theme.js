/**
 * Root & Leaf — light / dark theme
 */

export const THEME_KEY = 'rl-theme';
export const THEMES = ['dark', 'light'];

const THEME_COLORS = {
  dark: '#121916',
  light: '#f0f7f3',
};

/** @param {string | null | undefined} stored */
/** @param {boolean} prefersLight */
export function resolveTheme(stored, prefersLight = false) {
  if (THEMES.includes(stored)) return stored;
  return prefersLight ? 'light' : 'dark';
}

export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function getTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (THEMES.includes(attr)) return attr;
  return resolveTheme(getStoredTheme(), false);
}

export function applyTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[next]);

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    const toLight = next === 'dark';
    const label = btn.dataset[toLight ? 'labelLight' : 'labelDark'] || (toLight ? 'Світла тема' : 'Темна тема');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', String(!toLight));
  });
}

export function setTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'dark';
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* ignore */
  }
  applyTheme(next);
  window.dispatchEvent(new CustomEvent('rl:themechange', { detail: { theme: next } }));
  return next;
}

export function toggleTheme() {
  return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  const stored = getStoredTheme();
  const prefersLight =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  const resolved = resolveTheme(stored, prefersLight);
  if (stored && THEMES.includes(stored)) {
    applyTheme(stored);
  } else {
    applyTheme(resolved);
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    if (btn.dataset.themeReady) return;
    btn.dataset.themeReady = '1';
    btn.addEventListener('click', () => toggleTheme());
  });

  window.addEventListener('rl:localechange', () => applyTheme(getTheme()));
}
