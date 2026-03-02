/**
 * Press Engine — personal content lab for lemonhaze.com
 * Password-protected. Generates press copy, artist statements, collection notes,
 * captions, interview answers, and blog drafts using Claude with deep Lemonhaze context.
 */

const CONTENT_TYPES = [
    { id: 'statement',   label: 'Artist Statement',   hint: 'A current, grounded statement of practice — who you are and what you make.' },
    { id: 'collection',  label: 'Collection Note',    hint: 'Short dispatch about a collection — context, concept, what makes it yours.' },
    { id: 'press',       label: 'Press Release',      hint: 'Announcement-style copy for an event, drop, or exhibition.' },
    { id: 'blog',        label: 'Blog Draft',         hint: 'Personal, first-person editorial — practice, process, a moment, a thought.' },
    { id: 'caption',     label: 'Caption / Short',    hint: 'Tight, punchy caption or social copy for a specific work or moment.' },
    { id: 'interview',   label: 'Interview Answer',   hint: 'Answer a question as Lemonhaze — specific, personal, unguarded.' },
    { id: 'bio',         label: 'Bio Variant',        hint: 'Short (50w), medium (100w), or long (200w) bio for a specific context.' },
];

const COLLECTIONS = [
    'BEST BEFORE','Paint Engine','Portrait 2490','Manufactured','Cypherville',
    'Gentlemen','Lotus','Old-Fashioned','Berlin','Oaxaca','Montreal','Volatility',
    'La Tentation','DeVille','Games','Unregulated Minds','Candidly Yours',
    'Generative Composition','Ma ville en quatre temps','Tori no Roji',
    'Little Get Away','Ordinals Summer','Discography','Mending Fragments',
    'Jardin Secret','Dark Days','Bento Box','Fading','Framed','Orphelinat',
    'Untitled','Polaroid','Tad Small','1 of 1s (2026)',
];

const PASS_KEY = 'lh-press-pass-v1';

function getStoredPass() {
    try { return sessionStorage.getItem(PASS_KEY) || ''; } catch { return ''; }
}
function storePass(p) {
    try { sessionStorage.setItem(PASS_KEY, p); } catch { /* */ }
}

// ── Main entry ─────────────────────────────────────────────────────────────
export function openPressEngine() {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[200] bg-black/90 flex items-start justify-center overflow-y-auto';
    overlay.onclick = () => overlay.remove();

    const panel = document.createElement('div');
    panel.className = 'relative w-full max-w-2xl mx-4 my-12 bg-[#080808] border border-white/10';
    panel.onclick = e => e.stopPropagation();

    const stored = getStoredPass();
    if (stored) {
        renderEngine(panel, stored);
    } else {
        renderAuth(panel, overlay);
    }

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const onKey = e => { if (e.key === 'Escape') { overlay.remove(); window.removeEventListener('keydown', onKey); } };
    window.addEventListener('keydown', onKey);
}

// ── Auth gate ──────────────────────────────────────────────────────────────
function renderAuth(panel, overlay) {
    panel.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'px-6 py-8 flex flex-col gap-4';

    const lbl = document.createElement('p');
    lbl.className = 'font-mono text-[9px] uppercase tracking-[0.28em] text-white/30';
    lbl.textContent = 'Press Engine · lemonhaze.com';

    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = 'Password';
    input.className = 'w-full bg-transparent border border-white/15 font-mono text-[11px] text-white/70 px-3 py-2 placeholder-white/20 tracking-[0.1em]';
    input.style.fontFamily = '"Fragment Mono", monospace';
    input.autofocus = true;

    const err = document.createElement('p');
    err.className = 'font-mono text-[9px] text-red-400/70 tracking-[0.1em] hidden';
    err.textContent = 'Wrong password.';

    const btn = document.createElement('button');
    btn.className = 'font-mono text-[10px] uppercase tracking-[0.18em] text-black bg-white px-4 py-2 hover:bg-white/80 transition-colors w-fit';
    btn.textContent = 'Enter';

    const attempt = async () => {
        const pass = input.value.trim();
        if (!pass) return;
        // Verify against the Cloudflare function
        try {
            const res = await fetch('/api/press-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-press-password': pass },
                body: JSON.stringify({ action: 'auth' }),
            });
            if (res.ok) {
                storePass(pass);
                renderEngine(panel, pass);
            } else {
                err.classList.remove('hidden');
                input.value = '';
                input.focus();
            }
        } catch {
            err.classList.remove('hidden');
        }
    };

    btn.onclick = attempt;
    input.onkeydown = e => { if (e.key === 'Enter') attempt(); };

    wrap.appendChild(lbl);
    wrap.appendChild(input);
    wrap.appendChild(err);
    wrap.appendChild(btn);
    panel.appendChild(wrap);

    setTimeout(() => input.focus(), 50);
}

// ── Engine UI ─────────────────────────────────────────────────────────────
function renderEngine(panel, password) {
    panel.innerHTML = '';

    let selectedType = CONTENT_TYPES[0];
    let context = '';
    let result = '';
    let generating = false;

    // ── Header ───────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-6 py-4 border-b border-white/10';

    const titleBlock = document.createElement('div');
    const sublabel = document.createElement('p');
    sublabel.className = 'font-mono text-[9px] uppercase tracking-[0.28em] text-white/25 mb-0.5';
    sublabel.textContent = 'by lemonhaze';
    const title = document.createElement('h2');
    title.className = 'text-[13px] font-bold uppercase tracking-[0.2em] text-white';
    title.textContent = 'Press Engine';
    titleBlock.appendChild(sublabel);
    titleBlock.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'font-mono text-[11px] text-white/30 hover:text-white transition-colors tracking-[0.15em]';
    closeBtn.textContent = '[ close ]';
    closeBtn.onclick = () => panel.closest('.fixed').remove();
    header.appendChild(titleBlock);
    header.appendChild(closeBtn);

    // ── Type selector ─────────────────────────────────────────────────────────
    const typeRow = document.createElement('div');
    typeRow.className = 'flex flex-wrap gap-1.5 px-6 py-4 border-b border-white/5';

    const typeBtns = CONTENT_TYPES.map(type => {
        const btn = document.createElement('button');
        btn.className = 'font-mono text-[9px] uppercase tracking-[0.14em] border px-2 py-1 transition-colors ' +
            (type.id === selectedType.id ? 'border-white/50 text-white' : 'border-white/10 text-white/30 hover:border-white/30 hover:text-white/60');
        btn.textContent = type.label;
        btn.onclick = () => {
            selectedType = type;
            typeBtns.forEach((b, i) => {
                b.className = 'font-mono text-[9px] uppercase tracking-[0.14em] border px-2 py-1 transition-colors ' +
                    (CONTENT_TYPES[i].id === selectedType.id ? 'border-white/50 text-white' : 'border-white/10 text-white/30 hover:border-white/30 hover:text-white/60');
            });
            hintEl.textContent = selectedType.hint;
            updateCollectionPicker();
        };
        typeRow.appendChild(btn);
        return btn;
    });

    const hintEl = document.createElement('p');
    hintEl.className = 'w-full font-mono text-[9px] text-white/20 tracking-[0.08em] mt-1';
    hintEl.textContent = selectedType.hint;
    typeRow.appendChild(hintEl);

    // ── Context area ───────────────────────────────────────────────────────────
    const contextSection = document.createElement('div');
    contextSection.className = 'px-6 py-4 border-b border-white/5 flex flex-col gap-3';

    const collectionRow = document.createElement('div');
    collectionRow.className = 'flex items-center gap-3';

    const collLabel = document.createElement('span');
    collLabel.className = 'font-mono text-[9px] text-white/25 uppercase tracking-[0.15em] shrink-0';
    collLabel.textContent = 'Collection';

    const collSelect = document.createElement('select');
    collSelect.className = 'flex-1 bg-transparent border border-white/10 font-mono text-[10px] text-white/50 py-1 px-2 tracking-[0.08em]';
    collSelect.style.fontFamily = '"Fragment Mono", monospace';

    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = '— none —';
    collSelect.appendChild(noneOpt);
    COLLECTIONS.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        collSelect.appendChild(opt);
    });

    collectionRow.appendChild(collLabel);
    collectionRow.appendChild(collSelect);

    function updateCollectionPicker() {
        const needsColl = ['collection','caption','press'].includes(selectedType.id);
        collectionRow.style.display = needsColl ? 'flex' : 'none';
    }
    updateCollectionPicker();

    const ctxLabel = document.createElement('p');
    ctxLabel.className = 'font-mono text-[9px] text-white/25 uppercase tracking-[0.15em]';
    ctxLabel.textContent = 'Additional context (optional)';

    const ctxInput = document.createElement('textarea');
    ctxInput.className = 'w-full bg-transparent border border-white/10 font-mono text-[11px] text-white/60 px-3 py-2 resize-none placeholder-white/15 tracking-[0.06em] leading-relaxed';
    ctxInput.style.fontFamily = '"Fragment Mono", monospace';
    ctxInput.rows = 3;
    ctxInput.placeholder = 'Specific angle, event, date, quote, or anything else to focus on...';
    ctxInput.oninput = () => { context = ctxInput.value; };

    contextSection.appendChild(collectionRow);
    contextSection.appendChild(ctxLabel);
    contextSection.appendChild(ctxInput);

    // ── Generate button ────────────────────────────────────────────────────────
    const actionsRow = document.createElement('div');
    actionsRow.className = 'flex items-center gap-3 px-6 py-4 border-b border-white/10';

    const genBtn = document.createElement('button');
    genBtn.className = 'font-mono text-[10px] uppercase tracking-[0.18em] text-black bg-white px-4 py-2 hover:bg-white/80 transition-colors';
    genBtn.textContent = 'Generate';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 border border-white/15 px-4 py-2 hover:text-white hover:border-white/40 transition-colors hidden';
    copyBtn.textContent = 'Copy';

    const statusEl = document.createElement('span');
    statusEl.className = 'font-mono text-[9px] text-white/20 tracking-[0.1em] ml-auto';

    actionsRow.appendChild(genBtn);
    actionsRow.appendChild(copyBtn);
    actionsRow.appendChild(statusEl);

    // ── Output ─────────────────────────────────────────────────────────────────
    const outputSection = document.createElement('div');
    outputSection.className = 'px-6 py-4 min-h-[120px]';

    const outputEl = document.createElement('div');
    outputEl.className = 'font-mono text-[11px] text-white/60 leading-relaxed tracking-[0.05em] whitespace-pre-wrap hidden';
    outputSection.appendChild(outputEl);

    genBtn.onclick = async () => {
        if (generating) return;
        generating = true;
        genBtn.textContent = 'Generating...';
        genBtn.disabled = true;
        statusEl.textContent = '';
        outputEl.textContent = '';
        outputEl.classList.add('hidden');
        copyBtn.classList.add('hidden');

        try {
            const body = {
                action: 'generate',
                type: selectedType.id,
                collection: collSelect.value || null,
                context: ctxInput.value.trim() || null,
            };
            const res = await fetch('/api/press-engine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-press-password': password },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                statusEl.textContent = errData.error || `Error ${res.status}`;
                return;
            }

            // Stream the response
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            result = '';
            outputEl.classList.remove('hidden');
            outputEl.textContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    result += chunk;
                    outputEl.textContent = result;
                }
            } else {
                const data = await res.json();
                result = data.text || '';
                outputEl.textContent = result;
            }

            copyBtn.classList.remove('hidden');
            statusEl.textContent = `${selectedType.label} · ${result.split(/\s+/).length} words`;
        } catch (err) {
            statusEl.textContent = err.message || 'Request failed.';
        } finally {
            generating = false;
            genBtn.textContent = 'Generate';
            genBtn.disabled = false;
        }
    };

    copyBtn.onclick = async () => {
        await navigator.clipboard.writeText(result);
        copyBtn.textContent = 'Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1300);
    };

    // ── Assemble ──────────────────────────────────────────────────────────────
    panel.appendChild(header);
    panel.appendChild(typeRow);
    panel.appendChild(contextSection);
    panel.appendChild(actionsRow);
    panel.appendChild(outputSection);
}
