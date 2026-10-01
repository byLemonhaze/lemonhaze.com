let notice;
let hideTimer;
let removeTimer;

export function showComingSoon() {
    clearTimeout(hideTimer);
    clearTimeout(removeTimer);
    if (!notice?.isConnected) {
        notice = document.createElement('div');
        notice.className = 'coming-soon-notice';
        notice.setAttribute('role', 'status');
        document.body.appendChild(notice);
    }
    notice.textContent = 'Coming soon';
    requestAnimationFrame(() => notice?.classList.add('is-visible'));
    hideTimer = setTimeout(() => {
        notice?.classList.remove('is-visible');
        removeTimer = setTimeout(() => { notice?.remove(); notice = null; }, 220);
    }, 1800);
}
