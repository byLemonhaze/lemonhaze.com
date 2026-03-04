function createNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
}

const SALES_INDEX_URL = '/data/sales-master/by-inscription.json';
const BTC_SPOT_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

function clean(value) {
    return String(value || '')
        .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
        .trim();
}

function parseRelativeTimestampMs(raw) {
    const m = raw
        .toLowerCase()
        .match(/^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks|mo|month|months|y|yr|yrs|year|years)\s*(ago)?$/);
    if (!m) return Number.NaN;

    const amount = Number(m[1]);
    const unit = m[2];
    if (!Number.isFinite(amount) || amount < 0) return Number.NaN;

    let factorMs = Number.NaN;
    if (unit === 's' || unit.startsWith('sec')) factorMs = 1000;
    else if (unit === 'm' || unit.startsWith('min')) factorMs = 60 * 1000;
    else if (unit === 'h' || unit.startsWith('hr') || unit.startsWith('hour')) factorMs = 60 * 60 * 1000;
    else if (unit === 'd' || unit.startsWith('day')) factorMs = 24 * 60 * 60 * 1000;
    else if (unit === 'w' || unit.startsWith('week')) factorMs = 7 * 24 * 60 * 60 * 1000;
    else if (unit === 'mo' || unit.startsWith('month')) factorMs = 30.4375 * 24 * 60 * 60 * 1000;
    else if (unit === 'y' || unit.startsWith('yr') || unit.startsWith('year')) factorMs = 365.25 * 24 * 60 * 60 * 1000;
    if (!Number.isFinite(factorMs)) return Number.NaN;

    return Date.now() - Math.round(amount * factorMs);
}

function parseSalesTimestampMs(value) {
    const raw = clean(value);
    if (!raw) return Number.NaN;

    if (/^\d+$/.test(raw)) {
        const n = Number(raw);
        if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
    }

    const relative = parseRelativeTimestampMs(raw);
    if (Number.isFinite(relative)) return relative;

    let parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;

    parsed = Date.parse(raw.replace(' UTC', 'Z').replace(' ', 'T'));
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function fmtBtc(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(8).replace(/\.?0+$/, '');
}

function fmtBtcCompact(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2);
}

function fmtUsdToday(btcValue, btcUsdSpot) {
    if (!Number.isFinite(Number(btcValue)) || !Number.isFinite(Number(btcUsdSpot))) return '—';
    return `${usdFormatter.format(Number(btcValue) * Number(btcUsdSpot))} today`;
}

async function fetchSalesIndex() {
    try {
        const res = await fetch(SALES_INDEX_URL, { cache: 'no-store' });
        if (!res.ok) return { inscriptions: {} };
        const payload = await res.json();
        return payload && typeof payload === 'object' ? payload : { inscriptions: {} };
    } catch {
        return { inscriptions: {} };
    }
}

async function fetchBtcUsdSpot() {
    try {
        const res = await fetch(BTC_SPOT_URL, { cache: 'no-store' });
        if (!res.ok) return Number.NaN;
        const payload = await res.json();
        const amount = Number(payload?.data?.amount);
        return Number.isFinite(amount) && amount > 0 ? amount : Number.NaN;
    } catch {
        return Number.NaN;
    }
}

function computeSalesSummary(indexPayload) {
    const inscriptions = indexPayload?.inscriptions && typeof indexPayload.inscriptions === 'object'
        ? indexPayload.inscriptions
        : {};

    let primaryBtc = 0;
    let secondaryBtc = 0;
    const byCollection = new Map();

    for (const eventsRaw of Object.values(inscriptions)) {
        const events = Array.isArray(eventsRaw)
            ? eventsRaw.filter((event) => Number.isFinite(Number(event?.priceBTC)))
            : [];
        if (!events.length) continue;

        const explicitPrimaryIndices = new Set(
            events
                .map((event, index) => ({ event, index }))
                .filter(({ event }) => clean(event?.saleType).toLowerCase() === 'primary')
                .map(({ index }) => index),
        );
        const explicitClassifiedCount = events.filter((event) => {
            const kind = clean(event?.saleType).toLowerCase();
            return kind === 'primary' || kind === 'secondary';
        }).length;

        let oldestIdx = -1;
        if (!explicitPrimaryIndices.size && !explicitClassifiedCount) {
            let oldestTs = Number.POSITIVE_INFINITY;
            for (let i = 0; i < events.length; i += 1) {
                const ts = parseSalesTimestampMs(events[i]?.timestamp);
                const rank = Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
                if (rank < oldestTs) {
                    oldestTs = rank;
                    oldestIdx = i;
                }
            }
            if (oldestIdx < 0) oldestIdx = events.length - 1;
        }

        for (let i = 0; i < events.length; i += 1) {
            const event = events[i];
            const price = Number(event.priceBTC);
            const isPrimary = explicitPrimaryIndices.size
                ? explicitPrimaryIndices.has(i)
                : (!explicitClassifiedCount && i === oldestIdx);

            if (isPrimary) primaryBtc += price;
            else secondaryBtc += price;

            const slug = clean(event.collectionSlug) || 'unknown';
            const current = byCollection.get(slug) || {
                slug,
                sales: 0,
                primaryBtc: 0,
                secondaryBtc: 0,
                totalBtc: 0,
            };
            current.sales += 1;
            if (isPrimary) current.primaryBtc += price;
            else current.secondaryBtc += price;
            current.totalBtc += price;
            byCollection.set(slug, current);
        }
    }

    const collections = [...byCollection.values()]
        .map((entry) => ({
            ...entry,
            primaryBtc: Number(entry.primaryBtc.toFixed(8)),
            secondaryBtc: Number(entry.secondaryBtc.toFixed(8)),
            totalBtc: Number(entry.totalBtc.toFixed(8)),
        }))
        .sort((a, b) => b.totalBtc - a.totalBtc);

    return {
        primaryBtc: Number(primaryBtc.toFixed(8)),
        secondaryBtc: Number(secondaryBtc.toFixed(8)),
        collections,
    };
}

function createStatCard(
    label,
    value,
    valueClassName = '',
    secondaryText = null,
    valueSizeClass = 'text-2xl md:text-3xl',
    wrapperClassName = ''
) {
    const card = createNode('div', `min-w-0 flex flex-col ${wrapperClassName}`.trim());
    const labelNode = createNode(
        'div',
        'text-[7px] md:text-[9px] uppercase tracking-[0.18em] md:tracking-[0.3em] text-white/25 mb-0.5 leading-none',
        label
    );
    const rendered = typeof value === 'number' ? value.toLocaleString() : String(value);
    const valueNode = createNode(
        'div',
        `${valueSizeClass} leading-[0.92] font-bold font-mono ${valueClassName}`.trim(),
        rendered
    );
    card.appendChild(labelNode);
    card.appendChild(valueNode);
    if (secondaryText != null) {
        const tiny = createNode(
            'div',
            'mt-0.5 text-[9px] md:text-[11px] text-white/45 font-mono leading-none',
            String(secondaryText)
        );
        card.appendChild(tiny);
    }
    return card;
}

function createMarketButton(label, href) {
    const link = createNode(
        'a',
        'px-2 py-0.5 border border-white/10 bg-[#131313] hover:border-white/30 transition-colors text-[10px] font-mono',
        label
    );
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
}

function createTableHeader() {
    const headerRow = createNode(
        'tr',
        'text-[10px] uppercase tracking-widest text-white/20 border-b border-white/5'
    );

    const columns = [
        { label: 'Collection', className: 'pb-2 font-medium' },
        { label: 'Year', className: 'pb-2 px-2 font-medium' },
        { label: 'Inscribed', className: 'pb-2 px-2 font-medium text-right hidden sm:table-cell' },
        { label: 'Circ.', className: 'pb-2 px-2 font-medium text-right' },
        { label: 'Burn', className: 'pb-2 px-2 font-medium text-right hidden sm:table-cell' },
        { label: 'Links', className: 'pb-2 pl-4 font-medium text-right' },
    ];

    columns.forEach(({ label, className }) => {
        const th = createNode('th', className, label);
        headerRow.appendChild(th);
    });

    return headerRow;
}

function createSupplyRow({
    row,
    routeKeys,
    toCollectionSlug,
    slugifyCollectionName,
    marketLinks,
    linkOverrides,
}) {
    const burned = row.inscribed - row.circulating;
    const collectionSlug = toCollectionSlug(row.name) || slugifyCollectionName(row.name);
    const collectionLink = linkOverrides[row.name] || `/?${routeKeys.collection}=${encodeURIComponent(collectionSlug)}`;
    const links = marketLinks[row.name] || {};

    const tr = createNode('tr', 'border-b border-white/5 text-[11px] hover:bg-white/5');

    const nameCell = createNode('td', 'py-2 pr-4 font-medium');
    const nameLink = createNode('a', 'hover:underline text-white', row.name);
    nameLink.href = collectionLink;
    nameCell.appendChild(nameLink);

    const yearCell = createNode('td', 'py-2 px-2 text-white/40', String(row.year));
    const inscribedCell = createNode('td', 'py-2 px-2 text-right font-mono hidden sm:table-cell', String(row.inscribed));
    const circulatingCell = createNode('td', 'py-2 px-2 text-right font-mono text-white/90', String(row.circulating));
    const burnedCell = createNode('td', 'py-2 px-2 text-right font-mono text-white/30 hidden sm:table-cell', String(burned));

    const linksCell = createNode('td', 'py-2 pl-4 text-right');
    const linksWrap = createNode('div', 'flex justify-end gap-1');
    if (links.me) linksWrap.appendChild(createMarketButton('ME', links.me));
    if (links.gamma) linksWrap.appendChild(createMarketButton('Gamma', links.gamma));
    linksCell.appendChild(linksWrap);

    tr.appendChild(nameCell);
    tr.appendChild(yearCell);
    tr.appendChild(inscribedCell);
    tr.appendChild(circulatingCell);
    tr.appendChild(burnedCell);
    tr.appendChild(linksCell);

    return tr;
}

export function createSupplySectionNode({
    ordinalsSupplyData,
    marketLinks,
    linkOverrides,
    routeKeys,
    toCollectionSlug,
    slugifyCollectionName,
}) {
    let ordInscribed = 0;
    let ordCirc = 0;
    let ordBurned = 0;

    ordinalsSupplyData.forEach((row) => {
        ordInscribed += row.inscribed;
        ordCirc += row.circulating;
        ordBurned += row.inscribed - row.circulating;
    });

    const root = createNode('div', 'space-y-4 md:space-y-8 animate-fade-in');

    const statsStrip = createNode('div', 'mb-3 md:mb-8 md:border-b md:border-white/8 pb-2 md:pb-6');

    const mobileWrap = createNode('div', 'md:hidden');
    const mobileTopRow = createNode(
        'div',
        'grid grid-cols-3 border border-white/10 divide-x divide-white/10 bg-white/[0.01]'
    );
    mobileTopRow.appendChild(
        createStatCard('Inscribed', ordInscribed, '', null, 'text-[1.28rem]', 'px-1.5 py-1.5 text-center')
    );
    mobileTopRow.appendChild(
        createStatCard('Circulating', ordCirc, 'text-white/90', null, 'text-[1.28rem]', 'px-1.5 py-1.5 text-center')
    );
    mobileTopRow.appendChild(
        createStatCard('Burned', ordBurned, 'text-white/30', null, 'text-[1.28rem]', 'px-1.5 py-1.5 text-center')
    );

    const mobileBottomRow = createNode(
        'div',
        'grid grid-cols-2 border-x border-b border-white/10 divide-x divide-white/10 bg-white/[0.01]'
    );
    const mobilePrimaryCard = createStatCard(
        'Primary Sales',
        '— BTC',
        'text-white/90',
        '—',
        'text-[0.98rem]',
        'px-1.5 py-1.5 text-center'
    );
    const mobileSecondaryCard = createStatCard(
        'Secondary Volume',
        '— BTC',
        'text-white/90',
        '—',
        'text-[0.98rem]',
        'px-1.5 py-1.5 text-center'
    );
    mobileBottomRow.appendChild(mobilePrimaryCard);
    mobileBottomRow.appendChild(mobileSecondaryCard);
    mobileWrap.appendChild(mobileTopRow);
    mobileWrap.appendChild(mobileBottomRow);

    const desktopGrid = createNode('div', 'hidden md:grid md:grid-cols-5 md:gap-6');
    desktopGrid.appendChild(createStatCard('Inscribed', ordInscribed, '', null, 'text-3xl'));
    desktopGrid.appendChild(createStatCard('Circulating', ordCirc, 'text-white/90', null, 'text-3xl'));
    desktopGrid.appendChild(createStatCard('Burned', ordBurned, 'text-white/30', null, 'text-3xl'));
    const desktopPrimaryCard = createStatCard('Primary Sales', '— BTC', 'text-white/90', '—', 'text-xl');
    const desktopSecondaryCard = createStatCard('Secondary Volume', '— BTC', 'text-white/90', '—', 'text-xl');
    desktopGrid.appendChild(desktopPrimaryCard);
    desktopGrid.appendChild(desktopSecondaryCard);

    statsStrip.appendChild(mobileWrap);
    statsStrip.appendChild(desktopGrid);
    root.appendChild(statsStrip);

    const ordinalsSection = createNode('section');
    const ordinalsTitle = createNode(
        'h3',
        'text-xs font-bold uppercase tracking-widest text-white/30 mb-3 md:mb-4 flex items-center gap-2'
    );
    ordinalsTitle.appendChild(createNode('span', 'w-4 h-[1px] bg-white/10'));
    ordinalsTitle.appendChild(document.createTextNode('Digital Ordinals'));
    ordinalsSection.appendChild(ordinalsTitle);

    const tableWrap = createNode('div', 'overflow-x-auto');
    const table = createNode('table', 'w-full text-left');
    const thead = createNode('thead');
    thead.appendChild(createTableHeader());
    table.appendChild(thead);

    const tbody = createNode('tbody');
    ordinalsSupplyData.forEach((row) => {
        tbody.appendChild(createSupplyRow({
            row,
            routeKeys,
            toCollectionSlug,
            slugifyCollectionName,
            marketLinks,
            linkOverrides,
        }));
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    ordinalsSection.appendChild(tableWrap);

    root.appendChild(ordinalsSection);

    const physicalSection = createNode('section', 'opacity-80');
    const physicalTitle = createNode(
        'h3',
        'text-xs font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2'
    );
    physicalTitle.appendChild(createNode('span', 'w-4 h-[1px] bg-white/10'));
    physicalTitle.appendChild(document.createTextNode('Physical & Other'));
    physicalSection.appendChild(physicalTitle);

    const list = createNode('ul', 'space-y-2 text-xs text-white/60 font-mono');
    const lines = [
        '- 16 Signed Prints on SCR/Hemp (2025)',
        '- 19 Signed Marker on Jeans (2023-25)',
        '- 1 E-Paper "Sex, Scotch & Soda" (2025)',
    ];
    lines.forEach((line) => list.appendChild(createNode('li', null, line)));
    physicalSection.appendChild(list);
    root.appendChild(physicalSection);

    const primaryValueNodes = [
        mobilePrimaryCard.querySelector('div:nth-child(2)'),
        desktopPrimaryCard.querySelector('div:nth-child(2)'),
    ].filter(Boolean);
    const primaryUsdNodes = [
        mobilePrimaryCard.querySelector('div:nth-child(3)'),
        desktopPrimaryCard.querySelector('div:nth-child(3)'),
    ].filter(Boolean);
    const secondaryValueNodes = [
        mobileSecondaryCard.querySelector('div:nth-child(2)'),
        desktopSecondaryCard.querySelector('div:nth-child(2)'),
    ].filter(Boolean);
    const secondaryUsdNodes = [
        mobileSecondaryCard.querySelector('div:nth-child(3)'),
        desktopSecondaryCard.querySelector('div:nth-child(3)'),
    ].filter(Boolean);

    void (async () => {
        const [salesIndex, btcUsdSpot] = await Promise.all([
            fetchSalesIndex(),
            fetchBtcUsdSpot(),
        ]);
        const summary = computeSalesSummary(salesIndex);

        primaryValueNodes.forEach((node) => {
            node.textContent = `${fmtBtcCompact(summary.primaryBtc)} BTC`;
        });
        primaryUsdNodes.forEach((node) => {
            node.textContent = fmtUsdToday(summary.primaryBtc, btcUsdSpot);
        });
        secondaryValueNodes.forEach((node) => {
            node.textContent = `${fmtBtcCompact(summary.secondaryBtc)} BTC`;
        });
        secondaryUsdNodes.forEach((node) => {
            node.textContent = fmtUsdToday(summary.secondaryBtc, btcUsdSpot);
        });
    })();

    return root;
}
