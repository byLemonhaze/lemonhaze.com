export function toggleMobileSidebar({ appState, sidebar, mobileBackdrop }) {
    appState.isMobileMenuOpen = !appState.isMobileMenuOpen;
    if (sidebar) {
        sidebar.classList.toggle('-translate-x-full');
    }

    const backdrop = mobileBackdrop();
    if (backdrop) {
        if (appState.isMobileMenuOpen) {
            backdrop.classList.remove('hidden');
        } else {
            backdrop.classList.add('hidden');
        }
    }
}

export function closeMobileSidebar({ appState, sidebar, mobileBackdrop }) {
    appState.isMobileMenuOpen = false;

    if (sidebar) {
        sidebar.classList.add('-translate-x-full');
    }

    const backdrop = mobileBackdrop();
    if (backdrop) {
        backdrop.classList.add('hidden');
    }
}
