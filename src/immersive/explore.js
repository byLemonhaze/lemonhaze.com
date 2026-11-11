import { previewSource } from './model.js';
import { artworkButton, clamp, motionLoop, reducedMotion } from './motion.js';

// An authored field, not a grid. Coordinates are relative to its quiet centre.
const placements = [
    [-300,-80,390,510], [300,-380,290,420], [680,100,370,340],
    [200,190,360,360], [-740,210,370,300], [-170,650,280,380],
    [-650,-600,350,330], [650,700,280,380],
];
export function createExplore({ container, works, onOpen, saved = {} }) {
    const viewport = document.createElement('div'); viewport.className = 'explore-viewport';
    viewport.tabIndex = 0; viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Explore selected art. Drag or scroll to pan. Arrow keys move the canvas; plus and minus zoom. Tab to select a work.');
    const world = document.createElement('div'); world.className = 'explore-world'; viewport.append(world);
    const camera = { x: 0, y: 0, zoom: 1, ...saved };
    let target = { ...camera }, vx = 0, vy = 0, drag = null, moved = false, alive = true;
    const buttons = new Map();
    const featuredIds=new Set(works.map(work=>work.id));
    function add(work, index) {
        if (buttons.has(work.id)) return;
        const p = placements[index] || [1100, -500, 340, 440];
        const button = artworkButton(work, previewSource(work), (w, el) => { if (!moved) onOpen(w, el); });
        button.style.cssText = `left:${p[0]}px;top:${p[1]}px;width:${p[2]}px;height:${p[3]}px`;
        button.addEventListener('focus', () => {
            if (!button.matches(':focus-visible')) return;
            target.x = viewport.clientWidth / 2 - p[0] * target.zoom;
            target.y = viewport.clientHeight / 2 - p[1] * target.zoom;
            vx = vy = 0; loop.wake();
        });
        world.append(button); buttons.set(work.id, button);
    }
    function bound() {
        target.x = clamp(target.x, -1050 * target.zoom + viewport.clientWidth * .25, 1100 * target.zoom + viewport.clientWidth * .75);
        target.y = clamp(target.y, -1000 * target.zoom + viewport.clientHeight * .25, 850 * target.zoom + viewport.clientHeight * .75);
    }
    const loop = motionLoop(dt => {
        const reduce = reducedMotion();
        if(reduce)vx=vy=0;
        if (!drag && !reduce) { target.x += vx * dt / 16.67; target.y += vy * dt / 16.67; vx *= Math.pow(.88, dt / 16.67); vy *= Math.pow(.88, dt / 16.67); }
        bound();
        const a = reduce ? 1 : 1 - Math.exp(-dt / (drag ? 32 : 72));
        for (const key of ['x', 'y', 'zoom']) camera[key] += (target[key] - camera[key]) * a;
        world.style.transform = `translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.zoom})`;
        return Math.abs(target.x-camera.x)+Math.abs(target.y-camera.y)+Math.abs(target.zoom-camera.zoom)*100+Math.abs(vx)+Math.abs(vy) > .08;
    });
    works.forEach(add); container.append(viewport);
    if (!Object.hasOwn(saved, 'zoom')) {
        const small = viewport.clientWidth < 700;
        camera.zoom = target.zoom = small ? .66 : 1;
        camera.x = target.x = viewport.clientWidth / 2 + (small ? 190 : 0);
        camera.y = target.y = viewport.clientHeight / 2 - (small ? 80 : 0);
    }
    loop.wake();
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary) { drag = null; return; }
        moved = false; vx = vy = 0;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, at: performance.now(), sx: target.x, sy: target.y };
    });
    viewport.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (!moved && Math.hypot(dx, dy) < 7) return;
        moved = true; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging');
        const now = performance.now(), dt = Math.max(8, now - drag.at);
        vx = clamp((event.clientX - drag.lastX) / dt * 16.67, -25, 25);
        vy = clamp((event.clientY - drag.lastY) / dt * 16.67, -25, 25);
        drag.lastX = event.clientX; drag.lastY = event.clientY; drag.at = now;
        target.x = drag.sx + dx; target.y = drag.sy + dy; loop.wake();
    });
    function end(event) {
        if (!drag || drag.id !== event.pointerId) return;
        if (event.type === 'pointercancel' || performance.now() - drag.at > 90) vx = vy = 0;
        drag = null; viewport.classList.remove('is-dragging'); loop.wake();
        // The synthetic click follows pointerup; retain the drag decision until then.
        setTimeout(() => { moved = false; }, 0);
    }
    viewport.addEventListener('pointerup', end); viewport.addEventListener('pointercancel', end);
    viewport.addEventListener('click', event => { if (moved) { event.preventDefault(); event.stopPropagation(); } }, true);
    viewport.addEventListener('wheel', event => {
        if (event.ctrlKey || event.metaKey) return; // Keep browser zoom available.
        event.preventDefault(); vx = vy = 0;
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
        target.x -= event.deltaX * unit; target.y -= event.deltaY * unit; loop.wake();
    }, { passive: false });
    function zoom(factor) {
        const next = clamp(target.zoom * factor, .32, 1.7), cx = viewport.clientWidth / 2, cy = viewport.clientHeight / 2;
        target.x = cx - (cx - target.x) * next / target.zoom;
        target.y = cy - (cy - target.y) * next / target.zoom;
        target.zoom = next; vx = vy = 0; loop.wake();
    }
    viewport.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const move = { ArrowLeft:[110,0], ArrowRight:[-110,0], ArrowUp:[0,110], ArrowDown:[0,-110] }[event.key];
        if (move) { event.preventDefault(); target.x += move[0]; target.y += move[1]; vx = vy = 0; loop.wake(); }
        if (event.key === '+' || event.key === '=') zoom(1.2);
        if (event.key === '-') zoom(1/1.2);
    });
    const toolbar = document.createElement('div'); toolbar.className = 'explore-tools';
    toolbar.innerHTML = '<span>Drag to explore</span><button aria-label="Zoom out">−</button><button aria-label="Show all selected works">↗</button><button aria-label="Zoom in">+</button>';
    const [out, fit, into] = toolbar.querySelectorAll('button');
    out.onclick = () => zoom(1/1.2); into.onclick = () => zoom(1.2);
    fit.onclick = () => { target.zoom = Math.min((viewport.clientWidth-70)/1900,(viewport.clientHeight-150)/1800); target.x = viewport.clientWidth/2; target.y = viewport.clientHeight/2; vx=vy=0; loop.wake(); };
    container.append(toolbar);
    let oldWidth=viewport.clientWidth,oldHeight=viewport.clientHeight;
    const observer = new ResizeObserver(() => {
        if (!alive || !viewport.clientWidth) return;
        const width=viewport.clientWidth,height=viewport.clientHeight;
        if(width!==oldWidth||height!==oldHeight){
            const ratio=(width<700)===(oldWidth<700)?1:width<700?.66:1/.66;
            target.x=width/2+(target.x-oldWidth/2)*ratio;
            target.y=height/2+(target.y-oldHeight/2)*ratio;target.zoom*=ratio;
            Object.assign(camera,target);oldWidth=width;oldHeight=height;
        }
        bound();loop.wake();
    }); observer.observe(viewport);
    return {
        element: viewport, tools: toolbar, buttons,
        ensureWork(work) {
            for(const [id,button] of buttons)if(!featuredIds.has(id)&&id!==work.id){button.remove();buttons.delete(id);}
            if (!buttons.has(work.id)) { add(work, 8); buttons.get(work.id).classList.add('context-art'); }
        },
        snapshot: () => ({ ...target }),
        restore(state) { Object.assign(target,state);Object.assign(camera,state);vx=vy=0;loop.wake(); },
        setActive(active) { viewport.hidden = toolbar.hidden = !active; drag = null; vx=vy=0; active ? loop.resume() : loop.pause(); },
        destroy() { alive = false; loop.destroy(); observer.disconnect(); viewport.remove(); toolbar.remove(); },
    };
}
