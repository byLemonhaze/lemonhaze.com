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
        currentViewMeta.innerHTML = `
      <div class="mt-1 space-y-1">
          <p class="text-[12px] md:text-sm text-white/60 max-w-3xl leading-relaxed border-l-2 border-white/10 pl-3 py-0.5">${desc}</p>
          <div class="flex items-center gap-3 text-[9px] text-white/20 font-mono uppercase tracking-[0.24em]">
            <span>${worksCount} Artworks</span>
            <span class="w-1 h-[1px] bg-white/10"></span>
            <span>${attribution}</span>
          </div>
          ${externalSite ? `<div><a href="${externalSite}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-[10px] font-mono uppercase tracking-[0.18em] text-white/55 hover:text-white transition-colors">Visit Collection Site</a></div>` : ''}
      </div>
    `;
    }

    if (refreshBtn) {
        refreshBtn.classList.remove('hidden');
        refreshBtn.onclick = () => onRefreshCollection(title);
    }
}
