import { PAINT_ENGINE_DESCRIPTION, PAINT_ENGINE_VERSIONS } from '../data/paint-engines.js';

export function initializeEnginePicker(article) {
    article.querySelector('[data-engine-description]').textContent = PAINT_ENGINE_DESCRIPTION;
    const root = article.querySelector('[data-engine-picker]');
    root.className = 'engine-picker';
    root.innerHTML = `<div class="engine-controls"><label for="paint-engine-version">Version<span class="engine-select-wrap"><select id="paint-engine-version"></select><svg class="engine-select-arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></span></label><button type="button" aria-controls="paint-engine-viewer">Open selected engine</button></div><p class="engine-links"><a data-engine-fullscreen target="_blank" rel="noopener">Open full screen ↗︎</a><a data-engine-artwork>View artwork and details →</a></p><p class="engine-status" role="status" aria-live="polite">Choose an engine, then open it to begin.</p><div id="paint-engine-viewer"></div>`;
    const select = root.querySelector('select');
    const launch = root.querySelector('button');
    const viewer = root.querySelector('#paint-engine-viewer');
    const status = root.querySelector('.engine-status');
    for (const version of PAINT_ENGINE_VERSIONS) {
        const option = document.createElement('option');
        option.value = version.id;
        option.textContent = version.label;
        option.selected = version.label.includes('Passe-Partout');
        select.appendChild(option);
    }
    const selectedVersion = () => PAINT_ENGINE_VERSIONS.find(version => version.id === select.value);
    function updateLinks() {
        const version = selectedVersion();
        root.querySelector('[data-engine-fullscreen]').href = `https://ordinals.com/content/${version.id}`;
        root.querySelector('[data-engine-artwork]').href = `/${version.id}`;
    }
    function loadEngine() {
        const version = selectedVersion();
        const frame = document.createElement('iframe');
        frame.className = 'engine-frame';
        frame.title = `Paint Engine ${version.label}`;
        frame.src = `https://ordinals.com/content/${version.id}`;
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
        status.textContent = `Opening ${version.label}…`;
        frame.addEventListener('load', () => {
            if (viewer.firstElementChild === frame) status.textContent = `${version.label} · Use the engine below, or open it full screen for more room.`;
        });
        viewer.replaceChildren(frame);
        launch.textContent = 'Restart selected engine';
    }
    select.addEventListener('change', () => {
        updateLinks();
        if (viewer.firstElementChild) loadEngine();
    });
    launch.addEventListener('click', loadEngine);
    updateLinks();
}
