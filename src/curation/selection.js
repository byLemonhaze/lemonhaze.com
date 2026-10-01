// Local editorial selections, independent of the complete chronological catalogue.
// Both surfaces share this order, including the supplied Untitled image.
export const UNTITLED_WORK = {
    id: 'untitled-suspended-ink',
    name: 'Untitled',
    caption: 'X - 202?',
    year: '202?',
    comingSoon: true,
    grid_preview: '/editorial/assets/untitled-suspended-ink.jpg',
};
export const CAROUSEL_WORK_IDS = [
    'c6a7aa6853e257c11fed5faa51d33772a11142425d0275075312f8c3e205668fi0', // Hózhó
    UNTITLED_WORK.id,
    'b32cc2fbacb3aa3b83408a8426873a3a649291da44538a462d76b3a84699f1e9i0', // Chanchanok's Temple
    '4be08b20f356a79d03871943c1e80d1123ce4047f3256f10113212596c8bb021i0', // Porcelain Sunset
    '8781dfea6d8f4db71df9c3674c2a555ae1815bdb627685bd1b6ab2a028678c42i0', // Chamber of Reflection
    'adfb187edd46c3125d74e91ee32817aa23b41fbc93982c137d7f83bed6cf3f3ci0', // Gentleman Nº6
    'c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i401', // BEST BEFORE Nº402
    '3966f90bf371dbc520bfebed868fd30adc574f60e900118308587001cb27514bi0', // Hosoi
    '00d08f2e808d325139649b50f77204a71d9624e7fd7e60a28907a4836614c49ei0', // Rue Cuvillier
    '757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0', // Gentleman Nº1
];

export const SELECTED_WORK_IDS = [...CAROUSEL_WORK_IDS];
export function selectedWorks(artworks, ids = SELECTED_WORK_IDS) {
    const byId = new Map(artworks.map(work => [work.id, work]));
    byId.set(UNTITLED_WORK.id, UNTITLED_WORK);
    return ids.map(id => byId.get(id)).filter(Boolean).map(work =>
        work.id === 'c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i401'
            ? { ...work, grid_preview: '/editorial/assets/best-before-402.jpg' }
            : work);
}
export const SELECTED_SERIES = [
    ['Gentlemen / Lotus', 'gentlemen', 'An aspiration that keeps changing.', [['Gentlemen', 'gentlemen'], ['Lotus', 'lotus']]],
    ['Montreal', 'montreal', 'Memories of a city, translated into texture.'],
    ['BEST BEFORE', 'best-before', 'Sealed, Opened, Expired'],
    ['Manufactured / Games', 'manufactured', 'Textile influences, transformation, and three works becoming one.', [['Manufactured', 'manufactured'], ['Games', 'games']]],
    ['1/1s', '1-of-1s-2026', 'Individual works, by year.'],
    ['Liminality', 'liminality', 'Between one state and the next.'],
];

// Artist-selected covers; independent of collection parent and catalogue ordering.
export const SELECTED_SERIES_COVERS = {
    'Gentlemen / Lotus': 'd17d6c2e96c9b129ec1fbb9a21742e06a063976494d306f6b4086a519913cc92i0', // Gentleman Nº3
    'Manufactured / Games': '0a20ef85c7deae03895d6eb3a6fb735a551b56dcc5ec67a619bdfc0c4986b3dbi0', // Game Nº9
    'Games': '0a20ef85c7deae03895d6eb3a6fb735a551b56dcc5ec67a619bdfc0c4986b3dbi0', // Game Nº9
    'Lotus': 'a71cf3f3446fad723bb99ba5385bae78cd6a0c55f082ad4c4b487e84b19ac890i0', // Lotus #4
    'Montreal': 'e8333e96e84d038b2400a2d46853f676660a18adbbf22e8d9c15ca9894235e3bi0', // Five Roses
    'Ma ville en quatre temps': '298a55a78a48faafe5ac119cb48dd2235dc9c37210e30c793f39c280b2618f32i0', // L'Hiver, la nuit
    'Berlin': 'fd188a970767ef5ef2f4bbae2c641b8b314bcf3eb1305fff9f3ebc5ebecfd448i0', // 99 Francs
    'La Tentation': 'daf064a28fd61c3f6fdaa223a8f9080c60635c3caf691c3accc6f8f0a8935b93i0', // La Tentation Nº0
    '1/1s': 'a7a29fda9317c0689b6cebba74ef9381e46fc783f073619643a0ec6f28edd49bi0', // Family Portrait
};

const coreSlugs = new Set(SELECTED_SERIES.flatMap(([, slug,, links]) => [slug, ...(links || []).map(([, path]) => path)]));
export function isCoreCollectionSlug(slug) {
    return coreSlugs.has(slug) || /^1-of-1s-\d{4}$/.test(slug);
}
