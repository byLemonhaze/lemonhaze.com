import { isCoreCollectionSlug } from '../curation/selection.js';
import { initCollapsedYears, toggleYearCollapse, getCollapsedYears } from '../state/store.js';

const BASE_TOP_NAV_BUTTON_CLASS =
    'block w-full text-left border-l border-transparent px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] transition-[color,background-color,border-color] duration-200 text-white/80 hover:border-white/40 hover:bg-white/[0.05] hover:text-white';
const ACTIVE_TOP_NAV_BUTTON_CLASS =
    'block w-full text-left border-l border-white/85 bg-white/[0.07] px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.18em] transition-[color,background-color,border-color] duration-200 text-white';

// Keep the sidebar concise without changing the collection’s full public name.
const SIDEBAR_COLLECTION_LABELS = {
    'Eclosion 1/1 - Amsterdam Blooms': 'Eclosion 1/1',
};

export function syncSidebarActiveSection({ topNav, sectionKey }) {
    if (!topNav) return;

    const allSectionButtons = Array.from(topNav.querySelectorAll('[data-section]'));
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
    const addSection = (key, secondary = false) => {
        const link = document.createElement('a');
        link.href = '/' + key;
        link.className = key === activeSectionKey ? ACTIVE_TOP_NAV_BUTTON_CLASS : BASE_TOP_NAV_BUTTON_CLASS;
        if (secondary) link.classList.add('sidebar-secondary');
        link.dataset.section = key;
        link.textContent = internalSections[key].label;
        link.onclick = event => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); onOpenSection(key);
        };
        container.appendChild(link);
    };
    ['selected', 'practice', 'about', 'highlights'].forEach(key => addSection(key));
    const allWorks = document.createElement('details');
    allWorks.id = 'all-works-nav';
    allWorks.className = 'all-works-nav';
    const summary = document.createElement('summary');
    summary.innerHTML = '<span>All Works</span><span class="all-works-indicator" aria-hidden="true">+</span>';
    allWorks.appendChild(summary);
    container.appendChild(allWorks);
    ['archive', 'collecting', 'lab'].forEach(key => addSection(key, true));
}

export function renderYearGroups({
    collectionsNav,
    chronologyByYear,
    currentFilter,
    onLoadCollection,
    onAfterSelect,
    toCollectionSlug,
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
        yearBtn.className = 'w-full flex items-center justify-between border-t border-white/[0.07] px-3 pt-3 mt-8 mb-2 group';

        const yearLabel = document.createElement('span');
        yearLabel.className = 'text-[11px] font-bold text-white/65 uppercase tracking-[0.24em]';
        yearLabel.textContent = year;

        const indicator = document.createElement('span');
        indicator.className = 'text-[11px] leading-none font-mono font-medium text-white/65 group-hover:text-white transition-colors';
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
            const btn = document.createElement('a');
            btn.href = '/' + toCollectionSlug(collectionName);
            const displayName = SIDEBAR_COLLECTION_LABELS[collectionName] || collectionName;
            const isActive = currentFilter === collectionName;
            btn.className = isActive
                ? 'block w-full text-left border-l border-white/85 bg-white/[0.07] px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition-[color,background-color,border-color] duration-200 text-white font-bold'
                : 'block w-full text-left border-l border-transparent px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] transition-[color,background-color,border-color] duration-200 text-white/75 hover:border-white/40 hover:bg-white/[0.05] hover:text-white';
            btn.dataset.collection = collectionName;
            btn.dataset.collectionEmphasis = isCoreCollectionSlug(toCollectionSlug(collectionName)) ? 'core' : 'archive';
            btn.textContent = displayName;
            btn.onclick = event => {
                if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
                event.preventDefault();
                onLoadCollection(collectionName);
                onAfterSelect();
            };
            li.appendChild(btn);
            list.appendChild(li);
        });

        yearBtn.dataset.yearToggle = year;
        yearBtn.setAttribute('aria-expanded', String(!isCollapsed));
        list.id = 'works-year-' + year;
        yearBtn.setAttribute('aria-controls', list.id);
        yearBtn.onclick = () => {
            toggleYearCollapse(year);
            const collapsed = getCollapsedYears().has(String(year));
            list.style.display = collapsed ? 'none' : '';
            indicator.textContent = collapsed ? '+' : '−';
            yearBtn.setAttribute('aria-expanded', String(!collapsed));
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
    toCollectionSlug,
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
    toCollectionSlug,
        });
        const allWorks = topNav?.querySelector('#all-works-nav');
        if (allWorks) {
            allWorks.appendChild(collectionsNav);
            const visualizer = document.createElement('a');
            visualizer.href = '/visualizer/'; visualizer.className = 'chronology-link';
            visualizer.textContent = 'Visual chronology ↗︎';
            allWorks.appendChild(visualizer);
        }
    }
}
