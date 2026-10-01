import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHomeSelection, EXPIRED_SLIDE } from '../src/renderers/home/selection.js';
import { CAROUSEL_WORK_IDS, selectedWorks, SELECTED_SERIES, isCoreCollectionSlug } from '../src/curation/selection.js';

const provenance = JSON.parse(readFileSync(new URL('../public/data/provenance.json', import.meta.url)));
const chrysalis = JSON.parse(readFileSync(new URL('../public/data/collections/chrysalis.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const liminality = JSON.parse(readFileSync(new URL('../public/data/collections/liminality.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const artworks = [...provenance, ...chrysalis, ...liminality];
test('homepage uses the finite editorial selection in a stable order, regardless of catalogue order', () => {
    const selection = buildHomeSelection({artworks});
    assert.equal(selection.length, 10);
    assert.deepEqual(selection.filter(work => !work.href).map(work => work.id), CAROUSEL_WORK_IDS);
    assert.deepEqual(buildHomeSelection({artworks: [...artworks].reverse()}).map(work => work.id), selection.map(work => work.id));
    assert.equal(new Set(selection.map(work => work.id)).size, selection.length);
    assert.ok(selection.every(work => !['SEALED', 'EXPIRED'].includes(work.id)));
});
test('missing selected records are skipped without introducing random archive works', () => {
    const selection = buildHomeSelection({artworks: artworks.filter(work => work.id !== CAROUSEL_WORK_IDS[0])});
    assert.deepEqual(selection.filter(work => !work.href).map(work => work.id), CAROUSEL_WORK_IDS.slice(1));
});

test('Selected Work retains nine artworks while EXPIRED is landing-only', () => {
    const selected = selectedWorks(artworks);
    assert.equal(selected.length, 9);
    assert.deepEqual(selected.map(work => work.id), CAROUSEL_WORK_IDS);
    assert.equal(new Set(selected.map(work => work.id)).size, 9);
    const landing = buildHomeSelection({ artworks });
    assert.deepEqual(landing.map(work => work.name), ['Hózhó', 'Hosoi', "Chanchanok's Temple", 'Porcelain Sunset', 'Chamber of Reflection', 'Gentleman Nº6', 'BEST BEFORE Nº402', 'EXPIRED', 'La Banquise', 'Gentleman Nº1']);
    assert.deepEqual(landing[7], EXPIRED_SLIDE);
    assert.ok(!selected.some(work => work.id === EXPIRED_SLIDE.id));
    assert.ok(!landing.some(work => ['Lost in Bangkok', 'Rue Cuvillier'].includes(work.name)));
    assert.ok(!landing.some(work => work.name === 'From Berlin to Saigon'));
    assert.ok(!landing.some(work => work.name === 'Insaisissable Mirage'));
});

test('six core series retain both identity collections and rank archival projects quietly', () => {
    assert.equal(SELECTED_SERIES.length, 6);
    for (const slug of ['gentlemen', 'lotus', 'montreal', 'manufactured', 'games', '1-of-1s-2024']) assert.equal(isCoreCollectionSlug(slug), true);
    for (const slug of ['berlin', 'ma-ville-en-quatre-temps', 'chrysalis', 'tori-no-roji', 'la-tentation', 'world-tour', 'discography', 'colors']) assert.equal(isCoreCollectionSlug(slug), false);
});
