/**
 * Extra interactions: light quiz, delivery timeline, facts bento, reviews rail, confetti
 */

import { fetchJSON, createPlantCard, bindFavoriteButtons, bindCartButtons, bindPlantCardOpen, bindPlantPhotoPreview } from './utils.js';
import { t, loadLocale } from './i18n.js';
import { localizePlant, ensureContentEn } from './content-i18n.js';

import { spawnLeafConfetti } from './confetti.js';

export { spawnLeafConfetti };

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = () => window.matchMedia('(hover: none)').matches;

let plantsCache = null;

function initKonami() {
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  let toast = document.querySelector('.konami-toast');

  document.addEventListener('keydown', (e) => {
    if (e.key === seq[pos]) {
      pos += 1;
      if (pos === seq.length) {
        pos = 0;
        spawnLeafConfetti(36);
        if (!toast) {
          toast = document.createElement('div');
          toast.className = 'konami-toast';
          toast.setAttribute('role', 'status');
          document.body.appendChild(toast);
        }
        const locale = t();
        toast.textContent = locale?.home?.konamiToast || '🌿 Secret garden mode!';
        toast.classList.add('is-visible');
        setTimeout(() => toast.classList.remove('is-visible'), 3200);
      }
    } else {
      pos = e.key === seq[0] ? 1 : 0;
    }
  });
}

function initHeroFloaters() {
  const visual = document.querySelector('.hero-visual');
  if (!visual || visual.querySelector('.hero-floaters')) return;

  const locale = t();
  const chips = locale?.home?.heroChips || ['Eco pack', '48h delivery', 'Care guide'];

  const wrap = document.createElement('div');
  wrap.className = 'hero-floaters';
  wrap.setAttribute('aria-hidden', 'true');
  chips.forEach((text, i) => {
    const el = document.createElement('span');
    el.className = `hero-floater hero-floater--${i + 1}`;
    el.textContent = text;
    wrap.appendChild(el);
  });
  visual.appendChild(wrap);
}

function bindQuizOption(btn, quiz, onPick) {
  btn.addEventListener('click', () => {
    const step = btn.closest('.light-quiz__step');
    step?.querySelectorAll('.light-quiz__option').forEach((o) => o.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    const key = btn.dataset.quizValue;
    if (!key) return;
    onPick(key);
  });
}

async function getPlants() {
  if (plantsCache) return plantsCache;
  plantsCache = await fetchJSON('data/plants.json');
  return plantsCache;
}

function matchPlants(plants, answers, locale) {
  const { light, care, room } = answers;
  const roomTags = {
    office: ['офіс', 'office'],
    bedroom: ['спальня', 'спальн', 'нічний', 'bedroom'],
    living: ['вітальня', 'декор', 'living', 'тропічний'],
  };
  const tagHints = roomTags[room] || [];

  return [...plants]
    .filter((p) => p.inStock && p.light === light)
    .map((p) => {
      let score = p.rating * 10;
      if (p.careLevel === care) score += 15;
      else if (care === 'easy' && p.careLevel === 'easy') score += 10;
      const tags = (p.tags || []).join(' ').toLowerCase();
      if (tagHints.some((h) => tags.includes(h))) score += 12;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ p }) => localizePlant(p));
}

export function initLightQuiz() {
  const quiz = document.getElementById('light-quiz');
  if (!quiz || quiz.dataset.ready) return;
  quiz.dataset.ready = '1';

  const answers = { light: null, care: null, room: null };
  let step = 1;

  const showStep = (n) => {
    step = n;
    quiz.dataset.step = String(n);
    quiz.querySelectorAll('.light-quiz__step').forEach((s) => {
      s.classList.toggle('is-active', Number(s.dataset.quizStep) === n);
    });
    const back = quiz.querySelector('[data-quiz-back]');
    if (back) back.hidden = n <= 1;
    const next = quiz.querySelector('[data-quiz-next]');
    if (next) next.hidden = n >= 3;
  };

  const finish = async () => {
    if (!answers.light || !answers.care || !answers.room) return;
    let locale = t();
    if (!locale) locale = await loadLocale();
    await ensureContentEn();

    const plants = await getPlants();
    const picks = matchPlants(plants, answers, locale);
    const grid = quiz.querySelector('.light-quiz__result-plants');
    const title = quiz.querySelector('[data-quiz-result-title]');

    if (title) {
      title.textContent = locale?.home?.quizResultTitle || 'Ваші збіги';
    }

    if (grid) {
      if (!picks.length) {
        grid.innerHTML = `<p class="empty-state">${locale?.home?.quizEmpty || 'Спробуйте інші параметри.'}</p>`;
      } else {
        grid.innerHTML = picks.map((p) => createPlantCard(p, locale)).join('');
        bindFavoriteButtons(grid);
        bindCartButtons(grid);
        bindPlantCardOpen(grid);
        bindPlantPhotoPreview(grid);
        window.reinitEffects?.(grid);
      }
    }

    quiz.classList.add('is-result');
    quiz.setAttribute('aria-busy', 'false');
    spawnLeafConfetti(16);
  };

  quiz.querySelectorAll('[data-quiz-step="1"] .light-quiz__option').forEach((btn) => {
    bindQuizOption(btn, quiz, (v) => {
      answers.light = v;
      showStep(2);
    });
  });

  quiz.querySelectorAll('[data-quiz-step="2"] .light-quiz__option').forEach((btn) => {
    bindQuizOption(btn, quiz, (v) => {
      answers.care = v;
      showStep(3);
    });
  });

  quiz.querySelectorAll('[data-quiz-step="3"] .light-quiz__option').forEach((btn) => {
    bindQuizOption(btn, quiz, (v) => {
      answers.room = v;
      finish();
    });
  });

  quiz.querySelector('[data-quiz-back]')?.addEventListener('click', () => {
    if (quiz.classList.contains('is-result')) {
      quiz.classList.remove('is-result');
      answers.light = answers.care = answers.room = null;
      quiz.querySelectorAll('.light-quiz__option').forEach((o) => o.classList.remove('is-selected'));
      showStep(1);
      return;
    }
    if (step > 1) showStep(step - 1);
  });

  quiz.querySelector('[data-quiz-next]')?.addEventListener('click', () => {
    if (step === 1 && answers.light) showStep(2);
    else if (step === 2 && answers.care) showStep(3);
  });

  quiz.querySelector('[data-quiz-reset]')?.addEventListener('click', () => {
    quiz.classList.remove('is-result');
    answers.light = answers.care = answers.room = null;
    quiz.querySelectorAll('.light-quiz__option').forEach((o) => o.classList.remove('is-selected'));
    showStep(1);
  });

  showStep(1);
}

function initDeliveryFlow() {
  const section = document.querySelector('.delivery-flow');
  if (!section) return;

  const steps = section.querySelectorAll('.delivery-flow__step');
  if (!steps.length) return;

  if (prefersReduced()) {
    section.classList.add('is-animated');
    steps.forEach((s) => s.classList.add('is-visible'));
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        if ([...steps].every((s) => s.classList.contains('is-visible'))) {
          section.classList.add('is-animated');
        }
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
  );

  steps.forEach((step, i) => {
    step.style.transitionDelay = `${i * 120}ms`;
    obs.observe(step);
  });
}

function initFunFacts() {
  const section = document.querySelector('.fun-facts');
  if (!section || section.dataset.ready) return;
  section.dataset.ready = '1';

  const cards = [...section.querySelectorAll('.fun-facts__card')];
  const dots = [...section.querySelectorAll('.fun-facts__dot')];
  if (!cards.length) return;

  let active = 0;
  let timer;

  const setActive = (index) => {
    active = index % cards.length;
    cards.forEach((c, i) => c.classList.toggle('is-active', i === active));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
  };

  const cycle = () => {
    if (prefersReduced() || document.hidden) return;
    setActive(active + 1);
  };

  const start = () => {
    clearInterval(timer);
    if (prefersReduced()) return;
    timer = setInterval(cycle, 4500);
  };

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      setActive(i);
      start();
    });
  });

  if (!isTouch()) {
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
      });
    });
  }

  setActive(0);
  start();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer);
    else start();
  });
}

export function initReviewsRail() {
  const rail = document.querySelector('.reviews-rail');
  if (!rail || rail.dataset.ready) return;
  rail.dataset.ready = '1';

  const viewport = rail.querySelector('.reviews-rail__viewport');
  const track = document.getElementById('home-reviews');
  if (!viewport || !track) return;

  const prev = rail.querySelector('[data-reviews-prev]');
  const next = rail.querySelector('[data-reviews-next]');

  const scrollByCard = (dir) => {
    const card = track.querySelector('.review-card');
    const gap = 16;
    const amount = (card?.offsetWidth || 300) + gap;
    viewport.scrollBy({ left: dir * amount, behavior: prefersReduced() ? 'auto' : 'smooth' });
  };

  prev?.addEventListener('click', () => scrollByCard(-1));
  next?.addEventListener('click', () => scrollByCard(1));

  const updateButtons = () => {
    const max = viewport.scrollWidth - viewport.clientWidth - 4;
    if (prev) prev.disabled = viewport.scrollLeft <= 4;
    if (next) next.disabled = viewport.scrollLeft >= max;
  };

  viewport.addEventListener('scroll', updateButtons, { passive: true });
  updateButtons();

  if (!isTouch()) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    viewport.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - viewport.offsetLeft;
      scrollLeft = viewport.scrollLeft;
      viewport.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => {
      isDown = false;
      viewport.style.cursor = '';
    });
    viewport.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      viewport.scrollLeft = scrollLeft - (x - startX) * 1.2;
    });
  }
}

export function initSiteEnhancements() {
  initKonami();
  initHeroFloaters();
  initDeliveryFlow();
  initFunFacts();
}

export function initHomeEnhancements() {
  initLightQuiz();
  initReviewsRail();
}

window.addEventListener('rl:localechange', () => {
  const visual = document.querySelector('.hero-visual');
  visual?.querySelector('.hero-floaters')?.remove();
  initHeroFloaters();
  const quiz = document.getElementById('light-quiz');
  if (quiz) {
    delete quiz.dataset.ready;
    initLightQuiz();
  }
});
