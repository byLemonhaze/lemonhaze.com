/**
 * Palette Engine — in-page modal for lemonhaze.com
 * Matches site aesthetic: dark bg, Fragment Mono, hard edges, no rounded corners.
 */
import { generatePalette, makeRandomSeed, THEME_OPTIONS } from '../../modules/palette-engine.js';

const AUTO_ID = '__auto';
const SWATCH_COUNT = 5;
const LOCK_KEY = 'lh-palette-locks-v1';
const FAV_KEY  = 'lh-palette-favorites-v1';

// ── State ──────────────────────────────────────────────────────────────────
let state = {
    seed: makeRandomSeed(),
    palette: [],
    themeId: '',
    themeName: '',
    selectedThemeId: AUTO_ID,
    locks: Array(SWATCH_COUNT).fill(false),
    favorites: [],
    copiedHex: null,
};

// ── Persistence ───────────────────────────────────────────────────────────
const loadFavorites = () => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]').slice(0, 12); }
    catch { return []; }
};
const saveFavorites = () => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(state.favorites)); } catch { /* */ }
};

// ── Palette logic ─────────────────────────────────────────────────────────
function lockedColors() {
    return state.locks.map((locked, i) => locked ? state.palette[i]?.hsl ?? null : null);
}

function regen(seed, themeId) {
    const preferred = themeId === AUTO_ID ? undefined : themeId;
    const result = generatePalette(seed ?? makeRandomSeed(), lockedColors(), preferred);
    state.seed = seed ?? result.seed ?? state.seed;
    state.palette = result.colors;
    state.themeId = result.themeId;
    state.themeName = result.themeName;
}

function generate() {
    regen(makeRandomSeed(), state.selectedThemeId);
}

function iterate() {
    // Deterministic next seed: mulberry step
    const next = ((state.seed + 0x6d2b79f5) >>> 0);
    regen(next, state.selectedThemeId);
}

// ── Copy ───────────────────────────────────────────────────────────────────
function copyHex(hex, btn) {
    navigator.clipboard.writeText(hex).then(() => {
        state.copiedHex = hex;
        btn.textContent = 'copied';
        setTimeout(() => { btn.textContent = hex.toUpperCase(); state.copiedHex = null; }, 1300);
    }).catch(() => {});
}

// ── DOM builders ───────────────────────────────────────────────────────────
function buildSwatch(color, index, onUpdate) {
    const wrap = document.createElement('div');
    wrap.className = 'relative flex flex-col gap-1';

    const swatch = document.createElement('div');
    swatch.style.cssText = `background:${color.hex}; height:80px; cursor:pointer; transition: box-shadow 0.15s;`;
    swatch.title = 'Click to copy';

    const hexBtn = document.createElement('button');
    hexBtn.className = 'w-full text-left font-mono text-[9px] text-white/50 hover:text-white transition-colors tracking-[0.1em] py-0.5';
    hexBtn.textContent = color.hex.toUpperCase();
    hexBtn.onclick = () => copyHex(color.hex, hexBtn);

    swatch.onclick = () => copyHex(color.hex, hexBtn);

    const lockBtn = document.createElement('button');
    const isLocked = state.locks[index];
    lockBtn.className = 'w-full text-left font-mono text-[9px] tracking-[0.12em] transition-colors py-0.5 ' +
        (isLocked ? 'text-white' : 'text-white/20 hover:text-white/50');
    lockBtn.textContent = isLocked ? '[ locked ]' : '[ lock ]';
    lockBtn.onclick = () => {
        state.locks[index] = !state.locks[index];
        onUpdate();
    };

    // Glow on locked
    if (isLocked) {
        swatch.style.boxShadow = `0 0 0 1px ${color.hex}80`;
    }

    wrap.appendChild(swatch);
    wrap.appendChild(hexBtn);
    wrap.appendChild(lockBtn);
    return wrap;
}

function buildFavCard(colors, index, onApply, onRemove) {
    const card = document.createElement('div');
    card.className = 'flex items-center gap-2 py-2 border-b border-white/5 group';

    const swatches = document.createElement('div');
    swatches.className = 'flex gap-0.5 flex-1 cursor-pointer';
    swatches.onclick = () => onApply(index);
    colors.forEach(c => {
        const dot = document.createElement('div');
        dot.style.cssText = `background:${c.hex}; height:20px; flex:1;`;
        swatches.appendChild(dot);
    });

    const rm = document.createElement('button');
    rm.className = 'font-mono text-[9px] text-white/15 hover:text-white/50 transition-colors shrink-0 tracking-[0.1em]';
    rm.textContent = '×';
    rm.onclick = () => onRemove(index);

    card.appendChild(swatches);
    card.appendChild(rm);
    return card;
}

// ── Main modal builder ─────────────────────────────────────────────────────
export function openPaletteModal() {
    // Init
    state.favorites = loadFavorites();
    regen(makeRandomSeed(), AUTO_ID);

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[200] bg-black/90 flex items-start justify-center overflow-y-auto';
    overlay.style.cssText = 'backdrop-filter: none;';

    const panel = document.createElement('div');
    panel.className = 'relative w-full max-w-3xl mx-4 my-12 bg-[#080808] border border-white/10';
    panel.onclick = e => e.stopPropagation();

    // Close on backdrop click
    overlay.onclick = () => overlay.remove();

    // ── Header ──────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-6 py-4 border-b border-white/10';

    const titleBlock = document.createElement('div');
    const label = document.createElement('p');
    label.className = 'font-mono text-[9px] uppercase tracking-[0.28em] text-white/25 mb-0.5';
    label.textContent = 'by lemonhaze';
    const h1 = document.createElement('h2');
    h1.className = 'text-[13px] font-bold uppercase tracking-[0.2em] text-white';
    h1.textContent = 'Palette Engine';
    titleBlock.appendChild(label);
    titleBlock.appendChild(h1);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'font-mono text-[11px] text-white/30 hover:text-white transition-colors tracking-[0.15em]';
    closeBtn.textContent = '[ close ]';
    closeBtn.onclick = () => overlay.remove();

    header.appendChild(titleBlock);
    header.appendChild(closeBtn);

    // ── Theme selector ───────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'flex items-center gap-4 px-6 py-3 border-b border-white/5';

    const themeLabel = document.createElement('span');
    themeLabel.className = 'font-mono text-[9px] text-white/25 uppercase tracking-[0.15em] shrink-0';
    themeLabel.textContent = 'Theme';

    const themeSelect = document.createElement('select');
    themeSelect.className = 'flex-1 bg-transparent border border-white/10 font-mono text-[10px] text-white/60 py-1 px-2 tracking-[0.1em] focus:border-white/30';
    themeSelect.style.fontFamily = '"Fragment Mono", monospace';

    const autoOpt = document.createElement('option');
    autoOpt.value = AUTO_ID;
    autoOpt.textContent = 'AUTO';
    themeSelect.appendChild(autoOpt);

    THEME_OPTIONS.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name.toUpperCase();
        themeSelect.appendChild(opt);
    });

    themeSelect.onchange = () => {
        state.selectedThemeId = themeSelect.value;
        regen(state.seed, state.selectedThemeId);
        renderSwatches();
        renderMeta();
    };

    const seedSpan = document.createElement('span');
    seedSpan.className = 'font-mono text-[9px] text-white/20 tracking-[0.1em] shrink-0';

    controls.appendChild(themeLabel);
    controls.appendChild(themeSelect);
    controls.appendChild(seedSpan);

    // ── Swatches ─────────────────────────────────────────────────────────────
    const swatchGrid = document.createElement('div');
    swatchGrid.className = 'grid grid-cols-5 gap-3 px-6 py-5';

    function renderSwatches() {
        swatchGrid.innerHTML = '';
        state.palette.forEach((color, i) => {
            swatchGrid.appendChild(buildSwatch(color, i, () => {
                regen(state.seed, state.selectedThemeId);
                renderSwatches();
                renderMeta();
            }));
        });
    }

    function renderMeta() {
        seedSpan.textContent = `seed:${state.seed}`;
    }

    renderSwatches();
    renderMeta();

    // ── Export row ───────────────────────────────────────────────────────────
    const exportRow = document.createElement('div');
    exportRow.className = 'px-6 py-2 border-t border-white/5';
    const cssLink = document.createElement('button');
    cssLink.className = 'font-mono text-[9px] text-white/20 hover:text-white/50 transition-colors tracking-[0.12em]';
    cssLink.textContent = '↓ export css';
    cssLink.onclick = () => {
        const css = `:root {\n${state.palette.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')}\n}\n`;
        const blob = new Blob([css], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'palette.css'; a.click();
        URL.revokeObjectURL(url);
    };
    exportRow.appendChild(cssLink);

    // ── Actions ───────────────────────────────────────────────────────────────
    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-3 px-6 py-4 border-t border-white/10';

    const makeBtn = (label, onClick, primary = false) => {
        const btn = document.createElement('button');
        btn.className = primary
            ? 'font-mono text-[10px] uppercase tracking-[0.18em] text-black bg-white px-4 py-2 hover:bg-white/80 transition-colors'
            : 'font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 border border-white/15 px-4 py-2 hover:text-white hover:border-white/40 transition-colors';
        btn.textContent = label;
        btn.onclick = onClick;
        return btn;
    };

    const genBtn = makeBtn('Generate', () => { generate(); renderSwatches(); renderMeta(); }, true);
    const iterBtn = makeBtn('Iterate', () => { iterate(); renderSwatches(); renderMeta(); });
    const saveBtn = makeBtn('Save', () => {
        const key = state.palette.map(c => c.hex).join(',');
        if (!state.favorites.some(f => f.map(c => c.hex).join(',') === key)) {
            state.favorites = [state.palette, ...state.favorites].slice(0, 12);
            saveFavorites();
            renderFavorites();
        }
    });

    actions.appendChild(genBtn);
    actions.appendChild(iterBtn);
    actions.appendChild(saveBtn);

    // ── Favorites ────────────────────────────────────────────────────────────
    const favSection = document.createElement('div');
    favSection.className = 'px-6 pb-4';

    const favHeader = document.createElement('p');
    favHeader.className = 'font-mono text-[9px] uppercase tracking-[0.2em] text-white/20 mb-2 pt-2 border-t border-white/5';
    favHeader.textContent = 'Saved Palettes';

    const favList = document.createElement('div');

    function renderFavorites() {
        favList.innerHTML = '';
        if (!state.favorites.length) {
            const empty = document.createElement('p');
            empty.className = 'font-mono text-[9px] text-white/15 tracking-[0.1em]';
            empty.textContent = 'None saved yet.';
            favList.appendChild(empty);
            return;
        }
        state.favorites.forEach((colors, i) => {
            favList.appendChild(buildFavCard(
                colors,
                i,
                (idx) => {
                    state.palette = state.favorites[idx];
                    state.locks = Array(SWATCH_COUNT).fill(false);
                    renderSwatches();
                    renderMeta();
                },
                (idx) => {
                    state.favorites.splice(idx, 1);
                    saveFavorites();
                    renderFavorites();
                }
            ));
        });
    }

    favSection.appendChild(favHeader);
    favSection.appendChild(favList);
    renderFavorites();

    // ── Assemble ──────────────────────────────────────────────────────────────
    panel.appendChild(header);
    panel.appendChild(controls);
    panel.appendChild(swatchGrid);
    panel.appendChild(exportRow);
    panel.appendChild(actions);
    panel.appendChild(favSection);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // ESC to close
    const onKey = (e) => { if (e.key === 'Escape') { overlay.remove(); window.removeEventListener('keydown', onKey); } };
    window.addEventListener('keydown', onKey);
    overlay.addEventListener('remove', () => window.removeEventListener('keydown', onKey));
}
