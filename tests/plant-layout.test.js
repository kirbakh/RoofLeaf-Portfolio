import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plantJs = readFileSync(join(root, 'js', 'plant.js'), 'utf8');

test('plant detail template uses compact hero layout', () => {
  assert.match(plantJs, /class="plant-hero/);
  assert.match(plantJs, /plant-hero__panel/);
  assert.match(plantJs, /plant-hero__specs/);
  assert.match(plantJs, /plant-scene/);
  assert.match(plantJs, /initPlantPage/);
  assert.match(plantJs, /text-gradient-animated/);
  assert.doesNotMatch(plantJs, /plant-detail__grid/);
  assert.doesNotMatch(plantJs, /style="padding:2rem"/);
});
