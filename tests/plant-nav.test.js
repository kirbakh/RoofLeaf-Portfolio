import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAGE_TRANSITION_MS } from '../js/nav-timing.js';

test('plant detail href keeps id in query string', () => {
  const id = 'zz-plant';
  const href = `plant.html?id=${encodeURIComponent(id)}`;
  const parsed = new URL(href, 'http://127.0.0.1:3000/catalog.html');
  assert.equal(parsed.searchParams.get('id'), id);
  assert.equal(parsed.pathname, '/plant.html');
});

test('page transition delay is short (no card animation)', () => {
  assert.ok(PAGE_TRANSITION_MS > 0);
  assert.ok(PAGE_TRANSITION_MS <= 400);
});

test('navigate target URL resolves relative plant links', () => {
  const base = 'http://127.0.0.1:3000/catalog.html';
  const target = new URL('plant.html?id=monstera', base);
  assert.equal(target.pathname, '/plant.html');
  assert.equal(target.searchParams.get('id'), 'monstera');
});
