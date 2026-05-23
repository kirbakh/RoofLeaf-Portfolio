import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const enhancementsCss = readFileSync(join(root, 'css', 'enhancements.css'), 'utf8');
const enhancementsJs = readFileSync(join(root, 'js', 'enhancements.js'), 'utf8');
const effectsJs = readFileSync(join(root, 'js', 'effects.js'), 'utf8');
const responsiveCss = readFileSync(join(root, 'css', 'responsive.css'), 'utf8');
const uaLocale = readFileSync(join(root, 'locales', 'ua.json'), 'utf8');

test('index includes interactive home sections', () => {
  assert.match(indexHtml, /id="light-quiz"/);
  assert.match(indexHtml, /delivery-flow/);
  assert.match(indexHtml, /fun-facts/);
  assert.match(indexHtml, /reviews-rail/);
  assert.match(indexHtml, /css\/enhancements\.css/);
});

test('enhancements.js exports site/home init', () => {
  assert.match(enhancementsJs, /export function initSiteEnhancements/);
  assert.match(enhancementsJs, /export function initHomeEnhancements/);
  assert.match(enhancementsJs, /prefers-reduced-motion/);
});

test('confetti.js is lightweight', () => {
  const confettiJs = readFileSync(join(root, 'js', 'confetti.js'), 'utf8');
  assert.match(confettiJs, /export function spawnLeafConfetti/);
  assert.doesNotMatch(confettiJs, /from '\.\/utils\.js'/);
});

test('effects.js wires site enhancements lazily with fallback', () => {
  assert.match(effectsJs, /import\('\.\/enhancements\.js'\)/);
  assert.match(effectsJs, /ensurePageVisible/);
  assert.match(effectsJs, /\.light-quiz/);
});

test('enhancements.css respects reduced motion', () => {
  assert.match(enhancementsCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(enhancementsCss, /\.reviews-rail__viewport/);
});

test('responsive.css adapts new blocks on mobile', () => {
  assert.match(responsiveCss, /\.light-quiz/);
  assert.match(responsiveCss, /\.fun-facts__bento/);
  assert.match(responsiveCss, /\.reviews-rail__track/);
});

test('locales include quiz and flow copy', () => {
  assert.match(uaLocale, /"quizTitle"/);
  assert.match(uaLocale, /"flowTitle"/);
  assert.match(uaLocale, /"konamiToast"/);
});
