function isAboutSectionTitle(title) {
    return title === 'About' || title === 'About Lemonhaze';
}

function updateHeaderForSection({
    title,
    headerElement,
    currentViewTitle,
    currentViewMeta,
    refreshBtn,
}) {
    if (headerElement) {
        headerElement.classList.remove('md:hidden');
    }

    if (currentViewTitle) {
        currentViewTitle.textContent = title;
    }

    if (currentViewMeta) {
        currentViewMeta.textContent = '';
    }

    if (refreshBtn) {
        refreshBtn.classList.add('hidden');
    }

    document.title = `${title} | Lemonhaze`;
}

function appendSectionContent({ title, content, sectionBody }) {
    if (content instanceof Node) {
        if (isAboutSectionTitle(title)) {
            const wrap = document.createElement('div');
            wrap.className = 'max-w-2xl';
            wrap.appendChild(content);
            sectionBody.appendChild(wrap);
            return;
        }

        sectionBody.appendChild(content);
        return;
    }

    if (isAboutSectionTitle(title)) {
        sectionBody.innerHTML = `<div class="max-w-2xl">${content}</div>`;
        return;
    }

    sectionBody.innerHTML = content;
}

export function renderSectionView({
    title,
    content,
    headerElement,
    galleryGrid,
    contentArea,
    currentViewTitle,
    currentViewMeta,
    refreshBtn,
}) {
    if (!galleryGrid) return;

    updateHeaderForSection({
        title,
        headerElement,
        currentViewTitle,
        currentViewMeta,
        refreshBtn,
    });

    if (contentArea) {
        contentArea.style.overflowY = 'auto';
        contentArea.scrollTop = 0;
    }

    galleryGrid.innerHTML = '';
    galleryGrid.className = 'grid grid-cols-1 gap-6 mb-20';

    const sectionShell = document.createElement('section');
    sectionShell.className = 'w-full max-w-5xl border border-white/10 bg-[#0c0c0c] p-6 md:p-10 animate-fade-in';

    const sectionBody = document.createElement('div');
    sectionBody.className = 'text-sm md:text-base text-white/80 leading-relaxed space-y-4';
    appendSectionContent({ title, content, sectionBody });

    sectionShell.appendChild(sectionBody);
    galleryGrid.appendChild(sectionShell);
}
