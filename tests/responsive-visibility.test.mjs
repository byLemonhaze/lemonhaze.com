import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('critical hidden styles allow responsive display utilities to override them', () => {
    const hiddenRule = indexHtml.match(/\.hidden\s*\{[^}]*\}/)?.[0] || '';

    assert.match(hiddenRule, /display:\s*none\s*;/);
    assert.doesNotMatch(hiddenRule, /display:\s*none\s*!important/);
});
