const BASE_TOP_NAV_BUTTON_CLASS =
    'w-full text-left px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-200 border-l-2 border-transparent hover:text-white text-white/45';
const ACTIVE_TOP_NAV_BUTTON_CLASS =
    'w-full text-left px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-200 border-l-2 border-white text-white';

export function syncSidebarActiveSection({ topNav, sectionKey }) {
    if (!topNav) return;

    const allSectionButtons = Array.from(topNav.querySelectorAll('button[data-section]'));
    allSectionButtons.forEach((button) => {
        button.className = BASE_TOP_NAV_BUTTON_CLASS;
    });

    if (!sectionKey) return;
    const activeBtn = allSectionButtons.find((btn) => btn.dataset.section === sectionKey) || null;
    if (activeBtn) {
        activeBtn.className = ACTIVE_TOP_NAV_BUTTON_CLASS;
    }
}

export function renderTopNav(container, {
    internalSections,
    activeSectionKey,
    onOpenSection,
    onOpenExternal,
}) {
    const sectionLinks = [
        [internalSections.about.label, 'about'],
        [internalSections.highlights.label, 'highlights'],
        [internalSections.supply.label, 'supply'],
        [internalSections.media.label, 'media'],
        [internalSections.collectors.label, 'collectors'],
    ];
    const externalLinks = [
        ['Twitter', () => onOpenExternal('https://x.com/Ordinals10K')],
        ['Discord', () => onOpenExternal('https://discord.com/invite/4A8jaMqdxs')],
    ];

    sectionLinks.forEach(([label, sectionKey]) => {
        const btn = document.createElement('button');
        btn.className = sectionKey === activeSectionKey ? ACTIVE_TOP_NAV_BUTTON_CLASS : BASE_TOP_NAV_BUTTON_CLASS;
        btn.dataset.section = sectionKey;
        btn.textContent = label;
        btn.onclick = () => onOpenSection(sectionKey);
        container.appendChild(btn);
    });

    externalLinks.forEach(([label, action]) => {
        const btn = document.createElement('button');
        btn.className = BASE_TOP_NAV_BUTTON_CLASS;
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
    activeSectionKey,
    onOpenSection,
    onOpenExternal,
    onLoadCollection,
    onAfterSelect,
}) {
    if (topNav) {
        topNav.innerHTML = '';
        renderTopNav(topNav, {
            internalSections,
            activeSectionKey,
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
