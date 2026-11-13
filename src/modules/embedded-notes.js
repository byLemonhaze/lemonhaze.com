// Read the inscription as text only. Its scripts never execute in the notes UI.
export function extractEmbeddedNotes(source) {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_COMMENT);
    const notes = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentElement?.closest('script,style')) continue;
        const text = node.data.trim();
        if (text) notes.push(text);
    }
    return notes.join('\n\n');
}

export function mountEmbeddedNotes(container, id) {
    const disclosure = document.createElement('details');
    disclosure.className = 'embedded-notes';
    disclosure.innerHTML = '<summary>Embedded notes</summary><p class="embedded-notes-status" role="status"></p><pre class="embedded-notes-text" hidden></pre><details class="embedded-notes-source" hidden><summary>Original HTML source</summary><pre></pre></details>';
    container.append(disclosure);
    const status = disclosure.querySelector('[role=status]');
    const notes = disclosure.querySelector('.embedded-notes-text');
    const source = disclosure.querySelector('.embedded-notes-source');
    let request = null, loaded = false, disposed = false;
    const load = async () => {
        if (!disclosure.open || loaded || request || disposed) return;
        request = new AbortController();
        status.textContent = 'Loading the notes inscribed with this work…';
        try {
            const response = await fetch(`https://ordinals.com/content/${id}`, {signal: request.signal});
            if (!response.ok) throw new Error('Unavailable');
            const html = await response.text();
            if (disposed) return;
            const text = extractEmbeddedNotes(html);
            notes.textContent = text; notes.hidden = !text;
            status.textContent = text ? 'Original words, preserved from the inscription.' : 'No embedded comment notes were found. The original HTML is available below.';
            source.querySelector('pre').textContent = html; source.hidden = false;
            loaded = true;
        } catch (error) {
            if (!disposed && error.name !== 'AbortError') status.textContent = 'The inscription could not be reached. Close and reopen Embedded notes to retry.';
        } finally { request = null; }
    };
    disclosure.addEventListener('toggle', load);
    return () => { disposed = true; request?.abort(); disclosure.removeEventListener('toggle', load); disclosure.remove(); };
}
