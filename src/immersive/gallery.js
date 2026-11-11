import { previewSource, workYear } from './model.js';
import { artworkButton, clamp, motionLoop, reducedMotion } from './motion.js';

export function createGallery({ container, works, onOpen, onCurrent, saved = {} }) {
    const items = [...works], buttons = new Map();
    const viewport = document.createElement('div'); viewport.className = 'room-viewport';
    viewport.tabIndex = 0; viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Gallery. Scroll, drag, or use left and right arrow keys to move through the exhibition.');
    viewport.innerHTML = `<div class="room-perspective"><div class="room-camera">
        <div class="room-back-wall"></div><div class="room-floor"></div><div class="room-ceiling"></div>
        <div class="room-end-wall"></div><div class="room-reveal"></div><div class="room-light"></div>
        <div class="room-works"></div></div></div><div class="room-grain"></div>`;
    const camera = viewport.querySelector('.room-camera'), world = viewport.querySelector('.room-works');
    let position = saved.position || 0, target = position, current = -1, drag = null, moved = false, settle = 0;
    const footer = document.createElement('div'); footer.className = 'room-footer';
    footer.innerHTML = '<div class="room-caption"><button class="room-title"></button><p></p></div><div class="room-navigation"><button aria-label="Previous artwork">←</button><span></span><button aria-label="Next artwork">→</button></div>';
    const title = footer.querySelector('.room-title'), meta = footer.querySelector('p'), counter = footer.querySelector('span');
    const controls = footer.querySelectorAll('.room-navigation button');
    function updateCurrent(index) {
        if (current === index) return;
        current = index; const work = items[index];
        title.textContent = work.name; meta.textContent = `${work.collection} · ${workYear(work)}`;
        counter.textContent = `${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
        onCurrent(work);
    }
    function add(work, index) {
        const button = artworkButton(work, previewSource(work), (w, el) => {
            if (moved) return;
            if (Math.abs(position - index) > .2) move(index); else onOpen(w, el);
        });
        button.classList.add('room-art'); button.querySelector('img').loading = index < 2 ? 'eager' : 'lazy';
        const mount = document.createElement('div'); mount.className = 'room-mount'; mount.append(button);
        const shadow = document.createElement('div'); shadow.className = 'room-art-shadow'; mount.append(shadow);
        world.append(mount); buttons.set(work.id, button);
        button.addEventListener('focus', () => { if (button.matches(':focus-visible')) move(index); });
    }
    items.forEach(add); container.append(viewport, footer);
    const loop = motionLoop(dt => {
        const previous = position;
        position += (target - position) * (reducedMotion() ? 1 : 1 - Math.exp(-dt / (drag ? 48 : 115)));
        const speed = reducedMotion() ? 0 : (position - previous) / dt * 16.67;
        const compact = viewport.clientWidth < 700, step = compact ? 430 : Math.min(1000, viewport.clientWidth * .7);
        camera.style.transform = `translate3d(${-position*step}px,${Math.abs(speed)*-8}px,${Math.min(75,Math.abs(speed)*200)}px) rotateY(${clamp(speed*9,-2,2)}deg)`;
        for (const [index, work] of items.entries()) {
            const button = buttons.get(work.id), mount = button.parentElement, distance = index - position;
            const depth = -Math.min(330,Math.abs(distance)*180);
            mount.style.transform = `translate3d(${index*step}px,0,${depth}px) rotateY(${clamp(-distance*16,-32,32)}deg)`;
            mount.style.visibility = Math.abs(distance) > 2.4 ? 'hidden' : 'visible';
            button.tabIndex = Math.abs(distance) < .5 ? 0 : -1;
            button.style.setProperty('--art-bend', `${clamp(speed*5,-1.5,1.5)}deg`);
        }
        updateCurrent(clamp(Math.round(position),0,items.length-1));
        return Math.abs(target-position) > .0005;
    });
    function move(index) { target = clamp(index, 0, items.length-1); loop.wake(); }
    controls[0].onclick = () => move(Math.round(target)-1); controls[1].onclick = () => move(Math.round(target)+1);
    title.onclick = () => onOpen(items[current], buttons.get(items[current].id));
    viewport.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(Math.round(target)+(event.key === 'ArrowRight'?1:-1)); }
        if (event.key === 'Home') move(0); if (event.key === 'End') move(items.length-1);
    });
    viewport.addEventListener('wheel', event => {
        if (event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        const delta = Math.abs(event.deltaX)>Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
        move(target + clamp(delta * unit / 700,-.55,.55));
        clearTimeout(settle); settle = setTimeout(() => move(Math.round(target)), 130);
    }, { passive:false });
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary) { drag = null; return; }
        clearTimeout(settle); moved = false;
        drag = { id:event.pointerId, x:event.clientX, y:event.clientY, start:target, dx:0, dy:0 };
    });
    viewport.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        drag.dx = event.clientX-drag.x; drag.dy = event.clientY-drag.y;
        if (Math.hypot(drag.dx,drag.dy)<7 && !moved) return;
        moved = true; viewport.setPointerCapture(event.pointerId);
        // Vertical swipes and horizontal drags both follow the exhibition.
        const delta = Math.abs(drag.dx)>Math.abs(drag.dy) ? drag.dx : drag.dy;
        move(drag.start-delta/(viewport.clientWidth<700?310:700));
    });
    function end(event) {
        if (!drag || drag.id !== event.pointerId) return;
        const delta = Math.abs(drag.dx)>Math.abs(drag.dy)?drag.dx:drag.dy;
        move(event.type === 'pointercancel' ? Math.round(drag.start) : Math.abs(delta)>55 && Math.abs(target-drag.start)<.5 ? Math.round(drag.start)+(delta<0?1:-1) : Math.round(target));
        drag = null; setTimeout(() => { moved=false; },0);
    }
    viewport.addEventListener('pointerup',end); viewport.addEventListener('pointercancel',end);
    viewport.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopPropagation();}},true);
    const observer = new ResizeObserver(()=>loop.wake()); observer.observe(viewport); loop.wake();
    return {
        element:viewport, tools:footer, buttons,
        ensureWork(work,immediate=false) {
            let index=items.findIndex(w=>w.id===work.id);
            if(items.length>works.length && items.at(-1).id!==work.id){
                const previous=items.pop();buttons.get(previous.id)?.parentElement.remove();buttons.delete(previous.id);current=-1;
            }
            if(index<0){index=items.length;items.push(work);add(work,index);current=-1;}
            if(immediate)position=index;move(index);
        },
        snapshot:()=>({position:target}),
        restore(state){position=target=clamp(state.position||0,0,items.length-1);current=-1;loop.wake();},
        setActive(active){viewport.hidden=footer.hidden=!active;clearTimeout(settle);drag=null;active?loop.resume():loop.pause();},
        destroy(){loop.destroy();clearTimeout(settle);observer.disconnect();viewport.remove();footer.remove();},
    };
}
