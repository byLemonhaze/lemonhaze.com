// Local editorial selections, independent of the complete chronological catalogue.
// Selected Work follows the landing carousel, with two additional works.
export const CAROUSEL_WORK_IDS = [
    'c6a7aa6853e257c11fed5faa51d33772a11142425d0275075312f8c3e205668fi0', // Hózhó
    '3966f90bf371dbc520bfebed868fd30adc574f60e900118308587001cb27514bi0', // Hosoi
    'b32cc2fbacb3aa3b83408a8426873a3a649291da44538a462d76b3a84699f1e9i0', // Chanchanok's Temple
    '4be08b20f356a79d03871943c1e80d1123ce4047f3256f10113212596c8bb021i0', // Porcelain Sunset
    '8781dfea6d8f4db71df9c3674c2a555ae1815bdb627685bd1b6ab2a028678c42i0', // Chamber of Reflection
    'b8e34271e6d76d3d3aeea0756d9ad281132196fc30bb62d35ca8fe9b0fceff97i0', // Paysage
    '22c45a61ac26e42545e29a1c0af72190134f94f489596619f0b0e023908952e3i0', // Lotus Tigré
    'adfb187edd46c3125d74e91ee32817aa23b41fbc93982c137d7f83bed6cf3f3ci0', // Gentleman Nº6
    'c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i401', // BEST BEFORE Nº402
    '298a55a78a48faafe5ac119cb48dd2235dc9c37210e30c793f39c280b2618f32i0', // L'Hiver, la nuit
    '00d08f2e808d325139649b50f77204a71d9624e7fd7e60a28907a4836614c49ei0', // Rue Cuvillier
    '757c7d19f53501b9f1e11f49f1731622d5d257eed99c721b32af0438d0d1f9cfi0', // Gentleman Nº1
];

// Selected Work extends the landing selection, in the same order.
export const SELECTED_WORK_IDS = [
    ...CAROUSEL_WORK_IDS,
    '989242547accbd3df2611aeae8c311e162d4d188f046d8562f18f6684ade4f63i0', // From Berlin to Saigon
    '35b36fdc0f108c535790d86544abd707ed6492925134dbc7ff7785f6cdcd8c42i0', // Le Confessionnal (Sin City)
];
export function selectedWorks(artworks, ids = SELECTED_WORK_IDS) {
    const byId = new Map(artworks.map(work => [work.id, work]));
    return ids.map(id => byId.get(id)).filter(Boolean).map(work =>
        work.id === 'c8192d6e0d90877d0ecb5d25151ea6dfe8964b7f96d5aaeffb0013c78cf3b322i401'
            ? { ...work, grid_preview: '/editorial/assets/best-before-402.jpg' }
            : work);
}
export const SELECTED_SERIES = [
    ['Gentlemen', 'gentlemen', 'An aspiration that keeps changing.'],
    ['Lotus', 'lotus', 'An early body of work.'],
    ['Montreal', 'montreal', 'Memories of a city, translated into texture.'],
    ['BEST BEFORE', 'best-before', 'Sealed, revealed, changed by time.'],
    ['Manufactured', 'manufactured', 'Textile influences and the life of an image.'],
    ['Games', 'games', 'Three works become one.'],
    ['Ma ville en quatre temps', 'ma-ville-en-quatre-temps', 'A city in four parts.'],
    ['Tōri no Roji', 'tori-no-roji', 'A series in four works.'],
    ['Liminality', 'liminality', 'Between one state and the next.'],
    ['Chrysalis', 'chrysalis', 'Transformation taking shape from within.'],
    ['La Tentation', 'la-tentation', ''],
    ['1/1s', '1-of-1s-2026', 'Individual works, by year.'],
];

// Artist-selected covers; independent of collection parent and catalogue ordering.
export const SELECTED_SERIES_COVERS = {
    'Gentlemen': 'd17d6c2e96c9b129ec1fbb9a21742e06a063976494d306f6b4086a519913cc92i0', // Gentleman Nº3
    'Manufactured': 'fe7de1e35036400088171f4419c9d231b37420d63db6653c6acc4b44bf3885fbi141', // Manufactured Nº143
    'Games': '0a20ef85c7deae03895d6eb3a6fb735a551b56dcc5ec67a619bdfc0c4986b3dbi0', // Game Nº9
    'Lotus': 'a71cf3f3446fad723bb99ba5385bae78cd6a0c55f082ad4c4b487e84b19ac890i0', // Lotus #4
    'Montreal': 'e8333e96e84d038b2400a2d46853f676660a18adbbf22e8d9c15ca9894235e3bi0', // Five Roses
    'Ma ville en quatre temps': '298a55a78a48faafe5ac119cb48dd2235dc9c37210e30c793f39c280b2618f32i0', // L'Hiver, la nuit
    'Chrysalis': 'da1f4317a9ea57ff35c07de6c722d88287a307967cfa0711487afb079f497a1ci0', // Ubuntu
    'La Tentation': 'daf064a28fd61c3f6fdaa223a8f9080c60635c3caf691c3accc6f8f0a8935b93i0', // La Tentation Nº0
    '1/1s': 'a7a29fda9317c0689b6cebba74ef9381e46fc783f073619643a0ec6f28edd49bi0', // Family Portrait
};
