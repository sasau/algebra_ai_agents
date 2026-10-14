import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/slugify.js';
test('basic words become lowercase with hyphens', () => assert.equal(slugify(' Hello World '), 'hello-world'));
test('punctuation creates one separator', () => assert.equal(slugify('Hello, world!'), 'hello-world'));
