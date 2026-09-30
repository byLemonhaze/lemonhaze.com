export const archiveSearchText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
export function filterArchiveEntries(entries, { query = '', kind = '', collection = '', year = '' } = {}) {
    const words = archiveSearchText(query).trim().split(/\s+/).filter(Boolean);
    return entries.filter(entry => {
        const text = archiveSearchText([entry.title, ...entry.paragraphs, ...entry.collections].join(' '));
        return words.every(word => text.includes(word))
            && (!kind || entry.kind === kind)
            && (!collection || entry.collections.includes(collection))
            && (!year || entry.years.includes(year));
    });
}

// One destination per note, even when its related link is also its collection.
export function entryLinks(entry, toCollectionSlug) {
    const links = [...entry.related.map(link => ({ href: link.href, label: link.label })),
        ...entry.collections.map(collection => ({ href: '/' + toCollectionSlug(collection), label: collection }))];
    return [...new Map(links.map(link => [link.href, link])).values()];
}
