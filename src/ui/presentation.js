import './presentation.css';

export function setupPresentation() {
    // Prerendered pages already contain these controls; replace them once to bind
    // current handlers without duplicating the footer during client startup.
    document.querySelectorAll('#sidebar .presentation-options, #sidebar .sidebar-socials').forEach(node => node.remove());
    const themes = ['paper', 'black'];
    let initial = 'paper';
    try { initial = localStorage.getItem('lh-presentation') || initial; } catch {}
    const requested = new URLSearchParams(location.search).get('theme');
    if (themes.includes(requested)) initial = requested;
    const setTheme = theme => {
        document.documentElement.dataset.presentation = themes.includes(theme) ? theme : 'paper';
        try { localStorage.setItem('lh-presentation', document.documentElement.dataset.presentation); } catch {}
        document.querySelectorAll('[data-presentation-choice]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.presentationChoice === document.documentElement.dataset.presentation));
        });
    };
    setTheme(initial);
    const controls = document.createElement('div');
    controls.className = 'presentation-options';
    controls.setAttribute('aria-label', 'Page background');
    controls.innerHTML = themes.map(theme => `<button type="button" data-presentation-choice="${theme}" aria-pressed="false">${({paper:'Off-white',black:'Black'})[theme]}</button>`).join('');
    controls.addEventListener('click', event => { const button = event.target.closest('[data-presentation-choice]'); if (button) { setTheme(button.dataset.presentationChoice); const url = new URL(location.href); if (url.searchParams.has('theme')) { url.searchParams.set('theme', button.dataset.presentationChoice); history.replaceState(history.state, '', url); } } });
    document.querySelector('#sidebar > div:last-child')?.prepend(controls);
    const socials = document.createElement('div'); socials.className = 'sidebar-socials';
    socials.innerHTML = '<a href="https://x.com/Ordinals10K" target="_blank" rel="noopener noreferrer">X ↗</a><a href="https://discord.com/invite/4A8jaMqdxs" target="_blank" rel="noopener noreferrer">Discord ↗</a>';
    document.querySelector('#sidebar > div:last-child')?.prepend(socials);
    setTheme(initial);
}
