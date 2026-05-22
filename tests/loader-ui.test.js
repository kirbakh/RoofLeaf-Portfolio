import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  flowerSpinnerHtml,
  growLoaderIntroMarkup,
  contentLoaderHtml,
} from '../js/loader-ui.js';

describe('loader-ui', () => {
  it('flowerSpinnerHtml includes spinning bloom and orbit ring', () => {
    const html = flowerSpinnerHtml('lg');
    assert.match(html, /flower-spinner--lg/);
    assert.match(html, /flower-spinner__bloom/);
    assert.match(html, /flower-spinner__orbit/);
    assert.match(html, /flower-spinner__halo/);
    assert.match(html, /flower-spinner__leaf/);
  });

  it('growLoaderIntroMarkup includes plant growth scene', () => {
    const html = growLoaderIntroMarkup();
    assert.match(html, /grow-loader__plant/);
    assert.match(html, /grow-stem/);
    assert.match(html, /grow-bloom/);
  });

  it('contentLoaderHtml escapes message text', () => {
    const html = contentLoaderHtml('<script>');
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>/);
  });
});
