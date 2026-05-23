/**
 * Локалізація контенту з data/*.json (UA за замовчуванням, EN — overlay)
 */

import { getLang } from './i18n.js';

let contentEn = null;

export async function loadContentEn() {
  if (contentEn) return contentEn;
  try {
    const res = await fetch('data/content-en.json');
    if (!res.ok) return null;
    contentEn = await res.json();
    return contentEn;
  } catch {
    return null;
  }
}

export function clearContentEnCache() {
  contentEn = null;
}

function overlay(base, patch) {
  if (!patch) return base;
  return { ...base, ...patch };
}

/** @param {object} plant */
export function localizePlant(plant, lang = getLang(), enMap = contentEn?.plants) {
  if (!plant || lang !== 'en') return plant;
  const patch = enMap?.[plant.id];
  return overlay(plant, patch);
}

/** @param {object} article */
export function localizeArticle(article, lang = getLang(), enMap = contentEn?.articles) {
  if (!article || lang !== 'en') return article;
  const patch = enMap?.[article.id];
  return overlay(article, patch);
}

/** @param {object} review @param {number} index */
export function localizeReview(review, index, lang = getLang(), enList = contentEn?.reviews) {
  if (!review || lang !== 'en') return review;
  const patch = enList?.[index];
  return overlay(review, patch);
}

/** @param {object} item @param {number} index */
export function localizeGalleryItem(item, index, lang = getLang(), enList = contentEn?.gallery) {
  if (!item || lang !== 'en') return item;
  const patch = enList?.[index];
  return overlay(item, patch);
}

/** @param {string} tag @param {object} locale */
export function tagLabel(tag, locale) {
  if (!tag || tag === 'all') return locale?.tags?.all || tag;
  const plantTag = locale?.plantTags?.[tag]?.label;
  if (plantTag) return plantTag;
  return locale?.tags?.[tag] || tag;
}

/** @param {string} tag @param {object} locale */
export function plantTagInfo(tag, locale) {
  const key = String(tag || '').toLowerCase();
  const entry = locale?.plantTags?.[key];
  return {
    label: entry?.label || tagLabel(key, locale),
    desc: entry?.desc || '',
  };
}

export function priceLocale(lang = getLang()) {
  return lang === 'en' ? 'en-US' : 'uk-UA';
}

export async function ensureContentEn() {
  if (getLang() === 'en' && !contentEn) await loadContentEn();
  return contentEn;
}
