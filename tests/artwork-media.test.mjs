import test from 'node:test';
import assert from 'node:assert/strict';

import {
    getCdnMediaSrc,
    getDirectOnchainPreviewSrc,
    shouldUseDirectOnchainPreview,
} from '../src/modules/artwork-media.js';

const DIRECT_ONCHAIN_GRID_PREVIEWS = [
    ['Off-Kilter', '15ed0a345c10cb0b26fad820f364898f355924dbf0ce5527dd5d7237e0a25964i0'],
    ['Glass Breaker', '58d21c5f1bbc25932fe1cc784ac47baf8b0ed9241ea989ad2a47b41839d132e7i0'],
    ['Mending Out', 'a75945e142877ade9392a0855ef0fdab215af10a7f3e4381d31697c706836228i0'],
    ['Necronies', 'e363af225398924fbc52df5fe605a6b1e1290ed464ded09dba82516154913be5i0'],
    ['Flashback', 'b66a29be1861ef12253635e0dff825344dc39c5c44644e3224b7974deac8a092i0'],
    ['Soleil & Mer', '28cc6c152b736d59551de08f0d6bd7984a49a0a1f9eca80df62938eaa96ac7e6i0'],
    ['Birthday Girl', 'ada7662763439c6a786c1a06b653efb244b9abd722593c9a97606c7050c931b6i0'],
    ['Loft Gallery Prototype', '3103fcd71deeacd50251d7d6c14778ff74fd26c6ee9b46ec24341aac9bc874fdi0'],
];

const UNTOUCHED_2025_HTML_WORKS = [
    ['Last Call', '4e052f799f999138edb4d9df420ed1fd1590508aa3e702f65c231204b40c3d00i0'],
    ['Dark Horse', 'cc06be3ea69b948c580e67e27d24f889a1bed0c0fa6acf12187e94ac5c041ac1i0'],
    ['On Paper', '3ab2302560a09b30e35b9311bff5554e4d0f055a2ca3eb7dd969f868281b29f9i0'],
    ['Mostly Art', '5ae16faba93684887efc960f26d865265b2669e389fd6552e3399f74fa61042bi0'],
    ['Smooth Sailor', '0fc76657166d0dfab82ff8d5f97a3c785d817055c3a989b8b8b4fcdb0effbee7i0'],
];

test('only the selected 2025 HTML artworks use direct on-chain grid previews', () => {
    for (const [name, id] of DIRECT_ONCHAIN_GRID_PREVIEWS) {
        const item = { name, id, collection: '1 of 1s (2025)', content_type: 'text/html;charset=utf-8' };
        assert.equal(shouldUseDirectOnchainPreview(item), true, name);
        assert.equal(getDirectOnchainPreviewSrc(item), `https://ordinals.com/content/${id}`, name);
    }
});

test('other 2025 HTML artworks keep their normal CDN thumbnail path', () => {
    for (const [name, id] of UNTOUCHED_2025_HTML_WORKS) {
        const item = { name, id, collection: '1 of 1s (2025)', content_type: 'text/html;charset=utf-8' };
        assert.equal(shouldUseDirectOnchainPreview(item), false, name);
        assert.equal(getDirectOnchainPreviewSrc(item), null, name);
    }

    const darkHorse = {
        name: 'Dark Horse',
        id: 'cc06be3ea69b948c580e67e27d24f889a1bed0c0fa6acf12187e94ac5c041ac1i0',
        collection: '1 of 1s (2025)',
        artwork_type: 'Javascript/PNG/3D',
        content_type: 'text/html;charset=utf-8',
    };
    assert.equal(getCdnMediaSrc(darkHorse), `https://cdn.lemonhaze.com/assets/assets/${darkHorse.id}.png`);
});

test('recursive print collections use their on-chain HTML as grid previews', () => {
    const item = {
        name: 'Deprivation #1',
        id: 'a851ea29e01f41890d2745af4425ca4351c75e6d5d3b4ff337b3b5aa293b92bai0',
        collection: 'Deprivation (Prints)',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
    };

    assert.equal(shouldUseDirectOnchainPreview(item), true);
    assert.equal(getDirectOnchainPreviewSrc(item), `https://ordinals.com/content/${item.id}`);
});

test('Liminality uses static grid previews while keeping its HTML for the modal', () => {
    const item = {
        name: 'Betwixt & Between',
        id: 'b1b64766543cbcb089d252f67f77d0f562ae96bbee28ad4effee25d42b19da04i0',
        collection: 'Liminality',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
        grid_preview: '/images/liminality/b1b64766543cbcb089d252f67f77d0f562ae96bbee28ad4effee25d42b19da04i0.jpg',
    };

    assert.equal(shouldUseDirectOnchainPreview(item), false);
    assert.equal(getDirectOnchainPreviewSrc(item), null);

    const parent = {
        name: 'Liminality',
        id: 'a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0',
        collection: 'Provenance',
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
        grid_preview: '/images/liminality/a29f08996ef9c1a6d284d520de89abece14ce5e7d01fbf3fa7def17312202332i0.jpg',
    };
    assert.equal(shouldUseDirectOnchainPreview(parent), false);
    assert.equal(getDirectOnchainPreviewSrc(parent), null);
});

test('recursive Satoshi SVG editions use on-chain iframe previews', () => {
    const item = {
        name: 'Satoshi #1',
        id: '8d053a1ab58da680b760562986a09595a75befd06d28ee67e9648e4ffcc52abei0',
        collection: 'Satoshi (Original & Editions)',
        artwork_type: 'SVG',
        content_type: 'image/svg+xml',
    };

    assert.equal(shouldUseDirectOnchainPreview(item), true);
    assert.equal(getDirectOnchainPreviewSrc(item), `https://ordinals.com/content/${item.id}`);
});
