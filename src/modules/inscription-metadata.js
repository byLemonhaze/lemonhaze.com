// Ordinals.com already supplies the modal's live ownership and inscription facts.
// Missing values remain unknown; null must never become inscription #0 or 1970.
export function normalizeInscriptionMetadata(data) {
    const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
    const timestamp = number(data?.timestamp);
    return {
        address: String(data?.address || '').trim() || null,
        charms: Array.isArray(data?.charms) ? data.charms : [],
        ownerLookupSucceeded: Boolean(data),
        number: number(data?.number),
        genesis_timestamp: timestamp == null ? null : timestamp * 1000,
        sat_rarity: null,
    };
}

export async function fetchInscriptionMetadata(id) {
    try {
        const response = await fetch(`https://ordinals.com/r/inscription/${encodeURIComponent(id)}`);
        return normalizeInscriptionMetadata(response.ok ? await response.json() : null);
    } catch {
        return normalizeInscriptionMetadata(null);
    }
}
