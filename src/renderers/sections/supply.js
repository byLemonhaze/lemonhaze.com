import {
    computeSalesSummary,
    formatBtcCompact,
    formatUsdToday,
    getBtcUsdSpot,
    getSalesIndex,
} from '../../modules/sales-ledger.js';

function createNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
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
        'text-[7px] md:text-[9px] uppercase tracking-[0.18em] md:tracking-[0.3em] text-white/25 mb-0.5 leading-none whitespace-nowrap',
        label
    );
    const rendered = typeof value === 'number' ? value.toLocaleString() : String(value);
    const valueNode = createNode(
        'div',
        `${valueSizeClass} leading-[0.92] font-bold font-mono tabular-nums whitespace-nowrap ${valueClassName}`.trim(),
        rendered
    );
    card.appendChild(labelNode);
    card.appendChild(valueNode);
    if (secondaryText != null) {
        const tiny = createNode(
            'div',
            'mt-0.5 overflow-hidden text-ellipsis text-[9px] md:text-[10px] text-white/45 font-mono leading-none whitespace-nowrap',
            String(secondaryText)
        );
        card.appendChild(tiny);
    }
    return card;
}

function createMarketButton(label, href) {
    const link = createNode(
        'a',
        'px-2 py-0.5 border border-white/10 bg-[#131313] hover:border-white/30 transition-colors text-[10px] font-mono whitespace-nowrap',
        label
    );
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
}

function createMarketLinksWrap(links, className = 'flex flex-wrap justify-end gap-1') {
    const linksWrap = createNode('div', className);
    if (links.ordnet) linksWrap.appendChild(createMarketButton('Ord.net', links.ordnet));
    if (links.gamma) linksWrap.appendChild(createMarketButton('Gamma', links.gamma));
    if (links.satflow) linksWrap.appendChild(createMarketButton('Satflow', links.satflow));
    return linksWrap;
}

function createTableHeader(columns) {
    const headerRow = createNode(
        'tr',
        'text-[10px] uppercase tracking-widest text-white/20 border-b border-white/5'
    );

    columns.forEach(({ label, className }) => {
        const th = createNode('th', className, label);
        headerRow.appendChild(th);
    });

    return headerRow;
}

function defaultResolveCollectionHref({
    row,
    toCollectionSlug,
    slugifyCollectionName,
    linkOverrides,
}) {
    const collectionSlug = toCollectionSlug?.(row.name) || slugifyCollectionName?.(row.name);
    return linkOverrides[row.name] || `/${encodeURIComponent(collectionSlug)}`;
}

function createSupplyRow({
    row,
    toCollectionSlug,
    slugifyCollectionName,
    marketLinks,
    linkOverrides,
    resolveCollectionHref,
}) {
    const burned = row.inscribed - row.circulating;
    const collectionLink = resolveCollectionHref({
        row,
        toCollectionSlug,
        slugifyCollectionName,
        linkOverrides,
    });
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
    linksCell.appendChild(createMarketLinksWrap(links));

    tr.appendChild(nameCell);
    tr.appendChild(yearCell);
    tr.appendChild(inscribedCell);
    tr.appendChild(circulatingCell);
    tr.appendChild(burnedCell);
    tr.appendChild(linksCell);

    return tr;
}

function createEthSupplyRow(row) {
    const tr = createNode('tr', 'border-b border-white/5 text-[11px] hover:bg-white/5');

    const nameCell = createNode('td', 'py-2 pr-4 font-medium', row.name);
    const platformCell = createNode('td', 'py-2 px-2 text-white/40 hidden sm:table-cell', row.platform);
    const yearCell = createNode('td', 'py-2 px-2 text-white/40', String(row.year));
    const countCell = createNode('td', 'py-2 pl-4 text-right font-mono text-white/90', String(row.count));

    tr.appendChild(nameCell);
    tr.appendChild(platformCell);
    tr.appendChild(yearCell);
    tr.appendChild(countCell);

    return tr;
}

function createMobileMetric(label, value, valueClassName = 'text-white/80') {
    const metric = createNode('div', 'min-w-0 border border-white/10 bg-white/[0.015] px-2 py-1.5');
    metric.appendChild(createNode(
        'div',
        'text-[8px] uppercase tracking-[0.16em] text-white/25 leading-none',
        label
    ));
    metric.appendChild(createNode(
        'div',
        `mt-1 text-[11px] font-mono leading-none break-words ${valueClassName}`.trim(),
        String(value)
    ));
    return metric;
}

function createSupplyCard({
    row,
    toCollectionSlug,
    slugifyCollectionName,
    marketLinks,
    linkOverrides,
    resolveCollectionHref,
}) {
    const burned = row.inscribed - row.circulating;
    const collectionLink = resolveCollectionHref({
        row,
        toCollectionSlug,
        slugifyCollectionName,
        linkOverrides,
    });
    const links = marketLinks[row.name] || {};

    const card = createNode('article', 'min-w-0 border border-white/10 bg-white/[0.015] p-3');

    const nameLink = createNode(
        'a',
        'block text-[12px] font-bold uppercase tracking-[0.12em] text-white break-words',
        row.name
    );
    nameLink.href = collectionLink;
    card.appendChild(nameLink);

    const metrics = createNode('div', 'mt-3 grid grid-cols-3 gap-2');
    metrics.appendChild(createMobileMetric('Year', row.year, 'text-white/45'));
    metrics.appendChild(createMobileMetric('Circ.', row.circulating));
    metrics.appendChild(createMobileMetric('Burn', burned, 'text-white/35'));
    card.appendChild(metrics);

    const linksWrap = createMarketLinksWrap(links, 'mt-3 flex flex-wrap gap-1');
    if (linksWrap.childNodes.length) {
        card.appendChild(linksWrap);
    }

    return card;
}

function createEthSupplyCard(row) {
    const card = createNode('article', 'min-w-0 border border-white/10 bg-white/[0.015] p-3');
    card.appendChild(createNode(
        'div',
        'text-[12px] font-bold uppercase tracking-[0.12em] text-white break-words',
        row.name
    ));

    const metrics = createNode('div', 'mt-3 grid grid-cols-3 gap-2');
    metrics.appendChild(createMobileMetric('Platform', row.platform, 'text-white/45'));
    metrics.appendChild(createMobileMetric('Year', row.year, 'text-white/45'));
    metrics.appendChild(createMobileMetric('Supply', row.count));
    card.appendChild(metrics);

    return card;
}

function createOrdinalsSupplyListSection({
    title,
    rows,
    toCollectionSlug,
    slugifyCollectionName,
    marketLinks,
    linkOverrides,
    resolveCollectionHref,
}) {
    const section = createNode('section');
    const heading = createNode(
        'h3',
        'text-xs font-bold uppercase tracking-widest text-white/30 mb-3 md:mb-4 flex items-center gap-2'
    );
    heading.appendChild(createNode('span', 'w-4 h-[1px] bg-white/10'));
    heading.appendChild(document.createTextNode(title));
    section.appendChild(heading);

    const mobileList = createNode('div', 'sm:hidden space-y-2');
    rows.forEach((row) => {
        mobileList.appendChild(createSupplyCard({
            row,
            toCollectionSlug,
            slugifyCollectionName,
            marketLinks,
            linkOverrides,
            resolveCollectionHref,
        }));
    });
    section.appendChild(mobileList);

    const tableWrap = createNode('div', 'hidden sm:block overflow-x-auto');
    const table = createNode('table', 'w-full text-left');
    const thead = createNode('thead');
    thead.appendChild(createTableHeader([
        { label: 'Collection', className: 'pb-2 font-medium' },
        { label: 'Year', className: 'pb-2 px-2 font-medium' },
        { label: 'Inscribed', className: 'pb-2 px-2 font-medium text-right hidden sm:table-cell' },
        { label: 'Circ.', className: 'pb-2 px-2 font-medium text-right' },
        { label: 'Burn', className: 'pb-2 px-2 font-medium text-right hidden sm:table-cell' },
        { label: 'Links', className: 'pb-2 pl-4 font-medium text-right' },
    ]));
    table.appendChild(thead);

    const tbody = createNode('tbody');
    rows.forEach((row) => {
        tbody.appendChild(createSupplyRow({
            row,
            toCollectionSlug,
            slugifyCollectionName,
            marketLinks,
            linkOverrides,
            resolveCollectionHref,
        }));
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    section.appendChild(tableWrap);

    return section;
}

export function createSupplySectionNode({
    ordinalsSupplyData,
    extraOrdinalsSupplyData = [],
    ethSupplyData = [],
    marketLinks,
    linkOverrides,
    physicalWorksItems = [],
    physicalSectionTitle = 'Physical & Other',
    ordinalsSectionTitle = 'Bitcoin Ordinals Collection',
    extraOrdinalsSectionTitle = 'Additional Ordinals',
    ethSectionTitle = 'Ethereum Works',
    resolveCollectionHref = defaultResolveCollectionHref,
    toCollectionSlug,
    slugifyCollectionName,
}) {
    const orderBySupply = (left, right) => (
        right.inscribed - left.inscribed
        || right.circulating - left.circulating
        || left.name.localeCompare(right.name)
    );
    const ordnetRows = [...ordinalsSupplyData].sort(orderBySupply);
    const extraRows = [...extraOrdinalsSupplyData].sort(orderBySupply);
    const allOrdinalRows = [...ordnetRows, ...extraRows];

    let ordInscribed = 0;
    let ordCirc = 0;
    let ordBurned = 0;

    allOrdinalRows.forEach((row) => {
        ordInscribed += row.inscribed;
        ordCirc += row.circulating;
        ordBurned += row.inscribed - row.circulating;
    });

    const root = createNode('div', 'space-y-4 md:space-y-8 animate-fade-in');

    const statsStrip = createNode('div', 'mb-3 md:mb-8 md:border-b md:border-white/8 pb-2 md:pb-6');

    // Below extra-large widths, deliberately use a 3 + 2 layout. It prevents
    // financial values from wrapping while keeping the same hierarchy on phones.
    const mobileWrap = createNode('div', 'xl:hidden');
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
        'Primary',
        '— BTC',
        'text-white/90',
        'Loading ledger…',
        'text-[0.98rem]',
        'px-2 py-2 text-center'
    );
    const mobileSecondaryCard = createStatCard(
        'Secondary Volume',
        '— BTC',
        'text-white/90',
        'Loading ledger…',
        'text-[0.98rem]',
        'px-2 py-2 text-center'
    );
    mobileBottomRow.appendChild(mobilePrimaryCard);
    mobileBottomRow.appendChild(mobileSecondaryCard);
    mobileWrap.appendChild(mobileTopRow);
    mobileWrap.appendChild(mobileBottomRow);

    const desktopGrid = createNode(
        'div',
        'hidden xl:grid xl:grid-cols-[minmax(0,.92fr)_minmax(0,.92fr)_minmax(0,.72fr)_minmax(11rem,1.15fr)_minmax(13rem,1.45fr)] xl:gap-5'
    );
    desktopGrid.appendChild(createStatCard('Inscribed', ordInscribed, '', null, 'text-3xl'));
    desktopGrid.appendChild(createStatCard('Circulating', ordCirc, 'text-white/90', null, 'text-3xl'));
    desktopGrid.appendChild(createStatCard('Burned', ordBurned, 'text-white/30', null, 'text-3xl'));
    const desktopPrimaryCard = createStatCard(
        'Primary',
        '— BTC',
        'text-white/90',
        'Loading ledger…',
        'text-[1.35rem]'
    );
    const desktopSecondaryCard = createStatCard(
        'Secondary Volume',
        '— BTC',
        'text-white/90',
        'Loading ledger…',
        'text-[1.35rem]'
    );
    desktopGrid.appendChild(desktopPrimaryCard);
    desktopGrid.appendChild(desktopSecondaryCard);

    statsStrip.appendChild(mobileWrap);
    statsStrip.appendChild(desktopGrid);
    root.appendChild(statsStrip);

    root.appendChild(createOrdinalsSupplyListSection({
        title: ordinalsSectionTitle,
        rows: ordnetRows,
        toCollectionSlug,
        slugifyCollectionName,
        marketLinks,
        linkOverrides,
        resolveCollectionHref,
    }));

    if (extraRows.length) {
        root.appendChild(createOrdinalsSupplyListSection({
            title: extraOrdinalsSectionTitle,
            rows: extraRows,
            toCollectionSlug,
            slugifyCollectionName,
            marketLinks,
            linkOverrides,
            resolveCollectionHref,
        }));
    }

    if (ethSupplyData.length) {
        const ethSection = createNode('section');
        const ethTitle = createNode(
            'h3',
            'text-xs font-bold uppercase tracking-widest text-white/30 mb-3 md:mb-4 flex items-center gap-2'
        );
        ethTitle.appendChild(createNode('span', 'w-4 h-[1px] bg-white/10'));
        ethTitle.appendChild(document.createTextNode(ethSectionTitle));
        ethSection.appendChild(ethTitle);

        const ethMobileList = createNode('div', 'sm:hidden space-y-2');
        ethSupplyData.forEach((row) => {
            ethMobileList.appendChild(createEthSupplyCard(row));
        });
        ethSection.appendChild(ethMobileList);

        const ethTableWrap = createNode('div', 'hidden sm:block overflow-x-auto');
        const ethTable = createNode('table', 'w-full text-left');
        const ethThead = createNode('thead');
        ethThead.appendChild(createTableHeader([
            { label: 'Collection', className: 'pb-2 font-medium' },
            { label: 'Platform', className: 'pb-2 px-2 font-medium hidden sm:table-cell' },
            { label: 'Year', className: 'pb-2 px-2 font-medium' },
            { label: 'Supply', className: 'pb-2 pl-4 font-medium text-right' },
        ]));
        ethTable.appendChild(ethThead);

        const ethTbody = createNode('tbody');
        ethSupplyData.forEach((row) => {
            ethTbody.appendChild(createEthSupplyRow(row));
        });
        ethTable.appendChild(ethTbody);
        ethTableWrap.appendChild(ethTable);
        ethSection.appendChild(ethTableWrap);

        root.appendChild(ethSection);
    }

    if (physicalWorksItems.length) {
        const physicalSection = createNode('section', 'opacity-80');
        const physicalTitle = createNode(
            'h3',
            'text-xs font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2'
        );
        physicalTitle.appendChild(createNode('span', 'w-4 h-[1px] bg-white/10'));
        physicalTitle.appendChild(document.createTextNode(physicalSectionTitle));
        physicalSection.appendChild(physicalTitle);

        const list = createNode('ul', 'space-y-2 md:space-y-3 text-xs md:text-sm text-white/60');
        physicalWorksItems.forEach((line) => {
            const item = createNode('li', 'flex items-start gap-3');
            item.appendChild(createNode('span', 'mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0'));
            item.appendChild(createNode('span', 'leading-relaxed', line));
            list.appendChild(item);
        });
        physicalSection.appendChild(list);
        root.appendChild(physicalSection);
    }

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
            getSalesIndex(),
            getBtcUsdSpot(),
        ]);
        const summary = computeSalesSummary(salesIndex);

        primaryValueNodes.forEach((node) => {
            node.textContent = `${formatBtcCompact(summary.primaryBtc)} BTC`;
        });
        primaryUsdNodes.forEach((node) => {
            node.textContent = formatUsdToday(summary.primaryBtc, btcUsdSpot);
        });
        secondaryValueNodes.forEach((node) => {
            node.textContent = `${formatBtcCompact(summary.secondaryBtc)} BTC`;
        });
        secondaryUsdNodes.forEach((node) => {
            node.textContent = formatUsdToday(summary.secondaryBtc, btcUsdSpot);
        });
    })();

    return root;
}
