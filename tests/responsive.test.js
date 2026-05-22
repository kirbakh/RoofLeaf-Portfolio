import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const responsiveCss = readFileSync(join(root, 'css', 'responsive.css'), 'utf8');
const effectsJs = readFileSync(join(root, 'js', 'effects.js'), 'utf8');
const utilsJs = readFileSync(join(root, 'js', 'utils.js'), 'utf8');

test('responsive.css covers mobile layout and performance tweaks', () => {
  assert.match(responsiveCss, /@media \(max-width: 767px\)/);
  assert.match(responsiveCss, /env\(safe-area-inset/);
  assert.match(responsiveCss, /content-visibility:\s*auto/);
  assert.match(responsiveCss, /\.plant-preview__dialog/);
  assert.match(responsiveCss, /\.checkout-steps/);
  assert.match(responsiveCss, /font-size:\s*max\(16px/);
  assert.match(responsiveCss, /\.photo-mosaic/);
});

test('effects.js skips heavy interactions on mobile', () => {
  assert.match(effectsJs, /isMobile\(\)\s*\?\s*4/);
  assert.match(effectsJs, /initPageTransition\(\)[\s\S]*isMobile\(\)/);
  assert.match(effectsJs, /introDone \|\| isMobile\(\)/);
  assert.match(effectsJs, /heavyFx/);
});

test('plant images include responsive sizes hint', () => {
  assert.match(utilsJs, /sizes="/);
  assert.match(utilsJs, /max-width: 767px/);
});
