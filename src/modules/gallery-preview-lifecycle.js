const ONCHAIN_PREVIEW_SELECTOR = 'iframe[data-onchain-preview-src]';

export function pauseGalleryOnchainPreviews(root) {
    if (!root?.querySelectorAll) return 0;

    let pausedCount = 0;
    for (const frame of root.querySelectorAll(ONCHAIN_PREVIEW_SELECTOR)) {
        if (frame.dataset.previewPaused === 'true') continue;

        const activeSrc = frame.getAttribute('src');
        const resumeSrc = activeSrc && activeSrc !== 'about:blank'
            ? activeSrc
            : frame.dataset.onchainPreviewSrc;
        if (!resumeSrc) continue;

        frame.dataset.onchainPreviewSrc = resumeSrc;
        frame.dataset.previewPaused = 'true';
        frame.setAttribute('src', 'about:blank');
        pausedCount += 1;
    }

    return pausedCount;
}

export function resumeGalleryOnchainPreviews(root) {
    if (!root?.querySelectorAll) return 0;

    let resumedCount = 0;
    for (const frame of root.querySelectorAll(ONCHAIN_PREVIEW_SELECTOR)) {
        if (frame.dataset.previewPaused !== 'true') continue;

        const resumeSrc = frame.dataset.onchainPreviewSrc;
        delete frame.dataset.previewPaused;
        if (!resumeSrc) continue;

        frame.setAttribute('src', resumeSrc);
        resumedCount += 1;
    }

    return resumedCount;
}
