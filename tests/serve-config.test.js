import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('serve.json maps clean paths to .html and keeps cleanUrls off', () => {
  const cfg = JSON.parse(readFileSync(join(root, 'serve.json'), 'utf8'));
  assert.equal(cfg.cleanUrls, false);
  const map = Object.fromEntries((cfg.rewrites || []).map((r) => [r.source, r.destination]));
  assert.equal(map['/'], '/index.html');
  assert.equal(map['/catalog'], '/catalog.html');
  assert.equal(map['/journal'], '/journal.html');
  assert.equal(map['/plant'], '/plant.html');
});
