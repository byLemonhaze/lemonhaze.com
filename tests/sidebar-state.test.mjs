import test from 'node:test';
import assert from 'node:assert/strict';

import { getCollapsedYears, initCollapsedYears, toggleYearCollapse } from '../src/state/store.js';

test('all chronology years start collapsed and can be expanded individually', () => {
    initCollapsedYears(['2026', '2025', '2024', '2023']);
    assert.deepEqual([...getCollapsedYears()], ['2026', '2025', '2024', '2023']);

    toggleYearCollapse('2025');
    assert.equal(getCollapsedYears().has('2025'), false);
    assert.equal(getCollapsedYears().has('2026'), true);
});
