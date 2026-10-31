import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHomeSelection } from '../src/renderers/home/selection.js';
import { CAROUSEL_WORK_IDS, selectedWorks, SELECTED_SERIES, isCoreCollectionSlug } from '../src/curation/selection.js';

const provenance = JSON.parse(readFileSync(new URL('../public/data/provenance.json', import.meta.url)));
const chrysalis = JSON.parse(readFileSync(new URL('../public/data/collections/chrysalis.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const liminality = JSON.parse(readFileSync(new URL('../public/data/collections/liminality.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const confabulation = JSON.parse(readFileSync(new URL('../public/data/collections/confabulation.json', import.meta.url))).map(work => ({...work, name:work.meta.name, collection:work.collection || 'Confabulation'}));
const artworks = [...provenance, ...chrysalis, ...liminality, ...confabulation];
test('homepage uses the finite editorial selection in a stable order, regardless of catalogue order', () => {
    const selection = buildHomeSelection({artworks});
    assert.equal(selection.length, 8);
    assert.deepEqual(selection.map(work => work.id), CAROUSEL_WORK_IDS);
    assert.deepEqual(buildHomeSelection({artworks: [...artworks].reverse()}).map(work => work.id), selection.map(work => work.id));
    assert.equal(new Set(selection.map(work => work.id)).size, selection.length);
    assert.ok(selection.every(work => !['SEALED', 'EXPIRED'].includes(work.id)));
});
test('missing selected records are skipped without introducing random archive works', () => {
    const selection = buildHomeSelection({artworks: artworks.filter(work => work.id !== CAROUSEL_WORK_IDS[1])});
    assert.deepEqual(selection.map(work => work.id), CAROUSEL_WORK_IDS.filter((_, index) => index !== 1));
});

test('homepage and Selected Work share eight works with Symbiosis 01 first and Hózhó second', () => {
    const landing = buildHomeSelection({ artworks });
    assert.equal(landing[0].name, 'Symbiosis — 01');
    assert.equal(landing[1].name, 'Hózhó');
    assert.equal(landing[0].href, '/shop');
    assert.ok(landing[0].grid_preview.startsWith('/shop/'));
    assert.ok(!landing.some(work => ['Symbiosis — 04', 'Symbiosis — 08', 'Ganser', 'Rue Cuvillier', 'BEST BEFORE Nº402'].includes(work.name)));
    assert.deepEqual(selectedWorks(artworks), landing);
});

test('six core series retain both identity collections and rank archival projects quietly', () => {
    assert.equal(SELECTED_SERIES.length, 6);
    for (const slug of ['gentlemen', 'lotus', 'montreal', 'manufactured', 'games', '1-of-1s-2024']) assert.equal(isCoreCollectionSlug(slug), true);
    for (const slug of ['berlin', 'ma-ville-en-quatre-temps', 'chrysalis', 'tori-no-roji', 'la-tentation', 'world-tour', 'discography', 'colors']) assert.equal(isCoreCollectionSlug(slug), false);
});
