/**
 * Підбір рослин за світлом — окремий модуль (завжди на головній)
 */

import { fetchJSON, createPlantCard, bindFavoriteButtons, bindPlantCardOpen, bindPlantPhotoPreview } from './utils.js';
import { bindCartButtons } from './cart.js';
import { t, loadLocale } from './i18n.js';
import { localizePlant, ensureContentEn } from './content-i18n.js';
import { spawnLeafConfetti } from './confetti.js';

const quizStateMap = new WeakMap();
let globalHandlersBound = false;

function showQuizStep(quiz, state, n) {
  state.step = n;
  quiz.dataset.step = String(n);
  quiz.classList.remove('is-result');
  quiz.querySelectorAll('.light-quiz__step').forEach((s) => {
    s.classList.toggle('is-active', Number(s.dataset.quizStep) === n);
  });
  const back = quiz.querySelector('[data-quiz-back]');
  if (back) back.hidden = n <= 1;
}

async function getPlants() {
  return fetchJSON('data/plants.json');
}

function matchPlants(plants, answers) {
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

async function finishQuiz(quiz, state) {
  const { answers } = state;
  if (!answers.light || !answers.care || !answers.room) return;

  quiz.setAttribute('aria-busy', 'true');
  const grid = quiz.querySelector('.light-quiz__result-plants');
  if (grid) grid.innerHTML = '<p class="content-loader__text">…</p>';

  try {
    let locale = t();
    if (!locale) locale = await loadLocale();
    await ensureContentEn();

    const plants = await getPlants();
    const picks = matchPlants(plants, answers);
    const title = quiz.querySelector('[data-quiz-result-title]');
    if (title) title.textContent = locale?.home?.quizResultTitle || 'Ваші збіги';

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
    spawnLeafConfetti(16);
  } catch (e) {
    console.error('light-quiz:', e);
    if (grid) {
      grid.innerHTML = '<p class="error-state" role="alert">Не вдалося підібрати рослини. Спробуйте ще раз.</p>';
    }
  } finally {
    quiz.setAttribute('aria-busy', 'false');
  }
}

function resetQuiz(quiz, state) {
  state.answers = { light: null, care: null, room: null };
  quiz.querySelectorAll('.light-quiz__option').forEach((o) => o.classList.remove('is-selected'));
  showQuizStep(quiz, state, 1);
}

function handleQuizInteraction(e) {
  const quiz = document.getElementById('light-quiz');
  if (!quiz || !quiz.contains(e.target)) return;

  const state = quizStateMap.get(quiz);
  if (!state) return;

  const option = e.target.closest('.light-quiz__option');
  if (option) {
    const stepEl = option.closest('.light-quiz__step');
    if (!stepEl?.classList.contains('is-active')) return;

    const stepNum = Number(stepEl.dataset.quizStep);
    const value = option.dataset.quizValue;
    if (!value) return;

    e.preventDefault();
    e.stopPropagation();

    stepEl.querySelectorAll('.light-quiz__option').forEach((o) => o.classList.remove('is-selected'));
    option.classList.add('is-selected');

    if (stepNum === 1) {
      state.answers.light = value;
      showQuizStep(quiz, state, 2);
    } else if (stepNum === 2) {
      state.answers.care = value;
      showQuizStep(quiz, state, 3);
    } else if (stepNum === 3) {
      state.answers.room = value;
      void finishQuiz(quiz, state);
    }
    return;
  }

  if (e.target.closest('[data-quiz-back]')) {
    e.preventDefault();
    e.stopPropagation();
    if (quiz.classList.contains('is-result')) {
      resetQuiz(quiz, state);
      return;
    }
    if (state.step > 1) showQuizStep(quiz, state, state.step - 1);
    return;
  }

  if (e.target.closest('[data-quiz-reset]')) {
    e.preventDefault();
    e.stopPropagation();
    resetQuiz(quiz, state);
  }
}

function bindGlobalHandlers() {
  if (globalHandlersBound) return;
  globalHandlersBound = true;
  document.addEventListener('click', handleQuizInteraction, true);
}

export function initLightQuiz() {
  const quiz = document.getElementById('light-quiz');
  if (!quiz) return;

  quiz.classList.add('is-visible', 'is-interactive');
  quiz.classList.remove('tilt-card');

  if (!quizStateMap.has(quiz)) {
    quizStateMap.set(quiz, { answers: { light: null, care: null, room: null }, step: 1 });
  }

  bindGlobalHandlers();
  resetQuiz(quiz, quizStateMap.get(quiz));
  quiz.dataset.quizBound = '1';
}

function bootQuiz() {
  const quiz = document.getElementById('light-quiz');
  if (!quiz || quiz.dataset.quizBound === '1') return;
  initLightQuiz();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootQuiz);
} else {
  bootQuiz();
}

window.addEventListener('rl:ready', bootQuiz);
