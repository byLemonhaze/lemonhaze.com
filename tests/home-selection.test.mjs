import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildHomeSelection } from '../src/renderers/home/selection.js';
import { CAROUSEL_WORK_IDS, selectedWorks } from '../src/curation/selection.js';

const provenance = JSON.parse(readFileSync(new URL('../public/data/provenance.json', import.meta.url)));
const chrysalis = JSON.parse(readFileSync(new URL('../public/data/collections/chrysalis.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const liminality = JSON.parse(readFileSync(new URL('../public/data/collections/liminality.json', import.meta.url))).map(work => ({...work, name:work.meta.name}));
const artworks = [...provenance, ...chrysalis, ...liminality];
test('homepage uses the finite editorial selection in a stable order, regardless of catalogue order', () => {
    const selection = buildHomeSelection({artworks});
    assert.equal(selection.length, 12);
    assert.deepEqual(selection.map(work => work.id), CAROUSEL_WORK_IDS);
    assert.deepEqual(buildHomeSelection({artworks: [...artworks].reverse()}).map(work => work.id), CAROUSEL_WORK_IDS);
    assert.equal(new Set(selection.map(work => work.id)).size, selection.length);
    assert.ok(selection.every(work => !['SEALED', 'EXPIRED'].includes(work.id)));
});
test('missing selected records are skipped without introducing random archive works', () => {
    const selection = buildHomeSelection({artworks: artworks.filter(work => work.id !== CAROUSEL_WORK_IDS[0])});
    assert.deepEqual(selection.map(work => work.id), CAROUSEL_WORK_IDS.slice(1));
});

test('Selected Work follows the twelve landing slides and adds two works', () => {
    const selected = selectedWorks(artworks);
    assert.equal(selected.length, 14);
    assert.deepEqual(selected.slice(0, 12).map(work => work.id), CAROUSEL_WORK_IDS);
    assert.equal(new Set(selected.map(work => work.id)).size, 14);
    assert.ok(selected.some(work => work.name === 'From Berlin to Saigon'));
    for (const name of ['Le Confessionnal (Sin City)']) {
        assert.ok(selected.some(work => work.name === name));
    }
    const landing = buildHomeSelection({ artworks });
    assert.deepEqual(landing.map(work => work.name), ['Hózhó', 'Hosoi', "Chanchanok's Temple", 'Porcelain Sunset', 'Chamber of Reflection (Sin City)', 'Paysage', 'Lotus Tigré', 'Gentleman Nº6', 'BEST BEFORE Nº402', "L'Hiver, la nuit", 'Rue Cuvillier', 'Gentleman Nº1']);
    assert.ok(!landing.some(work => work.name === 'From Berlin to Saigon'));
    assert.ok(!landing.some(work => work.name === 'Insaisissable Mirage'));
});
