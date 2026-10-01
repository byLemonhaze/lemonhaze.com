let notice;
let hideTimer;
let removeTimer;

export function showComingSoon(artwork) {
    clearTimeout(hideTimer);
    clearTimeout(removeTimer);
    if (!notice?.isConnected) {
        notice = document.createElement('div');
        notice.className = 'coming-soon-notice';
        notice.setAttribute('role', 'status');
        document.body.appendChild(notice);
    }
    const bounds = artwork.getBoundingClientRect();
    notice.style.left = `${bounds.left + bounds.width / 2}px`;
    notice.style.top = `${bounds.top + bounds.height / 2}px`;
    notice.textContent = 'Coming soon';
    requestAnimationFrame(() => notice?.classList.add('is-visible'));
    hideTimer = setTimeout(() => {
        notice?.classList.remove('is-visible');
        removeTimer = setTimeout(() => { notice?.remove(); notice = null; }, 220);
    }, 1800);
}
