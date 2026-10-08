import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInscriptionMetadata, fetchInscriptionMetadata } from '../src/modules/inscription-metadata.js';
import { getArtworkOwnership } from '../src/modules/artwork-ownership.js';

test('Ordinals metadata preserves ownership, inscription number, timestamp and burned charms', () => {
    const result = normalizeInscriptionMetadata({ address:'bc1-owner', number:75080724, timestamp:1725123126, charms:['nineball'] });
    assert.equal(result.number, 75080724);
    assert.equal(result.genesis_timestamp, 1725123126000);
    assert.equal(getArtworkOwnership({}, result).label, 'bc1-owner');
    assert.equal(getArtworkOwnership({}, normalizeInscriptionMetadata({ address:null, charms:['burned'] })).label, 'Burned');
});

test('missing live facts never become zero, epoch time, or a claimed burn', () => {
    for (const input of [null, {}, {number:null, timestamp:null}, {number:'bad',timestamp:''}]) {
        const result=normalizeInscriptionMetadata(input);
        assert.equal(result.number,null);
        assert.equal(result.genesis_timestamp,null);
        assert.equal(getArtworkOwnership({},result).status,'unknown');
    }
    assert.equal(normalizeInscriptionMetadata({number:0}).number,0);
});

test('live lookup uses only Ordinals.com and handles upstream failure', async t => {
    const requests=[];
    t.mock.method(globalThis,'fetch',async url=>{requests.push(url);return new Response('{}',{status:503});});
    const result=await fetchInscriptionMetadata('abc123i0');
    assert.deepEqual(requests,['https://ordinals.com/r/inscription/abc123i0']);
    assert.equal(result.ownerLookupSucceeded,false);
});
