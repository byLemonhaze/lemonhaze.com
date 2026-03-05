interface MetadataPayload {
    address: string | null;
    number: number | null;
    genesis_timestamp: string | null;
    sat_rarity: string | null;
    source: string;
    warning: string;
}

const jsonResponse = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        },
    });

const toRecord = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
};

const readString = (record: Record<string, unknown> | null, keys: string[]): string => {
    if (!record) return '';
    for (const key of keys) {
        const raw = record[key];
        if (raw === undefined || raw === null) continue;
        const value = String(raw).trim();
        if (value) return value;
    }
    return '';
};

const readNumber = (record: Record<string, unknown> | null, keys: string[]): number | null => {
    if (!record) return null;
    for (const key of keys) {
        const value = Number(record[key]);
        if (Number.isFinite(value)) return value;
    }
    return null;
};

const normalizeAddress = (value: string): string | null => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return null;
    return trimmed;
};

const fetchJsonSafe = async (url: string): Promise<{ ok: boolean; payload: unknown; status: number }> => {
    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
            },
        });
        const status = response.status;
        let payload: unknown = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }
        return { ok: response.ok, payload, status };
    } catch {
        return { ok: false, payload: null, status: 0 };
    }
};

const fetchFromHiro = async (inscriptionId: string): Promise<{
    ok: boolean;
    address: string | null;
    number: number | null;
    genesis_timestamp: string | null;
    sat_rarity: string | null;
}> => {
    const url = `https://api.hiro.so/ordinals/v1/inscriptions/${encodeURIComponent(inscriptionId)}`;
    const result = await fetchJsonSafe(url);
    if (!result.ok) {
        return {
            ok: false,
            address: null,
            number: null,
            genesis_timestamp: null,
            sat_rarity: null,
        };
    }

    const record = toRecord(result.payload);
    const address = normalizeAddress(readString(record, ['address', 'owner_address', 'owner']));
    const number = readNumber(record, ['number', 'inscription_number']);
    const genesisTimestamp = readString(record, ['genesis_timestamp', 'timestamp', 'created_at']) || null;
    const satRarity = readString(record, ['sat_rarity']) || null;

    return {
        ok: true,
        address,
        number,
        genesis_timestamp: genesisTimestamp,
        sat_rarity: satRarity,
    };
};

export const onRequestGet: PagesFunction = async ({ request }) => {
    const url = new URL(request.url);
    const inscriptionId = String(url.searchParams.get('inscription_id') || '').trim();

    if (!inscriptionId || !inscriptionId.includes('i')) {
        return jsonResponse({ error: 'Missing or invalid inscription_id.' }, 400);
    }

    const hiroData = await fetchFromHiro(inscriptionId);
    const owner = hiroData.address || null;
    const source = hiroData.ok ? 'hiro' : '';
    const warning = owner ? '' : (hiroData.ok ? 'owner_unavailable' : 'hiro_unavailable');

    const payload: MetadataPayload = {
        address: owner,
        number: hiroData.number,
        genesis_timestamp: hiroData.genesis_timestamp,
        sat_rarity: hiroData.sat_rarity,
        source,
        warning,
    };

    return jsonResponse(payload);
};
