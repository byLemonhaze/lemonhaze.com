import './presentation.css';

export function setupPresentation() {
    // Prerendered pages already contain these controls; replace them once to bind
    // current handlers without duplicating the footer during client startup.
    document.querySelectorAll('#sidebar .sidebar-utilities, #sidebar .presentation-options, #sidebar .sidebar-socials').forEach(node => node.remove());
    const themes = ['paper', 'black'];
    let initial = 'paper';
    try { initial = localStorage.getItem('lh-presentation') || initial; } catch {}
    const requested = new URLSearchParams(location.search).get('theme');
    if (themes.includes(requested)) initial = requested;
    document.querySelector('#appearance-toggle')?.remove();
    const appearance=document.createElement('button');appearance.id='appearance-toggle';appearance.type='button';
    document.body.append(appearance);
    const setTheme = theme => {
        document.documentElement.dataset.presentation = themes.includes(theme) ? theme : 'paper';
        try { localStorage.setItem('lh-presentation', document.documentElement.dataset.presentation); } catch {}
        const dark=document.documentElement.dataset.presentation==='black';
        appearance.setAttribute('aria-label',dark?'Switch to day mode':'Switch to night mode');
        appearance.setAttribute('aria-pressed',String(dark));
        appearance.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${dark?'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>':'<path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/>'}</svg><span>${dark?'Day':'Night'}</span>`;
        appearance.title=dark?'Switch to day mode':'Switch to night mode';
        document.querySelectorAll('[data-presentation-choice]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.presentationChoice === document.documentElement.dataset.presentation));
        });
    };
    appearance.onclick=()=>{
        const next=document.documentElement.dataset.presentation==='black'?'paper':'black';setTheme(next);
        const url=new URL(location.href);if(url.searchParams.has('theme')){url.searchParams.set('theme',next);history.replaceState(history.state,'',url);}
    };
    setTheme(initial);
    const utilities = document.createElement('div');
    utilities.className = 'sidebar-utilities';
    const socials = document.createElement('div'); socials.className = 'sidebar-socials';
    socials.innerHTML = '<a href="https://x.com/Ordinals10K" target="_blank" rel="noopener noreferrer">X</a><a href="https://discord.com/invite/4A8jaMqdxs" target="_blank" rel="noopener noreferrer">Discord</a>';
    utilities.append(socials);
    document.querySelector('#sidebar > div:last-child')?.prepend(utilities);
    setTheme(initial);
}
