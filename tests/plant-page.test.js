import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plantPageJs = readFileSync(join(root, 'js', 'plant-page.js'), 'utf8');

test('plant-page module exports initPlantPage', () => {
  assert.match(plantPageJs, /export function initPlantPage/);
  assert.match(plantPageJs, /swapPlantImage/);
  assert.match(plantPageJs, /initPlantSections/);
  assert.match(plantPageJs, /export function unlockCareSection/);
});
