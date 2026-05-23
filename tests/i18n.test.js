import { readFileSync } from 'fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getByPath } from '../js/i18n.js';
import {
  localizePlant,
  localizeArticle,
  tagLabel,
  plantTagInfo,
  clearContentEnCache,
} from '../js/content-i18n.js';

const ua = JSON.parse(readFileSync(new URL('../locales/ua.json', import.meta.url), 'utf8'));
const en = JSON.parse(readFileSync(new URL('../locales/en.json', import.meta.url), 'utf8'));
const contentEn = JSON.parse(
  readFileSync(new URL('../data/content-en.json', import.meta.url), 'utf8')
);

test('getByPath resolves nested locale keys', () => {
  assert.equal(getByPath(ua, 'contact.form.name'), "Ім'я");
  assert.equal(getByPath(en, 'plant.humidity'), 'Humidity');
});

test('UA and EN locale files share the same top-level keys', () => {
  const uaKeys = Object.keys(ua).sort();
  const enKeys = Object.keys(en).sort();
  assert.deepEqual(uaKeys, enKeys);
});

test('content-en overlay translates plant fields', () => {
  clearContentEnCache();
  const plant = {
    id: 'monstera',
    name: 'Монстера делісіоза',
    shortDescription: 'UA text',
  };
  const localized = localizePlant(plant, 'en', contentEn.plants);
  assert.equal(localized.name, 'Monstera deliciosa');
  assert.match(localized.shortDescription, /tropical/i);
});

test('tagLabel maps Ukrainian article tags', () => {
  assert.equal(tagLabel('догляд', ua), 'Догляд');
  assert.equal(tagLabel('догляд', en), 'Care');
  assert.equal(tagLabel('all', en), 'All');
});

test('plantTagInfo returns label and description for plant tags', () => {
  const info = plantTagInfo('тропічний', ua);
  assert.equal(info.label, 'Тропічний');
  assert.match(info.desc, /18–26/);
  const enInfo = plantTagInfo('очищення повітря', en);
  assert.equal(enInfo.label, 'Air purifying');
  assert.ok(enInfo.desc.length > 10);
});
