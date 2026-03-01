const DESKTOP_QUERY = '(min-width: 768px)';

export function createHomeLayoutController({
    getSidebar,
    getToggleButton,
    getRailMark,
}) {
    let isHomeMode = false;
    let isPinned = true;
    let hasSetup = false;
    let onResize = null;
    let onToggle = null;

    const isDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;

    const syncLayout = () => {
        document.body.classList.toggle('home-art-first', isHomeMode);

        const sidebar = getSidebar?.();
        const toggleButton = getToggleButton?.();
        const railMark = getRailMark?.();
        if (!sidebar) return;

        if (!isHomeMode || !isDesktop()) {
            sidebar.dataset.expanded = 'true';
            if (toggleButton) {
                toggleButton.classList.add('hidden');
                toggleButton.setAttribute('aria-pressed', 'false');
                toggleButton.title = 'Pin sidebar';
            }
            if (railMark) railMark.classList.add('hidden');
            return;
        }

        sidebar.dataset.expanded = isPinned ? 'true' : 'false';
        if (toggleButton) {
            toggleButton.classList.remove('hidden');
            toggleButton.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
            toggleButton.title = isPinned ? 'Unpin sidebar' : 'Pin sidebar';
        }
        if (railMark) railMark.classList.remove('hidden');
    };

    return {
        setup() {
            if (hasSetup) {
                syncLayout();
                return () => {};
            }

            const toggleButton = getToggleButton?.();
            onToggle = () => {
                isPinned = !isPinned;
                syncLayout();
            };
            if (toggleButton) {
                toggleButton.addEventListener('click', onToggle);
            }

            onResize = () => {
                syncLayout();
            };
            window.addEventListener('resize', onResize);

            hasSetup = true;
            syncLayout();

            return () => {
                if (toggleButton && onToggle) {
                    toggleButton.removeEventListener('click', onToggle);
                }
                if (onResize) {
                    window.removeEventListener('resize', onResize);
                }
                hasSetup = false;
            };
        },
        setHomeMode(nextIsHomeMode) {
            isHomeMode = Boolean(nextIsHomeMode);
            syncLayout();
        },
        setPinned(nextIsPinned) {
            isPinned = Boolean(nextIsPinned);
            syncLayout();
        },
    };
}
