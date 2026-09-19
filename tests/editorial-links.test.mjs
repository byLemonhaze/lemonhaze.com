import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {normalizeEditorialHref} from '../src/editorial/links.js';

const origins = ['https://lemonhaze.com', 'https://www.lemonhaze.com', 'http://127.0.0.1:5184'];
test('Liminality diary links resolve identically on production and local preview', () => {
    for (const origin of origins) {
        for (const href of ['best-before.html#diary', '/best-before.html#diary', 'https://lemonhaze.com/best-before.html#diary']) {
            assert.equal(normalizeEditorialHref(href, origin + '/liminality#collection-story'), '/best-before#diary');
        }
    }
});
test('legacy readings, anchors and presentation images retain their destinations', () => {
    const cases = {
        'process.html': '/practice',
        'liminality.html': '/liminality',
        'index.html#exhibition': '/montreal#exhibition',
        'index.html#gallery': '/montreal#artworks',
        'assets/bb-framed-study-1.jpeg': '/editorial/assets/bb-framed-study-1.jpeg',
        '/assets/bb-framed-study-2.jpeg': '/editorial/assets/bb-framed-study-2.jpeg',
        '#diary': '/best-before#diary',
        '/best-before?ref=liminality#diary': '/best-before?ref=liminality#diary',
        'sources.md': '/editorial/archive-sources.md',
    };
    for (const origin of origins) for (const [href, expected] of Object.entries(cases)) {
        assert.equal(normalizeEditorialHref(href, origin + '/best-before'), expected);
        assert.equal(normalizeEditorialHref(expected, origin + '/best-before'), expected);
    }
});
test('external sources and non-site protocols are not rewritten', () => {
    for (const href of ['https://other.example/best-before.html#diary', 'https://bestbefore.gallery/', 'https://ordinals.com/content/example', 'mailto:artist@example.com']) {
        assert.equal(normalizeEditorialHref(href, 'https://lemonhaze.com/liminality'), href);
    }
});
test('every relative link in the actual editorial fragments is consistent across origins', () => {
    const directory = new URL('../src/editorial/content/', import.meta.url);
    let links = 0;
    for (const file of readdirSync(directory).filter(name => name.endsWith('.html'))) {
        const html = readFileSync(new URL(file, directory), 'utf8');
        for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
            const href = match[1];
            if (/^[a-z]+:/i.test(href)) continue;
            links++;
            const actual = normalizeEditorialHref(href, 'https://lemonhaze.com/liminality');
            assert.equal(actual, normalizeEditorialHref(href, 'http://127.0.0.1:5184/liminality'), file + ': ' + href);
            assert.ok(!/\.html(?:#|$)/.test(actual), file + ': unmapped legacy page');
            if (href.startsWith('assets/')) assert.ok(actual.startsWith('/editorial/assets/'));
        }
    }
    assert.ok(links > 0, 'The real editorial links must be covered');
});
