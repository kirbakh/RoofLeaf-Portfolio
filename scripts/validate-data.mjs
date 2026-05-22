#!/usr/bin/env node
/**
 * Validates mock JSON data for Root & Leaf
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function load(name) {
  return JSON.parse(readFileSync(join(root, 'data', name), 'utf8'));
}

const plants = load('plants.json');
const articles = load('articles.json');
const reviews = load('reviews.json');

const plantFields = ['id', 'name', 'latinName', 'price', 'careLevel', 'light', 'size', 'images', 'inStock', 'rating'];

if (plants.length < 12) {
  console.error(`FAIL: plants.json must have >= 12 items, got ${plants.length}`);
  failed++;
}

plants.forEach((p) => {
  plantFields.forEach((f) => {
    if (p[f] === undefined) {
      console.error(`FAIL: plant ${p.id} missing field ${f}`);
      failed++;
    }
  });
});

if (articles.length < 6) {
  console.error(`FAIL: articles.json must have >= 6 items`);
  failed++;
}

if (reviews.length < 8) {
  console.error(`FAIL: reviews.json must have >= 8 items`);
  failed++;
}

reviews.forEach((r) => {
  if (!r.author || !r.text || r.rating == null) {
    console.error('FAIL: invalid review', r);
    failed++;
  }
});

if (failed) process.exit(1);
console.log(`OK: plants=${plants.length} articles=${articles.length} reviews=${reviews.length}`);
