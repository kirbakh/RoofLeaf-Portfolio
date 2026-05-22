import assert from 'node:assert/strict';
import { resolveTheme, THEMES, THEME_KEY } from '../js/theme.js';

assert.deepEqual(THEMES, ['dark', 'light']);
assert.equal(THEME_KEY, 'rl-theme');

assert.equal(resolveTheme('light', false), 'light');
assert.equal(resolveTheme('dark', true), 'dark');
assert.equal(resolveTheme('invalid', false), 'dark');
assert.equal(resolveTheme(null, true), 'light');
assert.equal(resolveTheme(undefined, false), 'dark');
assert.equal(resolveTheme('', true), 'light');

console.log('theme tests: ok');
