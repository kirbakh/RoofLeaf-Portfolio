/** @param {string} iso YYYY-MM-DD */
export function formatArticleDate(iso, lang = 'uk') {
  if (!iso || typeof iso !== 'string') return iso || '';
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const locale = lang === 'en' ? 'en-GB' : 'uk-UA';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** @param {Array<{ date?: string }>} articles */
export function sortArticlesByDate(articles) {
  return [...articles].sort((a, b) => {
    const ta = Date.parse(a.date || '') || 0;
    const tb = Date.parse(b.date || '') || 0;
    return tb - ta;
  });
}

/** @param {Array<{ id: string }>} articles @param {string} filterTag */
export function pickFeaturedArticle(articles, filterTag = 'all') {
  if (filterTag !== 'all' || !articles.length) return null;
  return sortArticlesByDate(articles)[0];
}

/** @param {Array<{ tag?: string }>} articles */
export function countUniqueTags(articles) {
  return new Set(articles.map((a) => a.tag).filter(Boolean)).size;
}
