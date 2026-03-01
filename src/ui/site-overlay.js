export function setupSiteOverlay() {
    const overlay = document.getElementById('site-overlay');
    const iframe = document.getElementById('site-overlay-iframe');
    const label = document.getElementById('site-overlay-label');
    const closeBtn = document.getElementById('site-overlay-close');

    function openSite(url, siteName) {
        if (!overlay || !iframe) return;
        if (label) label.textContent = siteName || '';
        iframe.src = url;
        overlay.classList.remove('hidden');
    }

    function closeSite() {
        if (!overlay || !iframe) return;
        overlay.classList.add('hidden');
        iframe.src = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeSite);

    window.addEventListener('open-site-overlay', (e) => {
        openSite(e.detail?.url, e.detail?.label);
    });
}
