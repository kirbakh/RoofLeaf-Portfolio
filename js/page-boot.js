/**
 * Гарантований запуск після DOM + i18n (один раз)
 */
export function onPageReady(fn) {
  const run = () => Promise.resolve(fn()).catch((e) => console.error(e));

  const schedule = () => {
    if (window.__rlLocaleReady) {
      run();
      return;
    }
    window.addEventListener('rl:ready', run, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }
}
