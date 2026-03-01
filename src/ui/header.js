const COLLECTION_EXTERNAL_SITES = {
    'BEST BEFORE': 'https://bestbefore.gallery',
    Deville: 'https://cypherville.xyz',
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
        currentViewTitle.innerHTML = '<span class="text-lg font-extrabold uppercase tracking-[0.05em]">Lemonhaze</span>';
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

    const attribution = title === 'BEST BEFORE'
        ? 'BY LEMONHAZE X ORDINALLY'
        : (title === 'Manufactured' ? 'X KIZ' : year);
    const externalSite = COLLECTION_EXTERNAL_SITES[title] || null;

    if (currentViewMeta) {
        const externalLink = externalSite
            ? `<a href="${externalSite}" target="_blank" rel="noopener noreferrer" class="text-white/40 hover:text-white transition-colors">↗ Site</a>`
            : '';
        currentViewMeta.innerHTML = `
      <div class="mt-1">
        <button class="flex items-center gap-2 text-[9px] text-white/20 font-mono uppercase tracking-[0.24em] hover:text-white/40 transition-colors group" id="desc-toggle">
          <span>${worksCount} artworks</span>
          <span class="w-1 h-[1px] bg-white/10"></span>
          <span>${attribution}</span>
          ${externalSite ? `<span class="w-1 h-[1px] bg-white/10"></span>${externalLink}` : ''}
          <span id="desc-chevron" class="text-white/20 group-hover:text-white/40 transition-colors ml-1">+</span>
        </button>
        <div id="desc-body" class="hidden mt-2 border-l-2 border-white/10 pl-3 py-0.5">
          <p class="text-[11px] md:text-xs text-white/50 max-w-2xl leading-relaxed">${desc}</p>
        </div>
      </div>
    `;
        const toggle = currentViewMeta.querySelector('#desc-toggle');
        const body = currentViewMeta.querySelector('#desc-body');
        const chevron = currentViewMeta.querySelector('#desc-chevron');
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
