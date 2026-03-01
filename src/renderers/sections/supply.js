function createNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
}

function createStatCard(label, value, valueClassName = '') {
    const card = createNode('div', 'surface p-4');
    const labelNode = createNode('div', 'text-[10px] uppercase tracking-widest text-white/30 mb-1', label);
    const valueNode = createNode('div', `text-xl font-bold font-mono ${valueClassName}`.trim(), value.toLocaleString());
    card.appendChild(labelNode);
    card.appendChild(valueNode);
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

    const root = createNode('div', 'space-y-8 animate-fade-in');

    const statsGrid = createNode('div', 'grid grid-cols-3 gap-4');
    statsGrid.appendChild(createStatCard('Inscribed', ordInscribed));
    statsGrid.appendChild(createStatCard('Circulating', ordCirc, 'text-white/90'));
    statsGrid.appendChild(createStatCard('Burned', ordBurned, 'text-white/30'));
    root.appendChild(statsGrid);

    const ordinalsSection = createNode('section');
    const ordinalsTitle = createNode(
        'h3',
        'text-xs font-bold uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2'
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

    return root;
}
