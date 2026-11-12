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
        appearance.innerHTML=dark?'<span aria-hidden="true">☀</span> Day':'<span aria-hidden="true">☾</span> Night';
        document.querySelectorAll('[data-presentation-choice]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.presentationChoice === document.documentElement.dataset.presentation));
        });
    };
    appearance.onclick=()=>{
        const next=document.documentElement.dataset.presentation==='black'?'paper':'black';setTheme(next);
        const url=new URL(location.href);if(url.searchParams.has('theme')){url.searchParams.set('theme',next);history.replaceState(history.state,'',url);}
    };
    setTheme(initial);
    const controls = document.createElement('div');
    controls.className = 'presentation-options';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Page background');
    controls.innerHTML = themes.map(theme => `<button type="button" data-presentation-choice="${theme}" aria-pressed="false" aria-label="${theme === 'paper' ? 'Light' : 'Dark'} appearance" title="${theme === 'paper' ? 'Light' : 'Dark'} appearance"><span aria-hidden="true" class="theme-swatch theme-swatch-${theme}"></span></button>`).join('');
    controls.addEventListener('click', event => { const button = event.target.closest('[data-presentation-choice]'); if (button) { setTheme(button.dataset.presentationChoice); const url = new URL(location.href); if (url.searchParams.has('theme')) { url.searchParams.set('theme', button.dataset.presentationChoice); history.replaceState(history.state, '', url); } } });
    const utilities = document.createElement('div');
    utilities.className = 'sidebar-utilities';
    const socials = document.createElement('div'); socials.className = 'sidebar-socials';
    socials.innerHTML = '<a href="https://x.com/Ordinals10K" target="_blank" rel="noopener noreferrer">X</a><a href="https://discord.com/invite/4A8jaMqdxs" target="_blank" rel="noopener noreferrer">Discord</a>';
    utilities.append(socials, controls);
    document.querySelector('#sidebar > div:last-child')?.prepend(utilities);
    setTheme(initial);
}
