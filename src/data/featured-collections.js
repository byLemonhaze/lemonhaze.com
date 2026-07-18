const SATOSHI_ORIGINAL_ID = '88050d79df061385765faefd8b24b4c3103720c86a5b30bf8f2e8fe2b41ec87ei0';

const SOURCES = [
    {
        url: '/data/collections/satoshi.json',
        collection: 'Satoshi (Original & Editions)',
        resolveLineage: (name) => name === 'Satoshi (Original)' ? null : SATOSHI_ORIGINAL_ID,
        resolveMedia: (name) => name === 'Satoshi (Original)'
            ? { artwork_type: 'WEBP', content_type: 'image/webp' }
            : { artwork_type: 'SVG', content_type: 'image/svg+xml' },
    },
    {
        url: '/data/collections/deprivation.json',
        collection: 'Deprivation (Prints)',
        resolveLineage: () => '9a4f72cb41ca2c4d5c591224bf02fe1fc3b977e4231042ccb45b9026c814b475i0',
    },
    {
        url: '/data/collections/mirage.json',
        collection: 'Mirage (Prints)',
        resolveLineage: () => '18328c7aeb829846f0c20d5786a2a383b1b546c985681382cd5f073cfa4e3e15i0',
    },
    {
        url: '/data/collections/trilogy.json',
        collection: 'Trilogy (Prints)',
        resolveLineage: (name) => {
            if (name.startsWith('Glass Breaker')) return '58d21c5f1bbc25932fe1cc784ac47baf8b0ed9241ea989ad2a47b41839d132e7i0';
            if (name.startsWith('Mending Out')) return 'a75945e142877ade9392a0855ef0fdab215af10a7f3e4381d31697c706836228i0';
            if (name.startsWith('Off-Kilter')) return '15ed0a345c10cb0b26fad820f364898f355924dbf0ce5527dd5d7237e0a25964i0';
            return null;
        },
    },
];

function normalizeItem(item, source) {
    const name = String(item?.meta?.name || item?.name || 'Untitled').trim();
    const media = source.resolveMedia?.(name) || {
        artwork_type: 'HTML',
        content_type: 'text/html;charset=utf-8',
    };
    const provenance = source.resolveLineage?.(name) || null;

    return {
        id: String(item?.id || '').trim(),
        name,
        collection: source.collection,
        ...media,
        ...(provenance ? { provenance } : {}),
    };
}

export async function fetchFeaturedCollections() {
    const collections = await Promise.all(SOURCES.map(async (source) => {
        try {
            const response = await fetch(source.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const items = await response.json();
            if (!Array.isArray(items)) throw new Error('Expected an array');
            return items.map((item) => normalizeItem(item, source)).filter((item) => item.id);
        } catch (error) {
            console.error(`Error fetching ${source.collection}:`, error);
            return [];
        }
    }));

    return collections.flat();
}
