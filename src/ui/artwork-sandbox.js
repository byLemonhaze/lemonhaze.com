// Never grant same-origin to fetched HTML: blob URLs otherwise inherit the site origin.
export const ARTWORK_SANDBOX = 'allow-scripts allow-downloads allow-pointer-lock';

function saveBridge(token, parentOrigin) {
    window.addEventListener('message', event => {
        if (event.source !== parent || event.origin !== parentOrigin) return;
        const data = event.data;
        if (data?.channel !== 'lemonhaze-artwork-save' || data.token !== token || data.type !== 'save') return;
        const target = document.activeElement || document.body || document;
        target.dispatchEvent(new KeyboardEvent('keydown', {
            key: 's', code: 'KeyS', keyCode: 83, which: 83, bubbles: true, cancelable: true,
        }));
    });
}

export function buildSandboxedArtworkHtml(html, token, parentOrigin) {
    const literal = value => JSON.stringify(value).replaceAll('<', '\\u003c');
    const bridge = `<script>(${saveBridge.toString()})(${literal(token)},${literal(parentOrigin)});</script>`;
    return /<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>/i, () => bridge + '</body>') : html + bridge;
}
