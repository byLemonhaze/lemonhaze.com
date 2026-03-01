const COLLECTION_EXTERNAL_SITES = {
    'BEST BEFORE': 'https://bestbefore.gallery',
    DeVille: 'https://cypherville.xyz',
    Cypherville: 'https://cypherville.xyz',
    'Portrait 2490': 'https://2490.studio',
};

export function updateHeaderView({
    title,
    headerElement,
    currentViewTitle,
    currentViewMeta,
    refreshBtn,
    appState,
    allArtworks,
    collectionDescriptions,
    chronologyByYear,
    onRefreshCollection,
}) {
    if (!currentViewTitle || !headerElement) return;

    if (title === 'Home') {
        headerElement.classList.add('md:hidden');
        currentViewTitle.innerHTML = '<span class="text-lg font-bold uppercase tracking-[0.22em]">Lemonhaze</span>';
        if (currentViewMeta) {
            currentViewMeta.innerHTML = '<p class="text-[9px] text-white/40 font-mono tracking-[0.2em] uppercase">&lt;!-- Artist & Coureur de Bois --&gt;</p>';
        }
        if (refreshBtn) refreshBtn.classList.add('hidden');
        document.title = 'Lemonhaze';
        return;
    }

    headerElement.classList.remove('md:hidden');
    currentViewTitle.textContent = title;
    document.title = `${title} | Lemonhaze`;

    const desc = collectionDescriptions[title] || 'ART BY LEMONHAZE';
    const worksCount = allArtworks.filter((item) => item.collection === title).length;

    let year = '2023–2026';
    for (const [y, list] of Object.entries(chronologyByYear)) {
        if (list.includes(title)) {
            year = y;
            break;
        }
    }

    const attribution = title === 'BEST BEFORE' ? 'BY LEMONHAZE X ORDINALLY' : year;
    const externalSite = COLLECTION_EXTERNAL_SITES[title] || null;

    if (currentViewMeta) {
        const externalBtn = externalSite
            ? `<button class="site-overlay-trigger text-white/40 hover:text-white transition-colors" data-site-url="${externalSite}" data-site-label="${title}">↗ Site</button>`
            : '';
        currentViewMeta.innerHTML = `
      <div class="mt-1">
        <button class="outline-none focus:outline-none flex items-center gap-3 text-[10px] text-white/35 font-mono uppercase tracking-[0.22em] hover:text-white/70 transition-colors group" id="desc-toggle">
          <span>${worksCount} artworks</span>
          <span class="text-white/15">·</span>
          <span>${attribution}</span>
          ${externalSite ? `<span class="text-white/15">·</span>${externalBtn}` : ''}
          <span id="desc-chevron" class="text-white/35 group-hover:text-white/70 transition-colors text-[11px] font-mono ml-1 select-none">+</span>
        </button>
        <div id="desc-body" class="hidden mt-2 border-l border-white/15 pl-3 py-1">
          <p class="text-[11px] text-white/50 max-w-2xl leading-relaxed">${desc}</p>
        </div>
      </div>
    `;
        const toggle = currentViewMeta.querySelector('#desc-toggle');
        const body = currentViewMeta.querySelector('#desc-body');
        const chevron = currentViewMeta.querySelector('#desc-chevron');
        const siteTrigger = currentViewMeta.querySelector('.site-overlay-trigger');

        if (siteTrigger) {
            siteTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('open-site-overlay', {
                    detail: { url: siteTrigger.dataset.siteUrl, label: siteTrigger.dataset.siteLabel },
                }));
            });
        }

        if (toggle && body && chevron) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = !body.classList.contains('hidden');
                body.classList.toggle('hidden', isOpen);
                chevron.textContent = isOpen ? '+' : '−';
            });
        }
    }

    if (refreshBtn) {
        refreshBtn.classList.remove('hidden');
        refreshBtn.onclick = () => onRefreshCollection(title);
    }
}
