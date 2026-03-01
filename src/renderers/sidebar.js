import { initCollapsedYears, toggleYearCollapse, getCollapsedYears } from '../state/store.js';

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
    initCollapsedYears(years);

    years.forEach((year) => {
        const collections = chronologyByYear[year];
        const count = collections.length;
        const isCollapsed = getCollapsedYears().has(String(year));

        const yearGroup = document.createElement('div');
        yearGroup.className = 'animate-fade-in';

        const yearBtn = document.createElement('button');
        yearBtn.className = 'w-full flex items-center justify-between px-3 mt-8 mb-2 group';

        const yearLabel = document.createElement('span');
        yearLabel.className = 'text-[10px] font-semibold text-white/30 uppercase tracking-[0.28em]';
        yearLabel.textContent = year;

        const indicator = document.createElement('span');
        indicator.className = 'text-[9px] font-mono text-white/20 group-hover:text-white/40 transition-colors';
        indicator.textContent = isCollapsed ? '+' : '−';

        yearBtn.appendChild(yearLabel);
        yearBtn.appendChild(indicator);
        yearGroup.appendChild(yearBtn);

        const list = document.createElement('ul');
        list.className = 'space-y-0.5';
        list.dataset.yearList = year;
        list.style.display = isCollapsed ? 'none' : '';

        collections.forEach((collectionName) => {
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

        yearBtn.onclick = () => {
            toggleYearCollapse(year);
            const collapsed = getCollapsedYears().has(String(year));
            list.style.display = collapsed ? 'none' : '';
            indicator.textContent = collapsed ? '+' : '−';
        };

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
