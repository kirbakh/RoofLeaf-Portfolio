import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatArticleDate,
  sortArticlesByDate,
  pickFeaturedArticle,
  countUniqueTags,
} from '../js/journal-utils.js';

const sample = [
  { id: 'a', date: '2026-01-10', tag: 'вибір' },
  { id: 'b', date: '2026-04-12', tag: 'догляд' },
  { id: 'c', date: '2026-03-15', tag: 'догляд' },
];

test('sortArticlesByDate orders newest first', () => {
  const sorted = sortArticlesByDate(sample);
  assert.equal(sorted[0].id, 'b');
  assert.equal(sorted[2].id, 'a');
});

test('pickFeaturedArticle returns newest only when filter is all', () => {
  assert.equal(pickFeaturedArticle(sample, 'all')?.id, 'b');
  assert.equal(pickFeaturedArticle(sample, 'догляд'), null);
});

test('countUniqueTags counts distinct tags', () => {
  assert.equal(countUniqueTags(sample), 2);
});

test('formatArticleDate returns localized string', () => {
  assert.match(formatArticleDate('2026-04-12', 'uk'), /2026/);
  assert.match(formatArticleDate('2026-04-12', 'en'), /2026/);
});

test('formatArticleDate falls back on invalid input', () => {
  assert.equal(formatArticleDate('not-a-date', 'uk'), 'not-a-date');
  assert.equal(formatArticleDate('', 'uk'), '');
});
