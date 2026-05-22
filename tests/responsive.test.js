import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const responsiveCss = readFileSync(join(root, 'css', 'responsive.css'), 'utf8');
const mobileCss = readFileSync(join(root, 'css', 'mobile-elements.css'), 'utf8');
const effectsJs = readFileSync(join(root, 'js', 'effects.js'), 'utf8');
const navTimingJs = readFileSync(join(root, 'js', 'nav-timing.js'), 'utf8');
const mainJs = readFileSync(join(root, 'js', 'main.js'), 'utf8');
const utilsJs = readFileSync(join(root, 'js', 'utils.js'), 'utf8');

test('responsive.css covers mobile layout and nav drawer', () => {
  assert.match(responsiveCss, /@media \(max-width: 767px\)/);
  assert.match(responsiveCss, /env\(safe-area-inset/);
  assert.match(responsiveCss, /\.nav-mobile__panel/);
  assert.match(responsiveCss, /\.menu-toggle\.is-open/);
  assert.match(responsiveCss, /\.plant-preview__dialog/);
  assert.match(responsiveCss, /font-size:\s*max\(16px/);
  assert.doesNotMatch(responsiveCss, /content-visibility:\s*auto/);
});

test('effects.js keeps loaders and transitions on mobile with shorter timing', () => {
  assert.match(effectsJs, /INTRO_LOADER_MOBILE/);
  assert.match(effectsJs, /is-mobile-fast/);
  assert.match(effectsJs, /pageTransitionMs/);
  assert.match(effectsJs, /routeLoaderMinMs/);
  assert.doesNotMatch(effectsJs, /introDone \|\| isMobile\(\)/);
  assert.doesNotMatch(effectsJs, /initPageTransition\(\)[\s\S]*isMobile\(\)\) return/);
});

test('nav-timing exports mobile loader constants', () => {
  assert.match(navTimingJs, /INTRO_LOADER_MOBILE/);
  assert.match(navTimingJs, /MOBILE_PAGE_TRANSITION_MS/);
});

test('header toggles menu-open classes and builds nav backdrop', () => {
  assert.match(mainJs, /nav-is-open/);
  assert.match(mainJs, /nav-mobile__backdrop/);
  assert.match(mainJs, /ensureMobileNavStructure/);
  assert.match(mainJs, /addMobileNavTools/);
  assert.match(mainJs, /stopPropagation/);
});

test('mobile-elements.css adapts major UI blocks', () => {
  assert.match(mobileCss, /\.pot-card__cart/);
  assert.match(mobileCss, /\.cart-drawer__foot/);
  assert.match(mobileCss, /\.plant-hero__actions/);
  assert.match(mobileCss, /\.filter-chips/);
  assert.match(mobileCss, /\.nav-mobile__tools/);
  assert.match(mobileCss, /\.contact-card-item/);
});

test('plant images include responsive sizes hint', () => {
  assert.match(utilsJs, /sizes="/);
  assert.match(utilsJs, /max-width: 767px/);
});
