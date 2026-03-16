import {
    getPreferredFileExtension,
    isVideoArtwork,
} from '../../modules/artwork-media.js';
import {
    getBtcUsdSpot,
    parseSalesTimestampMs,
    getSalesForInscription,
} from '../../modules/sales-ledger.js';

const HIRO_API = 'https://api.hiro.so/ordinals/v1/inscriptions';
const ORDINALS_INSCRIPTION_API = 'https://ordinals.com/r/inscription';
const BB_LIVE_URL = 'https://bestbefore.space/best-before.json';

let _bbLiveCache = null;
let _bbLivePending = null;

async function fetchBBLive() {
    if (_bbLiveCache) return _bbLiveCache;
    if (_bbLivePending) return _bbLivePending;
    _bbLivePending = (async () => {
        try {
            const res = await fetch(BB_LIVE_URL);
            if (!res.ok) return null;
            const data = await res.json();
            _bbLiveCache = data?.inscriptions || [];
            return _bbLiveCache;
        } catch {
            return null;
        } finally {
            _bbLivePending = null;
        }
    })();
    return _bbLivePending;
}

function getBBNumber(id) {
    const m = id?.match(/i(\d+)$/);
    return m ? parseInt(m[1], 10) + 1 : null;
}

const BB_STATUS_LABELS = { open: 'OPEN', active: 'ACTIVE', sealed: 'SEALED', expired: 'EXPIRED' };
const BB_STATUS_COLORS = {
    open: 'text-white/70',
    active: 'text-emerald-400/80',
    sealed: 'text-white/40',
    expired: 'text-white/20',
};

const SAT_RARITY_LABELS = {
    common: null,
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    mythic: 'Mythic',
};

const DIRECT_HTML_RENDER_COLLECTIONS = new Set([
    'BEST BEFORE',
]);

const satsFormatter = new Intl.NumberFormat('en-US');
const usdNowFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

function fmtBtcValue(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(8).replace(/\.?0+$/, '');
}

function simplifyContentType(ct) {
    if (!ct) return null;
    if (ct.startsWith('text/html')) return 'HTML';
    if (ct === 'image/png') return 'PNG';
    if (ct === 'image/jpeg' || ct === 'image/jpg') return 'JPEG';
    if (ct === 'image/webp') return 'WEBP';
    if (ct === 'image/gif') return 'GIF';
    if (ct === 'image/svg+xml') return 'SVG';
    if (ct.startsWith('text/plain')) return 'TXT';
    return ct.split(';')[0].trim();
}

async function fetchHiroData(id) {
    try {
        const res = await fetch(`${HIRO_API}/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchOrdinalsData(id) {
    try {
        const res = await fetch(`${ORDINALS_INSCRIPTION_API}/${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function fetchInscriptionMetadata(id) {
    const [hiroData, ordinalsData] = await Promise.all([
        fetchHiroData(id),
        fetchOrdinalsData(id),
    ]);

    const owner = String(ordinalsData?.address || '').trim() || null;
    const number =
        Number.isFinite(Number(hiroData?.number)) ? Number(hiroData.number)
        : (Number.isFinite(Number(ordinalsData?.number)) ? Number(ordinalsData.number) : null);

    const hiroTs = hiroData?.genesis_timestamp ?? hiroData?.timestamp ?? hiroData?.created_at;
    let genesisTimestamp = hiroTs || null;
    if (!genesisTimestamp && Number.isFinite(Number(ordinalsData?.timestamp))) {
        genesisTimestamp = Number(ordinalsData.timestamp) * 1000;
    }

    return {
        address: owner,
        number,
        genesis_timestamp: genesisTimestamp,
        sat_rarity: hiroData?.sat_rarity || null,
    };
}

async function buildSaveEnabledHtmlBlobUrl(id) {
    try {
        const res = await fetch(`https://ordinals.com/content/${id}`);
        if (!res.ok) return null;
        let html = await res.text();
        if (!/\<base\s/i.test(html)) {
            const baseTag = '<base href="https://ordinals.com/">';
            if (/\<head[\s>]/i.test(html)) {
                html = html.replace(/\<head([^>]*)\>/i, `<head$1>${baseTag}`);
            } else {
                html = `${baseTag}${html}`;
            }
        }
        return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    } catch {
        return null;
    }
}

export function createArtworkModalController({
    refs,
    appState,
    router,
    resolveCollectionName,
    getArtworkImageSrc,
    getAllArtworks,
    getMetaOwner,
    closeAboutModal,
    onOpenArtworkById,
}) {
    let metadataListenersBound = false;
    let htmlSaveClickLocked = false;
    let htmlBlobLoadToken = 0;
    let activeHtmlBlobUrl = null;
    let metadataRenderToken = 0;

    function showBestBeforeSaveGuide() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[85] bg-black/80 flex items-center justify-center p-4';

        const panel = document.createElement('div');
        panel.className = 'w-full max-w-md border border-white/15 bg-[#050505] p-6 md:p-7';
        panel.innerHTML = `
            <p class="text-[9px] font-mono uppercase tracking-[0.28em] text-white/35 mb-3">Best Before</p>
            <h3 class="text-sm md:text-base font-mono uppercase tracking-[0.14em] text-white mb-4">Save Guide</h3>
            <div class="text-[11px] leading-relaxed text-white/75 space-y-2">
                <p>1. Click the artwork to view lifespan and status.</p>
                <p>2. Press <span class="text-white font-mono">S</span> while the artwork is focused to save the static PNG.</p>
            </div>
            <div class="mt-5 pt-4 border-t border-white/10 flex justify-end">
                <button id="bb-save-guide-close" class="px-3 py-1.5 border border-white/20 text-[10px] font-mono uppercase tracking-[0.14em] text-white/75 hover:text-white hover:border-white/45 transition-colors duration-200">Close</button>
            </div>
        `;

        const closeGuide = () => {
            try { document.removeEventListener('keydown', onKeydown); } catch {}
            overlay.remove();
        };

        const onKeydown = (event) => {
            if (event.key === 'Escape') closeGuide();
        };

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) closeGuide();
        });

        const closeBtn = panel.querySelector('#bb-save-guide-close');
        if (closeBtn) closeBtn.addEventListener('click', closeGuide);

        document.addEventListener('keydown', onKeydown);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    function clearActiveHtmlBlobUrl() {
        htmlSaveClickLocked = false;
        if (!activeHtmlBlobUrl) return;
        try { URL.revokeObjectURL(activeHtmlBlobUrl); } catch {}
        activeHtmlBlobUrl = null;
    }

    function bindMetadataInteractions() {
        const { modalMetadata } = refs();
        if (!modalMetadata || metadataListenersBound) return;
        modalMetadata.addEventListener('click', (event) => {
            const artworkBtn = event.target.closest('[data-open-artwork]');
            if (artworkBtn?.dataset.openArtwork) {
                onOpenArtworkById(artworkBtn.dataset.openArtwork);
            }
        });
        metadataListenersBound = true;
    }

    function makeMetaRow(label, valueNode) {
        const row = document.createElement('div');
        row.className = 'flex items-start gap-4 py-2 border-b border-white/5 last:border-0';

        const lbl = document.createElement('span');
        lbl.className = 'text-[9px] font-mono uppercase tracking-[0.2em] text-white/25 w-20 shrink-0 pt-0.5';
        lbl.textContent = label;

        row.appendChild(lbl);
        row.appendChild(valueNode);
        return row;
    }

    function makeMetaText(text, className = 'text-[11px] font-mono text-white/70 break-all leading-snug') {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        return span;
    }

    function fmtBlockTime(blocks) {
        if (!blocks || blocks <= 0) return '—';
        const mins = Math.round(blocks * 10);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        const remainMins = mins % 60;
        if (hours < 24) return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days > 730) return `~${(days / 365.25).toFixed(1)} years`;
        const remainHours = hours % 24;
        return remainHours > 0 ? `${days}d ${remainHours}h` : `${days}d`;
    }

    function fmtFullTimestamp(raw) {
        if (!raw) return null;
        const d = new Date(typeof raw === 'number' && raw < 1e12 ? raw * 1000 : raw);
        if (isNaN(d)) return String(raw);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    }

    function fmtSaleDate(raw) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const ms = parseSalesTimestampMs(raw);
        if (!Number.isFinite(ms)) return String(raw || '').trim() || 'Unknown date';
        const d = new Date(ms);
        if (isNaN(d)) return String(raw || '').trim() || 'Unknown date';
        return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    }

    // ── Shared helper: renders provenance thumbnails, static facts, and live-data
    //    placeholders. Works for both standard inscriptions and BEST BEFORE.
    function renderMetadataList(item) {
        const { modalMetadata } = refs();
        if (!modalMetadata) return;
        modalMetadata.innerHTML = '';

        const isBB = item.collection === 'BEST BEFORE';

        // 1. Provenance thumbnails (falls back to text links if parent not in local artworks)
        if (item.provenance && typeof item.provenance === 'string') {
            const ids = item.provenance.split(/[\s,]+/).map(v => v.trim()).filter(v => v.length > 10);
            if (ids.length) {
                const thumbsWrap = document.createElement('div');
                thumbsWrap.className = 'flex gap-2 flex-wrap';
                ids.forEach((pid) => {
                    const extItem = getAllArtworks().find((a) => a.id === pid);
                    if (extItem) {
                        const thumb = document.createElement('img');
                        thumb.src = getArtworkImageSrc(extItem);
                        thumb.className = 'max-w-[32px] max-h-[32px] w-auto h-auto object-contain cursor-pointer hover:opacity-80 transition';
                        thumb.loading = 'lazy';
                        thumb.dataset.openArtwork = pid;
                        thumbsWrap.appendChild(thumb);
                    } else {
                        const link = document.createElement('a');
                        link.href = `https://ordinals.com/inscription/${pid}`;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.className = 'text-[9px] font-mono text-white/35 hover:text-white transition-colors break-all leading-snug';
                        link.textContent = pid;
                        thumbsWrap.appendChild(link);
                    }
                });
                modalMetadata.appendChild(makeMetaRow('Provenance', thumbsWrap));
            }
        }

        // 2. Timestamp — initial value from provenance, updated async by Hiro
        const tsSpan = makeMetaText(
            fmtFullTimestamp(item.timestamp) || item.timestamp || '—',
            'text-[11px] font-mono text-white/70 leading-snug',
        );
        tsSpan.id = 'meta-timestamp';
        modalMetadata.appendChild(makeMetaRow('Timestamp', tsSpan));

        // 3. Static artwork facts (from provenance.json — only for non-BB)
        if (!isBB) {
            const artType = item.artwork_type?.toUpperCase();
            if (artType && artType !== 'HTML') {
                modalMetadata.appendChild(makeMetaRow('Type', makeMetaText(item.artwork_type)));
            }
            if (item.dimensions) {
                modalMetadata.appendChild(makeMetaRow('Dimensions', makeMetaText(item.dimensions)));
            }
            if (item.size) {
                modalMetadata.appendChild(makeMetaRow('Art. Size', makeMetaText(item.size)));
            }
            if (item.height) {
                modalMetadata.appendChild(makeMetaRow('Block', makeMetaText(
                    Number(item.height).toLocaleString(),
                    'text-[11px] font-mono text-white/60 leading-snug',
                )));
            }
            if (item.sat) {
                modalMetadata.appendChild(makeMetaRow('Sat', makeMetaText(
                    String(item.sat),
                    'text-[11px] font-mono text-white/55 break-all leading-snug',
                )));
            }
            const contentLabel = simplifyContentType(item.content_type);
            if (contentLabel) {
                modalMetadata.appendChild(makeMetaRow('Content', makeMetaText(
                    contentLabel,
                    'text-[11px] font-mono text-white/45 leading-snug',
                )));
            }
        }

        // 4. BB live section placeholder (only for BEST BEFORE)
        if (isBB) {
            const bbLiveSection = document.createElement('div');
            bbLiveSection.id = 'meta-bb-live';
            const bbLoading = document.createElement('div');
            bbLoading.className = 'py-2 text-[10px] font-mono text-white/15 animate-pulse';
            bbLoading.textContent = 'Loading live data…';
            bbLiveSection.appendChild(bbLoading);
            modalMetadata.appendChild(bbLiveSection);
        }

        // 5. Inscription number (animated, filled by Hiro)
        if (!isBB) {
            const insNoSpan = makeMetaText('—', 'text-[11px] font-mono text-white/60 leading-snug animate-pulse');
            insNoSpan.id = 'meta-inscription-number';
            modalMetadata.appendChild(makeMetaRow('Ins. No.', insNoSpan));
        }

        // 6. Current owner (animated, filled by Hiro)
        const ownerSpan = makeMetaText('—', 'text-[11px] font-mono text-white/55 break-all leading-snug animate-pulse');
        ownerSpan.id = 'meta-owner';
        modalMetadata.appendChild(makeMetaRow('Current Owner', ownerSpan));

        // 7. Sat rarity placeholder (filled by Hiro)
        const satTypeRow = document.createElement('div');
        satTypeRow.id = 'meta-rarity-row';
        modalMetadata.appendChild(satTypeRow);

        // 8. Sales history placeholder (filled from the historical sales sheet)
        const salesWrap = document.createElement('div');
        salesWrap.id = 'meta-sales';
        const salesLoading = document.createElement('div');
        salesLoading.className = 'text-[11px] font-mono text-white/25 leading-snug animate-pulse';
        salesLoading.textContent = 'Loading sales…';
        salesWrap.appendChild(salesLoading);
        modalMetadata.appendChild(makeMetaRow('Sales', salesWrap));

        // ── Async: fill live data from Hiro (+ BB live for BB items) ──
        const requestToken = ++metadataRenderToken;

        const applyMetadataData = (metadata) => {
            if (requestToken !== metadataRenderToken || appState.activeArtworkId !== item.id) return;

            const tsEl = document.getElementById('meta-timestamp');
            if (tsEl && metadata?.genesis_timestamp) {
                const full = fmtFullTimestamp(metadata.genesis_timestamp);
                if (full) tsEl.textContent = full;
            }

            const insNoEl = document.getElementById('meta-inscription-number');
            if (insNoEl) {
                insNoEl.textContent = metadata?.number != null ? `#${Number(metadata.number).toLocaleString()}` : '—';
                insNoEl.classList.remove('animate-pulse');
            }

            const ownerEl = document.getElementById('meta-owner');
            if (ownerEl) {
                ownerEl.textContent = metadata?.address || '—';
                ownerEl.classList.remove('animate-pulse');
            }

            const rarityLabel = metadata?.sat_rarity ? SAT_RARITY_LABELS[metadata.sat_rarity] : null;
            const rarityEl = document.getElementById('meta-rarity-row');
            if (rarityEl && rarityLabel) {
                rarityEl.replaceWith(makeMetaRow('Sat Type', makeMetaText(rarityLabel, 'text-[11px] font-mono text-white/55 leading-snug')));
            } else if (rarityEl) {
                rarityEl.remove();
            }
        };

        const applySalesData = (events, btcUsdSpot) => {
            if (requestToken !== metadataRenderToken || appState.activeArtworkId !== item.id) return;

            const salesEl = document.getElementById('meta-sales');
            if (!salesEl) return;
            salesEl.innerHTML = '';

            if (!Array.isArray(events) || !events.length) {
                salesEl.appendChild(makeMetaText(
                    'No sales recorded.',
                    'text-[11px] font-mono text-white/35 leading-snug',
                ));
                return;
            }

            const orderedEvents = [...events].sort((a, b) => {
                const ta = parseSalesTimestampMs(a?.timestamp);
                const tb = parseSalesTimestampMs(b?.timestamp);
                const aValid = Number.isFinite(ta);
                const bValid = Number.isFinite(tb);
                if (aValid && bValid) return tb - ta;
                if (aValid) return -1;
                if (bValid) return 1;
                return (Number(b?.priceBTC) || 0) - (Number(a?.priceBTC) || 0);
            });

            const indexed = orderedEvents.map((event, index) => ({
                event,
                index,
                timestampMs: parseSalesTimestampMs(event?.timestamp),
            }));

            const explicitClassifiedCount = indexed.filter(({ event }) => {
                const kind = String(event?.saleType || '').trim().toLowerCase();
                return kind === 'primary' || kind === 'secondary';
            }).length;

            const explicitPrimary = new Set(
                indexed
                    .filter(({ event }) => String(event?.saleType || '').trim().toLowerCase() === 'primary')
                    .map(({ index }) => index),
            );

            let oldestIndex = -1;
            if (!explicitPrimary.size && !explicitClassifiedCount) {
                let oldestTimestamp = Number.POSITIVE_INFINITY;
                for (const entry of indexed) {
                    if (Number.isFinite(entry.timestampMs) && entry.timestampMs < oldestTimestamp) {
                        oldestTimestamp = entry.timestampMs;
                        oldestIndex = entry.index;
                    }
                }
                if (oldestIndex < 0) oldestIndex = indexed.length - 1;
            }

            for (const entry of indexed) {
                const { event, index } = entry;
                const isPrimary = explicitPrimary.size
                    ? explicitPrimary.has(index)
                    : (!explicitClassifiedCount && index === oldestIndex);
                const row = document.createElement('div');
                row.className = 'py-1.5 border-b border-white/5 last:border-0';

                const dateLine = document.createElement('div');
                dateLine.className = 'flex items-center gap-1.5 text-[10px] font-mono text-white/60 leading-snug';
                const dateText = document.createElement('span');
                dateText.className = 'break-words';
                const explicitDateLabel = String(event?.dateLabel || '').trim();
                dateText.textContent = isPrimary
                    ? `${explicitDateLabel || fmtSaleDate(event?.timestamp)} - Primary`
                    : (explicitDateLabel || fmtSaleDate(event?.timestamp));
                dateLine.appendChild(dateText);

                const priceLine = document.createElement('div');
                priceLine.className = 'text-[11px] font-mono text-white/75 leading-snug break-words';

                const bundleCount = Number(event?.bundleCount);
                const unitPriceBTC = Number(event?.unitPriceBTC);
                const bundleTypeRaw = String(event?.bundleType || '').trim().toLowerCase();
                const hasBundleInfo = Number.isFinite(bundleCount) && bundleCount > 0
                    && Number.isFinite(unitPriceBTC) && unitPriceBTC > 0;
                const bundleLabelOverride = String(event?.bundleLabel || '').trim();

                if (hasBundleInfo) {
                    const bundleLabel = bundleLabelOverride || (bundleTypeRaw === 'edition' || bundleTypeRaw === 'editions'
                        ? 'Edition bundle'
                        : 'Prints bundle');
                    const totalBtc = Number.isFinite(Number(event?.priceBTC))
                        ? Number(event.priceBTC)
                        : bundleCount * unitPriceBTC;
                    const bundleText = `${bundleLabel}: ${bundleCount} × ${fmtBtcValue(unitPriceBTC)} BTC = ${fmtBtcValue(totalBtc)} BTC`;
                    if (Number.isFinite(Number(btcUsdSpot)) && Number(btcUsdSpot) > 0 && Number.isFinite(totalBtc)) {
                        const usdNow = totalBtc * Number(btcUsdSpot);
                        priceLine.textContent = `${bundleText} · ${usdNowFormatter.format(usdNow)}`;
                    } else {
                        priceLine.textContent = `${bundleText} · $—`;
                    }
                    row.appendChild(dateLine);
                    row.appendChild(priceLine);
                    salesEl.appendChild(row);
                    continue;
                }

                if (bundleLabelOverride) {
                    const totalBtc = Number(event?.priceBTC);
                    const count = Number(event?.aggregateSalesCount);
                    const countText = Number.isFinite(count) && count > 0 ? ` (${count} sales)` : '';
                    if (Number.isFinite(totalBtc) && Number.isFinite(Number(btcUsdSpot)) && Number(btcUsdSpot) > 0) {
                        const usdNow = totalBtc * Number(btcUsdSpot);
                        priceLine.textContent = `${bundleLabelOverride}${countText}: ${fmtBtcValue(totalBtc)} BTC · ${usdNowFormatter.format(usdNow)}`;
                    } else if (Number.isFinite(totalBtc)) {
                        priceLine.textContent = `${bundleLabelOverride}${countText}: ${fmtBtcValue(totalBtc)} BTC · $—`;
                    } else {
                        priceLine.textContent = `${bundleLabelOverride}${countText}: —`;
                    }
                    row.appendChild(dateLine);
                    row.appendChild(priceLine);
                    salesEl.appendChild(row);
                    continue;
                }

                const usdOriginal = Number(event?.priceUSDOriginal);
                if (Number.isFinite(usdOriginal) && usdOriginal > 0) {
                    const usdText = usdNowFormatter.format(usdOriginal);
                    if (Number.isFinite(Number(btcUsdSpot)) && Number(btcUsdSpot) > 0) {
                        const btcNow = usdOriginal / Number(btcUsdSpot);
                        priceLine.textContent = `${usdText} · ${fmtBtcValue(btcNow)} BTC`;
                    } else {
                        priceLine.textContent = `${usdText} · BTC unavailable`;
                    }
                } else {
                    const btcText = `${fmtBtcValue(event?.priceBTC)} BTC`;
                    if (Number.isFinite(Number(btcUsdSpot)) && Number.isFinite(Number(event?.priceBTC))) {
                        const usdNow = Number(event.priceBTC) * Number(btcUsdSpot);
                        priceLine.textContent = `${btcText} · ${usdNowFormatter.format(usdNow)}`;
                    } else {
                        priceLine.textContent = `${btcText} · $—`;
                    }
                }

                row.appendChild(dateLine);
                row.appendChild(priceLine);
                salesEl.appendChild(row);
            }
        };

        Promise.all([
            getSalesForInscription(item.id),
            getBtcUsdSpot(),
        ])
            .then(([events, btcUsdSpot]) => {
                applySalesData(events, btcUsdSpot);
            })
            .catch(() => applySalesData([], null));

        if (!isBB) {
            fetchInscriptionMetadata(item.id).then(applyMetadataData);
            return;
        }

        // BB: fetch live data + Hiro in parallel
        Promise.all([fetchBBLive(), fetchInscriptionMetadata(item.id)]).then(([inscriptions, metadata]) => {
            applyMetadataData(metadata);
            if (requestToken !== metadataRenderToken || appState.activeArtworkId !== item.id) return;

            const liveEl = document.getElementById('meta-bb-live');
            if (!liveEl) return;
            liveEl.innerHTML = '';

            const append = (row) => liveEl.appendChild(row);
            const fmtNum = (n) => typeof n === 'number' ? n.toLocaleString() : '—';

            const live = inscriptions?.find(i => i.id === item.id);
            if (live) {
                const block = live.block || {};
                const phase = (live.phase || 'unknown').toLowerCase();
                const isImmortal = !!block.immortal;

                const statusText = isImmortal ? 'IMMORTAL' : (BB_STATUS_LABELS[phase] || phase.toUpperCase());
                const statusColor = isImmortal ? 'text-emerald-400/80' : (BB_STATUS_COLORS[phase] || 'text-white/70');
                append(makeMetaRow('Status', makeMetaText(statusText, `text-[11px] font-mono ${statusColor} leading-snug tracking-widest`)));

                if (live.palette?.colors?.length > 0) {
                    const swatchWrap = document.createElement('div');
                    swatchWrap.className = 'flex items-center gap-2';
                    if (live.palette.id) {
                        const name = document.createElement('span');
                        name.className = 'text-[10px] font-mono text-white/35 uppercase tracking-wider';
                        name.textContent = live.palette.id;
                        swatchWrap.appendChild(name);
                    }
                    live.palette.colors.forEach(color => {
                        const dot = document.createElement('span');
                        dot.style.cssText = `background:${color};width:10px;height:10px;display:inline-block;flex-shrink:0`;
                        swatchWrap.appendChild(dot);
                    });
                    append(makeMetaRow('Palette', swatchWrap));
                }

                if (phase === 'open' || phase === 'active') {
                    if (isImmortal) {
                        append(makeMetaRow('Lifespan', makeMetaText('∞ Forever', 'text-[11px] font-mono text-emerald-400/80 leading-snug')));
                    } else if (block.remaining != null && block.lifespan) {
                        append(makeMetaRow('Remaining', makeMetaText(
                            `${fmtNum(block.remaining)} blocks · ${fmtBlockTime(block.remaining)}`,
                            'text-[11px] font-mono text-white/70 leading-snug',
                        )));
                        append(makeMetaRow('Lifespan', makeMetaText(
                            `${fmtNum(block.lifespan)} blocks total`,
                            'text-[11px] font-mono text-white/40 leading-snug',
                        )));
                    }
                } else if (phase === 'sealed') {
                    append(makeMetaRow('Lifespan', makeMetaText('Awaiting activation', 'text-[11px] font-mono text-white/35 leading-snug')));
                } else if (phase === 'expired') {
                    append(makeMetaRow('Lifespan', makeMetaText('Expired', 'text-[11px] font-mono text-white/20 leading-snug')));
                    if (block.lifespan) {
                        append(makeMetaRow('Lived', makeMetaText(
                            `${fmtNum(block.lifespan)} blocks · ${fmtBlockTime(block.lifespan)}`,
                            'text-[11px] font-mono text-white/30 leading-snug',
                        )));
                    }
                }

                if (block.inscription) append(makeMetaRow('Ins. Block', makeMetaText(fmtNum(block.inscription), 'text-[11px] font-mono text-white/45 leading-snug')));
                if (block.activation) append(makeMetaRow('Act. Block', makeMetaText(fmtNum(block.activation), 'text-[11px] font-mono text-white/45 leading-snug')));
                if (block.expiry)     append(makeMetaRow('Exp. Block', makeMetaText(fmtNum(block.expiry),     'text-[11px] font-mono text-white/45 leading-snug')));
            }

            if (metadata?.number != null) {
                append(makeMetaRow('Ins. No.', makeMetaText(
                    `#${Number(metadata.number).toLocaleString()}`,
                    'text-[11px] font-mono text-white/40 leading-snug',
                )));
            }
        });
    }

    function renderActionButtons(item, cdnSrc, isHtml) {
        const { modalActions, rawHtmlContainer, rawHtmlContent, modalImage, modalIframe, modalVideo } = refs();
        if (!modalActions) return;

        modalActions.innerHTML = '';

        const onChainSrc = `https://ordinals.com/content/${item.id}`;

        const pill = (label, title, onClick, opts = {}) => {
            const btn = document.createElement('button');
            btn.className = `inline-flex items-center px-3 py-1.5 border ${opts.active ? 'border-white/50 text-white' : 'border-white/15 text-white/55'} text-[10px] font-mono uppercase tracking-[0.12em] hover:border-white/50 hover:text-white transition-colors duration-200 whitespace-nowrap`;
            btn.textContent = label;
            btn.title = title;
            btn.onclick = onClick;
            return btn;
        };

        modalActions.appendChild(pill('↗ Ordinals', 'Open on ordinals.com', () =>
            window.open(`https://ordinals.com/inscription/${item.id}`, '_blank')
        ));

        if (item.collection === 'BEST BEFORE') {
            const bbNum = getBBNumber(item.id);
            const bbUrl = bbNum ? `https://bestbefore.gallery/${bbNum}` : 'https://bestbefore.gallery';
            modalActions.appendChild(pill('↗ BB Gallery', 'View on bestbefore.gallery', () => {
                window.dispatchEvent(new CustomEvent('open-site-overlay', {
                    detail: { url: bbUrl, label: 'Best Before' },
                }));
            }));
        }

        modalActions.appendChild(pill('↓ Save', 'Save artwork', () => {
            if (isHtml) {
                if (item.collection === 'BEST BEFORE') {
                    showBestBeforeSaveGuide();
                    return;
                }

                // HTML artworks: emulate exactly one "S" key press in the loaded artwork iframe.
                if (htmlSaveClickLocked) return;
                htmlSaveClickLocked = true;
                setTimeout(() => { htmlSaveClickLocked = false; }, 1000);

                let frameWindow = null;
                try {
                    frameWindow = modalIframe?.contentWindow || null;
                    // Ensure same-origin access exists (blob mode).
                    void frameWindow?.document;
                } catch {
                    frameWindow = null;
                }
                if (!frameWindow) {
                    window.open(`https://ordinals.com/content/${item.id}`, '_blank');
                    return;
                }

                try { frameWindow.focus(); } catch {}
                const target =
                    frameWindow.document?.activeElement ||
                    frameWindow.document?.body ||
                    frameWindow.document;
                if (!target?.dispatchEvent) return;
                target.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 's',
                    code: 'KeyS',
                    keyCode: 83,
                    which: 83,
                    bubbles: true,
                    cancelable: true,
                }));
            } else {
                // Non-HTML artworks: download the on-chain file from ordinals.com
                const ext = getPreferredFileExtension(item);
                const filename = `${item.name || item.id}.${ext}`;
                fetch(onChainSrc)
                    .then((r) => r.blob())
                    .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = filename;
                        document.body.appendChild(anchor);
                        anchor.click();
                        document.body.removeChild(anchor);
                        URL.revokeObjectURL(url);
                    })
                    .catch(() => {
                        const anchor = document.createElement('a');
                        anchor.href = onChainSrc;
                        anchor.download = filename;
                        document.body.appendChild(anchor);
                        anchor.click();
                        document.body.removeChild(anchor);
                    });
            }
        }));

        if (isHtml && rawHtmlContainer && rawHtmlContent) {
            modalActions.appendChild(pill('HTML', 'View raw HTML source', async () => {
                rawHtmlContainer.classList.remove('hidden');
                rawHtmlContent.textContent = 'Loading…';
                try {
                    const res = await fetch(onChainSrc);
                    rawHtmlContent.textContent = await res.text();
                } catch {
                    rawHtmlContent.textContent = 'Failed to load.';
                }
            }));
        }

        const shareBtn = pill('⎋ Share', 'Copy share link to clipboard', () => {
            const url = router.buildUrlWithState({
                artwork: item.id,
            });
            navigator.clipboard.writeText(url.toString()).then(() => {
                shareBtn.textContent = '✓ Copied';
                setTimeout(() => { shareBtn.textContent = '⎋ Share'; }, 2000);
            });
        });
        modalActions.appendChild(shareBtn);

        modalActions.appendChild(pill('⟳', 'Reload content', () => {
            if (!modalImage.classList.contains('hidden') && modalImage.src) {
                const base = modalImage.src.split('?')[0];
                modalImage.src = `${base}?t=${Date.now()}`;
            }
            if (!modalIframe.classList.contains('hidden') && modalIframe.src) {
                const s = modalIframe.src;
                modalIframe.src = '';
                modalIframe.src = s;
            }
            if (modalVideo && !modalVideo.classList.contains('hidden') && modalVideo.src) {
                const s = modalVideo.src;
                modalVideo.src = '';
                modalVideo.src = s;
                modalVideo.play().catch(() => {});
            }
        }));

    }

    function openMetacard(item, cdnSrc, isHtml, options = {}) {
        const { updateUrl = true, replaceHistory = false } = options;
        const { modalTitle, modalImage, modalIframe, modalVideo, rawHtmlContainer, modalOverlay } = refs();
        if (!modalTitle || !modalImage || !modalIframe || !modalVideo || !rawHtmlContainer || !modalOverlay) return;
        const isVideo = isVideoArtwork(item);

        bindMetadataInteractions();
        closeAboutModal({ updateUrl: false });
        appState.activeSectionKey = null;
        appState.activeArtworkId = item.id;

        modalTitle.textContent = item.name;

        modalImage.classList.add('hidden');
        modalIframe.classList.add('hidden');
        modalVideo.classList.add('hidden');
        rawHtmlContainer.classList.add('hidden');
        modalImage.src = '';
        modalIframe.src = '';
        modalVideo.src = '';
        clearActiveHtmlBlobUrl();
        htmlBlobLoadToken += 1;

        if (isHtml) {
            const currentToken = htmlBlobLoadToken;
            modalIframe.classList.remove('hidden');
            if (DIRECT_HTML_RENDER_COLLECTIONS.has(item.collection)) {
                modalIframe.src = `https://ordinals.com/content/${item.id}`;
                renderMetadataList(item);
                renderActionButtons(item, cdnSrc, isHtml);

                modalOverlay.classList.remove('hidden');
                requestAnimationFrame(() => modalOverlay.classList.remove('opacity-0'));

                if (updateUrl) {
                    router.syncUrlState({
                        artwork: item.id,
                    }, { replaceHistory });
                }
                return;
            }
            // Render HTML via same-origin blob so Save can dispatch one S key reliably.
            void buildSaveEnabledHtmlBlobUrl(item.id).then((blobUrl) => {
                if (!blobUrl) {
                    if (appState.activeArtworkId === item.id && currentToken === htmlBlobLoadToken) {
                        modalIframe.src = `https://ordinals.com/content/${item.id}`;
                    }
                    return;
                }

                if (appState.activeArtworkId !== item.id || currentToken !== htmlBlobLoadToken) {
                    try { URL.revokeObjectURL(blobUrl); } catch {}
                    return;
                }

                activeHtmlBlobUrl = blobUrl;
                modalIframe.src = blobUrl;
            });
        } else if (isVideo) {
            modalVideo.src = `https://ordinals.com/content/${item.id}`;
            modalVideo.classList.remove('hidden');
            modalVideo.play().catch(() => {});
        } else {
            modalImage.src = `https://ordinals.com/content/${item.id}`;
            modalImage.classList.remove('hidden');
        }

        renderMetadataList(item);
        renderActionButtons(item, cdnSrc, isHtml);

        modalOverlay.classList.remove('hidden');
        requestAnimationFrame(() => modalOverlay.classList.remove('opacity-0'));

        if (updateUrl) {
            router.syncUrlState({
                artwork: item.id,
            }, { replaceHistory });
        }
    }

    function closeModal(options = {}) {
        const { updateUrl = true, replaceHistory = false } = options;
        const { modalOverlay, modalImage, modalIframe, modalVideo, rawHtmlContainer } = refs();

        const hadArtwork = Boolean(appState.activeArtworkId);
        appState.activeArtworkId = null;

        if (updateUrl && hadArtwork) {
            const activeCollection = resolveCollectionName(appState.currentFilter);
            router.syncUrlState({
                artwork: null,
                section: appState.activeSectionKey || null,
                collection: activeCollection && activeCollection !== 'Home' ? activeCollection : null,
            }, { replaceHistory });
        }

        if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;

        modalOverlay.classList.add('opacity-0');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            if (modalImage) { modalImage.src = ''; modalImage.classList.add('hidden'); }
            if (modalIframe) { modalIframe.src = ''; modalIframe.classList.add('hidden'); }
            if (modalVideo) { modalVideo.pause(); modalVideo.src = ''; modalVideo.classList.add('hidden'); }
            if (rawHtmlContainer) rawHtmlContainer.classList.add('hidden');
            htmlBlobLoadToken += 1;
            metadataRenderToken += 1;
            clearActiveHtmlBlobUrl();
        }, 300);
    }

    return { openMetacard, closeModal };
}
