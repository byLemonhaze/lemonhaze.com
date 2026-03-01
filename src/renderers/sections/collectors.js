export function createCollectorSectionNode() {
    const root = document.createElement('div');
    root.className = 'space-y-6 py-4 animate-fade-in text-center';

    const card = document.createElement('div');
    card.className = 'surface p-8 space-y-4 max-w-md mx-auto';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'w-16 h-16 border border-white/10 flex items-center justify-center mx-auto mb-4';
    const icon = document.createElement('span');
    icon.className = 'text-2xl';
    icon.textContent = '🔍';
    iconWrap.appendChild(icon);

    const title = document.createElement('h3');
    title.className = 'text-lg font-extrabold tracking-[0.05em] uppercase';
    title.textContent = 'Collector Lookup';

    const body = document.createElement('p');
    body.className = 'text-xs text-white/50 leading-relaxed';
    body.textContent = 'This feature is currently under development. Check back soon to search collector portfolios and view all Lemonhaze artworks by Bitcoin address.';

    const statusWrap = document.createElement('div');
    statusWrap.className = 'mt-6 px-6 py-4 bg-[#111] border border-white/10';
    const status = document.createElement('p');
    status.className = 'text-sm font-mono text-white/60 uppercase tracking-[0.2em]';
    status.textContent = 'Coming Soon';
    statusWrap.appendChild(status);

    card.appendChild(iconWrap);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(statusWrap);
    root.appendChild(card);

    return root;
}

function createMetaLine(text, className) {
    const line = document.createElement('p');
    line.className = className;
    line.textContent = text;
    return line;
}

function renderCollectorMeta({ currentViewMeta, address, matchCount = null }) {
    if (!currentViewMeta) return;

    const addressLine = createMetaLine(
        address,
        'text-[10px] text-white/40 font-mono break-all mt-2'
    );

    if (typeof matchCount === 'number') {
        const countLine = createMetaLine(
            `${matchCount} Lemonhaze Works Found`,
            'text-[10px] text-white/60 font-mono mt-1 uppercase tracking-wider'
        );
        currentViewMeta.replaceChildren(addressLine, countLine);
        return;
    }

    currentViewMeta.replaceChildren(addressLine);
}

function renderCollectorFetchError({ galleryGrid, address }) {
    if (!galleryGrid) return;

    const wrap = document.createElement('div');
    wrap.className = 'col-span-full h-96 flex flex-col items-center justify-center text-white/30 space-y-4';

    const title = document.createElement('p');
    title.className = 'text-xl';
    title.textContent = 'Failed to fetch collection';

    const addressLine = document.createElement('p');
    addressLine.className = 'text-xs font-mono opacity-50';
    addressLine.textContent = address;

    wrap.appendChild(title);
    wrap.appendChild(addressLine);
    galleryGrid.replaceChildren(wrap);
}

export async function loadCollectorGallerySection({
    address,
    options = {},
    appState,
    contentArea,
    currentViewMeta,
    setLoading,
    syncSidebarActiveCollection,
    syncSidebarActiveSection,
    updateHeader,
    renderGallery,
    syncUrlState,
    allArtworks,
    galleryGrid,
}) {
    const { updateUrl = true, replaceHistory = false } = options;

    if (appState.homeInterval) clearInterval(appState.homeInterval);
    setLoading(true);
    appState.activeCollectorAddress = address;
    appState.activeArtworkId = null;
    appState.activeSectionKey = null;
    appState.currentFilter = `Collector: ${address.slice(0, 6)}...${address.slice(-4)}`;
    syncSidebarActiveCollection(null);
    syncSidebarActiveSection(null);

    if (contentArea) contentArea.style.overflowY = 'auto';
    updateHeader('Collector View');
    renderCollectorMeta({ currentViewMeta, address });

    try {
        const timestamp = Date.now();
        const targetUrl = `https://api.hiro.so/ordinals/v1/addresses/${address}/inscriptions?limit=60&_=${timestamp}`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
        const data = await res.json();
        const results = data.results || data || [];
        const ownedIds = results.map((r) => r.id);

        const matches = allArtworks.filter((a) => ownedIds.includes(a.id));
        renderGallery(matches);
        renderCollectorMeta({ currentViewMeta, address, matchCount: matches.length });

        if (updateUrl) {
            syncUrlState({
                collector: address,
                collection: null,
                artwork: null,
                section: null,
            }, { replaceHistory });
        }
    } catch (e) {
        renderCollectorFetchError({ galleryGrid, address });
    }
    setLoading(false);
}
