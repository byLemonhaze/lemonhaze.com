// Loading feedback follows the active media request, including reloads.
export function createArtworkLoadingIndicator(panel) {
    if (!panel) return { start() {}, watch() {}, clear() {} };
    const status = document.createElement('div');
    status.className = 'artwork-loading';
    status.hidden = true;
    status.setAttribute('role', 'status');
    status.innerHTML = '<span class="artwork-loading-square" aria-hidden="true"></span><span class="artwork-loading-label"></span>';
    panel.appendChild(status);
    const label = status.querySelector('.artwork-loading-label');
    let removeListeners = () => {};
    let slowTimer;
    let revision = 0;

    function clear() {
        revision += 1;
        removeListeners();
        clearTimeout(slowTimer);
        status.hidden = true;
        panel.removeAttribute('aria-busy');
    }

    function start() {
        clear();
        status.classList.remove('artwork-loading-error');
        label.textContent = 'Loading artwork';
        status.hidden = false;
        panel.setAttribute('aria-busy', 'true');
        slowTimer = setTimeout(() => { label.textContent = 'Still loading artwork…'; }, 20000);
    }

    function watch(media) {
        removeListeners();
        const current = revision;
        const event = media.tagName === 'VIDEO' ? 'loadeddata' : 'load';
        const loaded = () => {
            // The persistent iframe also emits load when reset to an empty document.
            if (media.tagName === 'IFRAME') {
                try { if (media.contentWindow.location.href === 'about:blank') return; } catch { /* Original on-chain viewer is cross-origin. */ }
            }
            requestAnimationFrame(() => requestAnimationFrame(() => {
                if (current === revision) clear();
            }));
        };
        const failed = () => {
            if (current !== revision) return;
            clearTimeout(slowTimer);
            panel.removeAttribute('aria-busy');
            status.classList.add('artwork-loading-error');
            label.textContent = 'Unable to load artwork. Try reloading.';
        };
        media.addEventListener(event, loaded);
        media.addEventListener('error', failed);
        removeListeners = () => {
            media.removeEventListener(event, loaded);
            media.removeEventListener('error', failed);
        };
    }

    return { start, watch, clear };
}
