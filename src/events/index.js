export function setupAppEventListeners({
    menuToggle,
    toggleMobileMenu,
    applyUrlStateFromLocation,
    mobileBackdrop,
    closeModal,
    closeAboutModal,
    loadCollection,
    isMobileMenuOpen,
    modalClose,
    modalOverlay,
    closeRawHtml,
    rawHtmlContainer,
    aboutClose,
    aboutOverlay,
    testerToggle,
    testerClose,
    testerBtn,
    testerInput,
    testerModal,
    toggleTester,
    runTester,
}) {
    if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);

    window.addEventListener('popstate', () => {
        applyUrlStateFromLocation({ replaceHistory: true });
    });

    const backdrop = mobileBackdrop();
    if (backdrop) backdrop.addEventListener('click', toggleMobileMenu);

    const logoLink = document.querySelector('aside > a');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal({ updateUrl: false });
            closeAboutModal({ updateUrl: false });
            loadCollection('Home');
            if (window.innerWidth < 768 && isMobileMenuOpen()) {
                toggleMobileMenu();
            }
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    if (closeRawHtml) {
        closeRawHtml.addEventListener('click', () => {
            rawHtmlContainer.classList.add('hidden');
        });
    }

    if (aboutClose) aboutClose.addEventListener('click', closeAboutModal);
    if (aboutOverlay) {
        aboutOverlay.addEventListener('click', (e) => {
            if (e.target === aboutOverlay || e.target.id === 'about-wrapper') closeAboutModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (rawHtmlContainer && !rawHtmlContainer.classList.contains('hidden')) {
                rawHtmlContainer.classList.add('hidden');
            } else if (testerModal && !testerModal.classList.contains('hidden')) {
                toggleTester();
            } else {
                closeModal();
                closeAboutModal();
            }
        }
    });

    if (testerToggle) {
        testerToggle.addEventListener('click', toggleTester);
        testerClose.addEventListener('click', toggleTester);
        testerBtn.addEventListener('click', runTester);
        testerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') runTester();
        });

        if (testerModal) {
            testerModal.addEventListener('click', (e) => {
                if (e.target === testerModal) toggleTester();
            });
        }
    }
}
