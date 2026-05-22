/**
 * Синхронне застосування теми до першого paint (без FOUC)
 */
(function () {
  var KEY = 'rl-theme';
  var VALID = { dark: 1, light: 1 };
  var theme = 'dark';
  try {
    var stored = localStorage.getItem(KEY);
    if (VALID[stored]) theme = stored;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      theme = 'light';
    }
  } catch (e) {
    theme = 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
})();
