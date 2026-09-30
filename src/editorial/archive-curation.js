// Editorial relevance to the current practice, independent of posting dates.
// Keep all notes; this sequence controls emphasis rather than availability.
export const STUDIO_NOTE_ORDER = [
    'gentlemen-work-in-progress', 'hosoi', 'chamber-of-reflection',
    'montreal-exhibition', 'best-before-performance', 'best-before-making-of',
    'chanchanoks-temple', 'paint-engine-layers', 'writing-on-bitcoin',
    'manufactured-notes', 'seasonal-soundtrack', 'three-techniques',
    'music-and-images', 'signing-pennsylvania', 'good-night-print',
    'la-tentation', 'travelling-palettes', 'best-before-palettes',
    'opening-number-33', 'gentleman-11-print', 'provenance-time',
    'berlin-composition', 'paris', 'downtown', 'la-carte', 'minute-papillon',
    'volatility', 'tad-small', 'fragmented-works', 'trilogy',
    'colour-across-tools', 'marilyn-four-ways', 'the-mask',
    'la-tete-dans-les-etoiles', 'marilyn-privacy', 'blood-lemon-tango',
    'presentation-studies', 'digital-life', 'little-get-away',
    'unregulated-minds', 'artifacts', 'shelling-out', 'le-hazy-night',
    'tuna', 'la-pomme-pourrite', 'dogmatic-structure', 'peak-audacity',
    'bento-box', 'sushi', 'portrait-2490', 'deville', 'degeneration',
    'smoke-break', 'jardin-secret', 'early-mini-series',
    'workspace', 'casa-flamingo', 'before-ordinals',
];
const priorities = new Map(STUDIO_NOTE_ORDER.map((slug, i) => [slug, i]));
export function sortStudioNotes(entries, order = 'selected') {
    const priority = entry => priorities.get(entry.slug) ?? STUDIO_NOTE_ORDER.length;
    const latest = entry => Math.max(0, ...entry.sources.map(source => Date.parse(source.date)).filter(Number.isFinite));
    return [...entries].sort((a, b) => {
        if (order === 'newest' || order === 'oldest') {
            const first = latest(a), second = latest(b);
            if (!first || !second) return !first - !second || priority(a) - priority(b);
            return (order === 'newest' ? second - first : first - second) || priority(a) - priority(b);
        }
        return priority(a) - priority(b);
    });
}
