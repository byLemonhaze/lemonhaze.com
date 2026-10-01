import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHomeSelection } from '../src/renderers/home/selection.js';
import { UNTITLED_WORK, CAROUSEL_WORK_IDS, selectedWorks, SELECTED_SERIES, isCoreCollectionSlug } from '../src/curation/selection.js';

const provenance = JSON.parse(readFileSync(new URL('../public/data/provenance.json', import.meta.url)));
const chrysalis = JSON.parse(readFileSync(new URL('../public/data/collections/chrysalis.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const liminality = JSON.parse(readFileSync(new URL('../public/data/collections/liminality.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const artworks = [...provenance, ...chrysalis, ...liminality];
test('homepage uses the finite editorial selection in a stable order, regardless of catalogue order', () => {
    const selection = buildHomeSelection({artworks});
    assert.equal(selection.length, 10);
    assert.deepEqual(selection.map(work => work.id), CAROUSEL_WORK_IDS);
    assert.deepEqual(buildHomeSelection({artworks: [...artworks].reverse()}).map(work => work.id), selection.map(work => work.id));
    assert.equal(new Set(selection.map(work => work.id)).size, selection.length);
    assert.ok(selection.every(work => !['SEALED', 'EXPIRED'].includes(work.id)));
});
test('missing selected records are skipped without introducing random archive works', () => {
    const selection = buildHomeSelection({artworks: artworks.filter(work => work.id !== CAROUSEL_WORK_IDS[0])});
    assert.deepEqual(selection.map(work => work.id), CAROUSEL_WORK_IDS.slice(1));
});

test('Selected Work and landing share ten works including Untitled', () => {
    const selected = selectedWorks(artworks);
    assert.equal(selected.length, 10);
    assert.deepEqual(selected.map(work => work.id), CAROUSEL_WORK_IDS);
    assert.equal(new Set(selected.map(work => work.id)).size, 10);
    const landing = buildHomeSelection({ artworks });
    assert.deepEqual(landing.map(work => work.name), ['Hózhó', 'Untitled', "Chanchanok's Temple", 'Porcelain Sunset', 'Chamber of Reflection', 'Gentleman Nº6', 'BEST BEFORE Nº402', 'Hosoi', 'Rue Cuvillier', 'Gentleman Nº1']);
    assert.deepEqual(landing[1], UNTITLED_WORK);
    assert.equal(landing[1].caption, "X - 202?");
    assert.equal(landing[1].collection, undefined);
    assert.deepEqual(selected, landing);
    assert.ok(!landing.some(work => ['Lost in Bangkok', 'La Banquise'].includes(work.name)));
    assert.ok(!landing.some(work => work.name === 'From Berlin to Saigon'));
    assert.ok(!landing.some(work => work.name === 'Insaisissable Mirage'));
});

test('six core series retain both identity collections and rank archival projects quietly', () => {
    assert.equal(SELECTED_SERIES.length, 6);
    for (const slug of ['gentlemen', 'lotus', 'montreal', 'manufactured', 'games', '1-of-1s-2024']) assert.equal(isCoreCollectionSlug(slug), true);
    for (const slug of ['berlin', 'ma-ville-en-quatre-temps', 'chrysalis', 'tori-no-roji', 'la-tentation', 'world-tour', 'discography', 'colors']) assert.equal(isCoreCollectionSlug(slug), false);
});
