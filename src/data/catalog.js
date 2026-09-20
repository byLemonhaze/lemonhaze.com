// The browser and static export must use the same inscription roster.
export function assembleArtworkCatalog(provenance, bestBefore, featured) {
    const lineage = provenance.find(item => item.collection === 'BEST BEFORE')?.provenance;
    const savedById = new Map(provenance.map(item => [item.id, item]));
    const bb = bestBefore.map(item => ({
        ...savedById.get(item.id),
        ...(lineage ? { provenance: lineage } : {}),
        ...item,
    }));
    // Keep known parents and burned records even when absent from a live feed.
    const liveIds = new Set(bb.map(item => item.id));
    const primary = [
        ...bb,
        ...provenance.filter(item => !liveIds.has(item.id)),
    ];
    const featuredIds = new Set(featured.map(item => item.id));
    const ordered = [
        ...featured.filter(item => item.collection !== '1 of 1s (2026)'),
        ...primary.filter(item => !featuredIds.has(item.id)),
        ...featured.filter(item => item.collection === '1 of 1s (2026)'),
    ];
    const seen = new Set();
    return ordered.filter(item => {
        if (!/^[a-f0-9]{64}i\d+$/.test(item.id) || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
}
