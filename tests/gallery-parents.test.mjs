import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildGalleryParentIds } from '../src/app/collection-flow.js';

const catalogue = JSON.parse(readFileSync(new URL('../public/data/provenance.json', import.meta.url)));

test('Orphelinat has no collection parent even though Deprivation has separate editions', () => {
    const gallery = catalogue.filter(item => item.collection === 'Orphelinat');
    assert.equal(gallery.length, 6);
    assert.equal(buildGalleryParentIds(gallery).size, 0);
});

test('a gallery retains its actual parent while ignoring ancestors outside the view', () => {
    const parent = 'a'.repeat(64) + 'i0';
    const ancestor = 'b'.repeat(64) + 'i0';
    const child = 'c'.repeat(64) + 'i0';
    assert.deepEqual([...buildGalleryParentIds([
        { id: parent },
        { id: child, provenance: `${parent}, ${ancestor}` },
    ])], [parent]);
    assert.deepEqual([...buildGalleryParentIds([{ id: parent, role: 'parent' }])], [parent]);
});
