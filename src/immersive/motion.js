import {pixelDimensions} from '../data/pixel-art.js';
import {isStaticOnlyMedia} from '../data/static-only-media.js';
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduced';
export const ease = 'cubic-bezier(.22,1,.36,1)';

// Request frames only while input, inertia, or settling needs them.
export function motionLoop(step) {
    let frame = 0, previous = 0, active = true;
    function tick(time) {
        frame = 0;
        const dt = Math.min(32, previous ? time - previous : 16.67); previous = time;
        if (active && !document.hidden && step(dt)) wake();
        else previous = 0;
    }
    function wake() { if (active && !document.hidden && !frame) frame = requestAnimationFrame(tick); }
    return { wake, pause() { active = false; cancelAnimationFrame(frame); frame = 0; previous = 0; },
        resume() { active = true; wake(); }, destroy() { this.pause(); } };
}
export function artworkButton(work, imageSource, onOpen) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'experience-art'; button.dataset.work = work.id;button.classList.toggle('pixel-art',Boolean(pixelDimensions(work)));
    button.setAttribute('aria-label', `Open ${work.name}`);
    const img = new Image(); img.alt = work.name; img.draggable = false; img.decoding = 'async';
    if(imageSource)img.src = imageSource; button.append(img);
    img.addEventListener('load',()=>{button.classList.remove('media-unavailable','art-pending');button.style.setProperty('--image-ratio',img.naturalWidth/img.naturalHeight);});
    img.onerror = () => {
        const fallback=!isStaticOnlyMedia(work)&&/^[a-f0-9]{64}i\d+$/.test(work.id)?`https://render.ord.net/v9/snapshots/${work.id}/512.webp`:null;
        if(fallback&&img.getAttribute('src')!==fallback){img.src=fallback;return;}
        button.classList.add('media-unavailable');button.classList.remove('art-pending');button.dataset.fallback=work.name;
    };
    button.addEventListener('click', () => onOpen(work, button));
    return button;
}
