import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slugify.js';
test('tabs and repeated punctuation collapse', () => {
  assert.equal(slugify(' A\tB...C '), 'a-b-c');
  assert.equal(slugify('snake_case'), 'snake-case');
  assert.equal(slugify('snake__case'), 'snake-case');
  assert.equal(slugify('snake_ _case'), 'snake-case');
});
test('edges are clean and digits survive', () => assert.equal(slugify(' --Release 03!! '), 'release-03'));
test('empty and punctuation-only input stay empty', () => {
  assert.equal(slugify(''), '');
  assert.equal(slugify(' !!! '), '');
  assert.equal(slugify('___'), '');
});
