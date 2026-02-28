export function renderTopNav(container, {
    internalSections,
    onOpenSection,
    onOpenExternal,
}) {
    const extras = [
        [internalSections.about.label, () => onOpenSection('about')],
        [internalSections.highlights.label, () => onOpenSection('highlights')],
        [internalSections.supply.label, () => onOpenSection('supply')],
        [internalSections.media.label, () => onOpenSection('media')],
        [internalSections.collectors.label, () => onOpenSection('collectors')],
        ['Twitter', () => onOpenExternal('https://x.com/Ordinals10K')],
        ['Discord', () => onOpenExternal('https://discord.com/invite/4A8jaMqdxs')],
    ];

    extras.forEach(([label, action]) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-200 border-l-2 border-transparent hover:border-white/70 hover:text-white text-white/45';
        btn.textContent = label;
        btn.onclick = action;
        container.appendChild(btn);
    });
}

export function renderYearGroups({
    collectionsNav,
    chronologyByYear,
    currentFilter,
    onLoadCollection,
    onAfterSelect,
}) {
    const years = Object.keys(chronologyByYear).sort((a, b) => b - a);

    years.forEach((year) => {
        const yearGroup = document.createElement('div');
        yearGroup.className = 'animate-fade-in';

        const yearHeader = document.createElement('h3');
        yearHeader.className = 'text-[10px] font-semibold text-white/30 uppercase tracking-[0.28em] px-3 mb-2 mt-8';
        yearHeader.textContent = year;
        yearGroup.appendChild(yearHeader);

        const list = document.createElement('ul');
        list.className = 'space-y-0.5';

        chronologyByYear[year].forEach((collectionName) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = `w-full text-left px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition-colors duration-200 border-l-2 ${
                currentFilter === collectionName
                    ? 'border-white text-white font-bold'
                    : 'border-transparent text-white/45 hover:border-white/70 hover:text-white'
            }`;
            btn.dataset.collection = collectionName;
            btn.textContent = collectionName;
            btn.onclick = () => {
                onLoadCollection(collectionName);
                onAfterSelect();
            };
            li.appendChild(btn);
            list.appendChild(li);
        });

        yearGroup.appendChild(list);
        collectionsNav.appendChild(yearGroup);
    });
}

export function renderSidebarSections({
    topNav,
    collectionsNav,
    internalSections,
    chronologyByYear,
    currentFilter,
    onOpenSection,
    onOpenExternal,
    onLoadCollection,
    onAfterSelect,
}) {
    if (topNav) {
        topNav.innerHTML = '';
        renderTopNav(topNav, {
            internalSections,
            onOpenSection,
            onOpenExternal,
        });
    }

    if (collectionsNav) {
        collectionsNav.innerHTML = '';
        renderYearGroups({
            collectionsNav,
            chronologyByYear,
            currentFilter,
            onLoadCollection,
            onAfterSelect,
        });
    }
}
