function isAboutSectionTitle(title) {
    return title === 'About' || title === 'About Lemonhaze';
}

export function openSectionModal({
    title,
    content,
    options = {},
    refreshElements,
    refs,
    normalizeSectionKey,
    appState,
    syncUrlState,
}) {
    const { updateUrl = true, replaceHistory = false, sectionKey = null } = options;

    refreshElements();
    const { aboutTitle, aboutContent, aboutOverlay } = refs();

    if (!aboutTitle || !aboutContent || !aboutOverlay) {
        console.error('About modal elements missing');
        return;
    }

    aboutTitle.textContent = title;

    if (content instanceof Node) {
        if (isAboutSectionTitle(title)) {
            const wrap = document.createElement('div');
            wrap.className = 'max-w-[68rem] mx-auto';
            wrap.appendChild(content);
            aboutContent.replaceChildren(wrap);
        } else {
            aboutContent.replaceChildren(content);
        }
    } else {
        let finalContent = content;
        if (isAboutSectionTitle(title)) {
            finalContent = `
                <div class="max-w-[68rem] mx-auto">
                    ${content}
                </div>
             `;
        }
        aboutContent.innerHTML = finalContent;
    }
    aboutOverlay.classList.remove('hidden');

    if (sectionKey !== null) {
        appState.activeSectionKey = normalizeSectionKey(sectionKey);
    }

    void aboutOverlay.offsetWidth;
    aboutOverlay.classList.remove('opacity-0');

    if (updateUrl && appState.activeSectionKey) {
        syncUrlState({
            section: appState.activeSectionKey,
            artwork: null,
            collection: appState.currentFilter === 'Home' ? null : appState.currentFilter,
        }, { replaceHistory });
    }
}

export function closeSectionModal({
    options = {},
    refs,
    appState,
    syncUrlState,
}) {
    const { updateUrl = true, replaceHistory = false } = options;
    const { aboutOverlay } = refs();

    const hadSection = Boolean(appState.activeSectionKey);
    appState.activeSectionKey = null;

    if (updateUrl && hadSection) {
        syncUrlState({ section: null }, { replaceHistory });
    }

    if (!aboutOverlay || aboutOverlay.classList.contains('hidden')) return;

    aboutOverlay.classList.add('opacity-0');
    setTimeout(() => {
        aboutOverlay.classList.add('hidden');
    }, 300);
}
