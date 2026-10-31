import { ARTWORKS } from '../../shared/shop-artworks.js';
import { TEXTILES } from '../../shared/shop-textiles.js';

const origin = 'https://lemonhaze.com';
export function structuredDataFor(metadata) {
    const artist = { '@id': `${origin}/#artist` };
    const graph = [
        { '@type': 'Person', ...artist, name: 'Lemonhaze', url: origin + '/about' },
        { '@type': 'WebSite', '@id': origin + '/#website', url: origin, name: 'Lemonhaze', creator: artist },
        { '@type': 'WebPage', '@id': metadata.canonical + '#page', url: metadata.canonical,
            name: metadata.title, description: metadata.description,
            isPartOf: { '@id': origin + '/#website' }, about: artist },
    ];
    if (metadata.path === '/shop') {
        const works = [...ARTWORKS, ...TEXTILES].map(work => ({
            '@type': ['Product', 'VisualArtwork'], '@id': `${origin}/shop#${work.id}`,
            name: work.title, description: work.description, creator: artist,
            image: new URL(work.preview, origin).href,
            artMedium: work.id.startsWith('print') ? 'Fine art print on cotton rag paper' : 'Marker on textile',
            // Prelaunch: no Offers, availability or prices. Images are product previews.
        }));
        graph.push(...works, {
            '@type': 'ItemList', '@id': origin + '/shop#works', name: 'Prints and textile works',
            numberOfItems: works.length, itemListElement: works.map((work, i) => ({
                '@type': 'ListItem', position: i + 1, item: { '@id': work['@id'] },
            })),
        });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
}
