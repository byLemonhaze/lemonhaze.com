const ARTIST_ADDRESS = 'bc1pf94n8hfurp7j4l8mmywd2mzdeqw6s0h59r68p7khjuzzn8uelg5svwk5zr';

// A missing address alone is never evidence of a burn. Ord's explicit burned
// charm is the authoritative signal; preserve a recorded local charm offline.
export function getArtworkOwnership(item = {}, metadata = {}) {
    const charms = value => Array.isArray(value) ? value : String(value || '').split(/[\s,]+/);
    const burned = [...charms(metadata.charms), ...charms(item.charms)]
        .some(charm => /^(burned|burnt)$/i.test(charm));
    if (burned) return { label: 'Burned', status: 'burned' };
    const address = String(metadata.address || '').trim();
    if (address.toLowerCase() === ARTIST_ADDRESS) return { label: 'Lemonhaze · Artist’s collection', status: 'artist', address };
    if (address) return { label: address, status: 'owned' };
    return { label: metadata.ownerLookupSucceeded ? 'Not reported' : 'Temporarily unavailable', status: 'unknown' };
}
