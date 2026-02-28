export function createArtworkModalController({
    refs,
    appState,
    router,
    resolveCollectionName,
    getArtworkImageSrc,
    getAllArtworks,
    getMetaOwner,
    closeAboutModal,
}) {
    function renderMetadataList(item) {
        const { modalMetadata } = refs();
        if (!modalMetadata) return;

        modalMetadata.innerHTML = '';

        const orderedKeys = [
            ['Collection', 'collection'],
            ['Provenance', 'provenance'],
            ['Timestamp', 'timestamp'],
            ['Artwork Type', 'artwork_type'],
            ['Dimensions', 'dimensions'],
            ['Artwork Size', 'size'],
            ['Sat Inscribed', 'sat'],
            ['Block Height', 'height'],
        ];

        orderedKeys.forEach(([label, key]) => {
            let value = item[key];
            if (key === 'provenance' && typeof value === 'string') {
                value = value
                    .split(/[\s,]+/)
                    .map((v) => v.trim())
                    .filter((v) => v.length > 10);
            }
            if (!value) return;

            if (key === 'sat' && item.charms) {
                value += ` - ${item.charms}`;
            }

            const row = document.createElement('div');
            row.className = 'flex flex-col border-b border-white/5 pb-2 mb-2 last:border-0';

            if (key === 'provenance' && Array.isArray(value)) {
                const thumbs = value.map((pid) => {
                    const extItem = getAllArtworks().find((a) => a.id === pid);
                    if (!extItem) return '';

                    const src = getArtworkImageSrc(extItem);
                    return `
          <img
            src="${src}"
            alt="${pid}"
            class="w-10 h-10 object-cover border border-white/10 cursor-pointer hover:opacity-80 transition"
            loading="lazy"
            onclick="window.__openProvenance('${pid}')"
          />
        `;
                }).join('');

                row.innerHTML = `
        <span class="text-white/45 uppercase tracking-[0.2em] text-[10px] mb-1 font-mono">${label}</span>
        <div class="flex gap-2 flex-wrap">${thumbs}</div>
      `;
            } else {
                row.innerHTML = `
        <span class="text-white/45 uppercase tracking-[0.2em] text-[10px] mb-1 font-mono">${label}</span>
        <span class="text-white/90 break-words leading-tight">${value}</span>
      `;
            }

            modalMetadata.appendChild(row);
        });

        const ownerRow = document.createElement('div');
        ownerRow.className = 'flex flex-col border-b border-white/5 pb-2 mb-2 last:border-0';
        ownerRow.innerHTML = `
        <span class="text-white/45 uppercase tracking-[0.2em] text-[10px] mb-1 font-mono">Owner</span>
        <span id="meta-owner" class="text-white/90 break-words leading-tight animate-pulse">Fetching...</span>
    `;
        modalMetadata.appendChild(ownerRow);

        fetchOwner(item.id);
    }

    async function fetchOwner(id) {
        try {
            const res = await fetch(`https://api.allorigins.win/raw?url=https://ordinals.com/inscription/${id}`);
            const html = await res.text();
            const match = html.match(/<dt[^>]*>\s*address\s*<\/dt>\s*<dd[^>]*>\s*<a[^>]*>(.*?)<\/a>/i);
            const owner = match ? match[1].trim() : 'Unknown';

            const ownerEl = getMetaOwner();
            if (ownerEl) {
                if (owner !== 'Unknown') {
                    ownerEl.innerHTML = `<button onclick="window.__gotoCollector('${owner}')" class="text-white hover:underline decoration-white/30 text-left transition-all">${owner}</button>`;
                } else {
                    ownerEl.textContent = owner;
                }
                ownerEl.classList.remove('animate-pulse');
            }
        } catch (e) {
            const ownerEl = getMetaOwner();
            if (ownerEl) {
                ownerEl.textContent = 'Unavailable';
                ownerEl.classList.remove('animate-pulse');
            }
        }
    }

    function renderActionButtons(item, imgSrc) {
        const { modalActions, rawHtmlContainer, rawHtmlContent, modalImage, modalIframe } = refs();
        if (!modalActions || !rawHtmlContainer || !rawHtmlContent || !modalImage || !modalIframe) return;

        modalActions.innerHTML = '';

        let isOnChain = false;
        let isFrameView = false;
        const baseImgSrc = imgSrc;

        const defaultHint = 'Hover an action icon to preview what it does.';
        const actionHint = document.createElement('p');
        actionHint.className = 'basis-full text-[10px] font-mono uppercase tracking-[0.2em] text-white/40';
        actionHint.textContent = defaultHint;
        modalActions.appendChild(actionHint);

        const setActionHint = (text) => {
            actionHint.textContent = text || defaultHint;
        };

        const createBtn = (icon, hint, hoverText, onClick) => {
            const btn = document.createElement('button');
            btn.innerHTML = icon;
            btn.title = hint;
            btn.setAttribute('aria-label', hint);
            btn.className = 'w-10 h-10 flex items-center justify-center border border-white/10 bg-[#121212] text-white hover:border-white/40 transition-colors duration-200 text-lg';
            btn.onclick = onClick;
            btn.addEventListener('mouseenter', () => setActionHint(hoverText));
            btn.addEventListener('focus', () => setActionHint(hoverText));
            btn.addEventListener('mouseleave', () => setActionHint(defaultHint));
            btn.addEventListener('blur', () => setActionHint(defaultHint));
            return btn;
        };

        modalActions.appendChild(createBtn(
            '◉',
            'View on Ordinals',
            'Open this inscription on ordinals.com in a new tab.',
            () => window.open(`https://ordinals.com/inscription/${item.id}`, '_blank')
        ));

        modalActions.appendChild(createBtn(
            '↓',
            'Download',
            'Download the currently displayed artwork file.',
            () => {
            const link = document.createElement('a');
            link.href = imgSrc;
            link.download = `${item.name}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            }
        ));

        modalActions.appendChild(createBtn(
            '⌸',
            'Raw Source',
            'Inspect the raw inscription source/content payload.',
            async () => {
            rawHtmlContainer.classList.remove('hidden');
            rawHtmlContent.textContent = 'Loading source...';
            try {
                const res = await fetch(`https://ordinals.com/content/${item.id}`);
                const text = await res.text();
                rawHtmlContent.textContent = text;
            } catch (e) {
                rawHtmlContent.textContent = 'Failed to load source.';
            }
            }
        ));

        const chainBtn = createBtn(
            '⛓',
            'Toggle On-Chain / Off-Chain',
            'Switch between CDN image and live on-chain content.',
            () => {
            isOnChain = !isOnChain;
            isFrameView = false;

            if (isOnChain) {
                modalImage.classList.add('hidden');
                modalIframe.classList.remove('hidden');
                modalIframe.src = `https://ordinals.com/content/${item.id}`;
                chainBtn.classList.add('ring-2', 'ring-white');
                setActionHint('On-chain mode enabled. Click again to return to CDN view.');
            } else {
                modalIframe.classList.add('hidden');
                modalImage.src = baseImgSrc;
                modalImage.classList.remove('hidden');
                chainBtn.classList.remove('ring-2', 'ring-white');
                setActionHint('Off-chain CDN mode enabled.');
            }
            }
        );
        modalActions.appendChild(chainBtn);

        modalActions.appendChild(createBtn(
            '⎋',
            'Share Link',
            'Copy a direct link to this artwork modal.',
            () => {
            const url = router.buildUrlWithState({
                collection: resolveCollectionName(item.collection) || appState.currentFilter,
                collector: null,
                section: null,
                artwork: item.id,
            });
            navigator.clipboard.writeText(url.toString()).then(() => {
                const btn = modalActions.querySelector('button[title="Share Link"]');
                const oldText = btn.textContent;
                btn.textContent = '✓ Copied';
                setActionHint('Share link copied to clipboard.');
                setTimeout(() => {
                    btn.textContent = oldText;
                }, 2000);
            });
            }
        ));

        modalActions.appendChild(createBtn(
            '↻',
            'Refresh Content',
            'Force reload to bypass cache for the current media.',
            () => {
            const btn = modalActions.querySelector('button[title="Refresh Content"]');
            btn.classList.add('animate-spin');

            if (!modalImage.classList.contains('hidden') && modalImage.src) {
                const currentSrc = modalImage.src.split('?')[0];
                modalImage.src = `${currentSrc}?t=${Date.now()}`;
            }

            if (!modalIframe.classList.contains('hidden') && modalIframe.src) {
                modalIframe.src = modalIframe.src;
            }

            setTimeout(() => btn.classList.remove('animate-spin'), 1000);
            }
        ));

        const frameThumb = document.createElement('img');
        frameThumb.src = `https://cdn.lemonhaze.com/assets/assets/FRAME${item.id}.png`;
        frameThumb.alt = 'Framed Scene Preview';
        frameThumb.title = 'Toggle framed scene preview';
        frameThumb.className = 'w-20 border border-white/10 shadow-sm cursor-pointer opacity-80 hover:opacity-100 transition-opacity ml-2';
        frameThumb.loading = 'lazy';
        frameThumb.addEventListener('mouseenter', () => setActionHint('Preview this artwork in frame-scene mode.'));
        frameThumb.addEventListener('mouseleave', () => setActionHint(defaultHint));

        frameThumb.onerror = () => frameThumb.remove();

        frameThumb.onclick = () => {
            isOnChain = false;
            isFrameView = !isFrameView;
            modalIframe.classList.add('hidden');
            modalImage.src = isFrameView ? frameThumb.src : baseImgSrc;
            modalImage.classList.remove('hidden');
            chainBtn.classList.remove('ring-2', 'ring-white');
            setActionHint(isFrameView ? 'Frame preview enabled.' : 'Frame preview disabled.');
        };

        modalActions.appendChild(frameThumb);
    }

    function openMetacard(item, imgSrc, isHtml, options = {}) {
        const { updateUrl = true, replaceHistory = false } = options;
        const {
            modalTitle,
            modalImage,
            modalIframe,
            rawHtmlContainer,
            modalOverlay,
        } = refs();

        if (!modalTitle || !modalImage || !modalIframe || !rawHtmlContainer || !modalOverlay) return;

        closeAboutModal({ updateUrl: false });
        appState.activeSectionKey = null;
        appState.activeCollectorAddress = null;
        appState.activeArtworkId = item.id;

        modalTitle.textContent = item.name;

        modalImage.classList.add('hidden');
        modalIframe.classList.add('hidden');
        rawHtmlContainer.classList.add('hidden');

        modalImage.src = imgSrc;
        modalImage.classList.remove('hidden');

        modalIframe.src = `https://ordinals.com/content/${item.id}`;
        modalIframe.classList.add('hidden');

        renderMetadataList(item);
        renderActionButtons(item, imgSrc);

        modalOverlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            modalOverlay.classList.remove('opacity-0');
        });

        if (updateUrl) {
            router.syncUrlState({
                collection: resolveCollectionName(item.collection) || (appState.currentFilter === 'Home' ? null : appState.currentFilter),
                collector: null,
                section: null,
                artwork: item.id,
            }, { replaceHistory });
        }
    }

    function closeModal(options = {}) {
        const { updateUrl = true, replaceHistory = false } = options;
        const {
            modalOverlay,
            modalImage,
            modalIframe,
            rawHtmlContainer,
        } = refs();

        const hadArtwork = Boolean(appState.activeArtworkId);
        appState.activeArtworkId = null;

        if (updateUrl && hadArtwork) {
            router.syncUrlState({ artwork: null }, { replaceHistory });
        }

        if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;

        modalOverlay.classList.add('opacity-0');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            if (modalImage) modalImage.src = '';
            if (modalIframe) modalIframe.src = '';
            if (rawHtmlContainer) rawHtmlContainer.classList.add('hidden');
        }, 300);
    }

    return {
        openMetacard,
        closeModal,
    };
}
