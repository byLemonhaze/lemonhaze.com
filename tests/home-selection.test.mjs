import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHomeSelection } from '../src/renderers/home/selection.js';

test('Generative Composition works never enter the homepage selection', () => {
    const artworks = [
        {
            id: 'generative-composition-work',
            name: 'Generative Composition #9',
            collection: 'Generative Composition',
            artwork_type: 'PNG',
        },
        {
            id: 'oaxaca-work',
            name: 'Alligator',
            collection: 'Oaxaca',
            artwork_type: 'PNG',
        },
    ];

    const selection = buildHomeSelection({
        artworks,
        chronologyByYear: {
            2023: ['Generative Composition', 'Oaxaca'],
        },
    });

    assert.ok(selection.every((item) => item.collection !== 'Generative Composition'));
    assert.ok(selection.some((item) => item.id === 'oaxaca-work'));
});
