import { browsingSource, workYear } from './model.js';
import { artworkButton, clamp, motionLoop, reducedMotion } from './motion.js';
import { createCollectionPicker, collectionEntry } from './collections.js';
import { settleGallery, galleryIndex, nearestGallerySlot, galleryNeighbors, releaseGallery } from './gallery-motion.js';
import { createPreviewQueue } from './media.js';

export function createGallery({ container, works, onOpen, onCurrent, collections, onCollectionChange, saved = {} }) {
    let collection=collections?.has(saved.collection)?saved.collection:'Selected works';
    let pool=collections?.get(collection)||works,items=[...pool];
    const buttons = new Map(),positions={...saved.positions},rendered=new Set();
    const previews=createPreviewQueue();
    let velocity=0,wheeling=false,wheelAxis=null,wheelProgress=0,wheelOrigin=0;
    const viewport = document.createElement('div'); viewport.className = 'room-viewport';
    viewport.tabIndex = 0; viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Gallery. Scroll, drag, or use left and right arrow keys to move through the exhibition.');
    viewport.innerHTML = `<div class="room-perspective"><div class="room-environment">
        <div class="room-back-wall"></div><div class="room-floor"></div><div class="room-ceiling"></div>
        </div><div class="room-camera">
        <div class="room-works"></div></div></div><div class="room-grain"></div>`;
    const camera = viewport.querySelector('.room-camera'), world = viewport.querySelector('.room-works');
    let position = saved.positions?.[collection] ?? (saved.collection===collection?saved.position:undefined) ?? collectionEntry(collection,items), target = position, current = -1, drag = null, moved = false, settle = 0;
    const footer = document.createElement('div'); footer.className = 'room-footer';
    footer.innerHTML = '<div class="room-caption"><button class="room-title"></button><p></p></div><div class="room-navigation"><button aria-label="Previous artwork"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h15"/></svg></button><span></span><button aria-label="Next artwork"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 5 7 7-7 7M19 12H4"/></svg></button></div>';
    const title = footer.querySelector('.room-title'), meta = footer.querySelector('p'), counter = footer.querySelector('.room-navigation span');
    const picker=createCollectionPicker(collections||new Map([['Selected works',works]]),collection,onCollectionChange);
    footer.querySelector('.room-caption').prepend(picker.element);
    const controls = footer.querySelectorAll('.room-navigation button');
    function updateCurrent(index) {
        if (current === index) return;
        current = index; const work = items[index];
        title.textContent = work.name; meta.textContent = `${work.collection} · ${workYear(work)}`;
        counter.textContent = `${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
        for(const control of controls)control.disabled=items.length<2;
        onCurrent(work);
    }
    function add(work, index) {
        const button = artworkButton(work, null, (w, el) => {
            if (moved) return;
            const slot=nearestGallerySlot(index,position,items.length);
            if (Math.abs(position - slot) > .2) navigate(slot); else onOpen(w, el);
        });
        button.classList.add('room-art'); button.querySelector('img').loading = 'eager';
        const mount = document.createElement('div'); mount.className = 'room-mount';mount.hidden=true; mount.append(button);
        const shadow = document.createElement('div'); shadow.className = 'room-art-shadow'; mount.append(shadow);
        world.append(mount); buttons.set(work.id, button);
        button.addEventListener('focus', () => { if (button.matches(':focus-visible')) move(nearestGallerySlot(index,position,items.length)); });
    }
    items.forEach(add); container.append(viewport, footer);
    const loop = motionLoop(dt => {
        if(reducedMotion()||drag){position=target;velocity=0;}
        else {const next=settleGallery(position,velocity,target,dt/1000,18);position=next.position;velocity=next.velocity;}
        if(Math.abs(target-position)<.0003&&Math.abs(velocity)<.005){position=target;velocity=0;}
        const compact = viewport.clientWidth < 700, step = compact ? 430 : Math.min(1000, viewport.clientWidth * .7);
        // The room stays still while the artworks follow the drag and settle.
        camera.style.transform = `translate3d(${-position*step}px,0,0)`;
        const nearby=galleryNeighbors(position,items.length);
        for(const index of rendered)if(!nearby.has(index)){
            const button=buttons.get(items[index]?.id);if(button){button.parentElement.hidden=true;button.querySelector('img').removeAttribute('src');delete button.querySelector('img').dataset.quality;button.tabIndex=-1;}
        }
        rendered.clear();
        for (const [index,slot] of nearby) {
            const work=items[index];rendered.add(index);
            const button = buttons.get(work.id), mount = button.parentElement, distance = slot - position;
            mount.hidden=false;const img=button.querySelector('img');if(!img.hasAttribute('src'))img.src=browsingSource(work);
            const depth = -Math.min(330,Math.abs(distance)*180);
            mount.style.transform = `translate3d(${slot*step}px,0,${depth}px) rotateY(${clamp(-distance*16,-32,32)}deg)`;
            mount.style.visibility = Math.abs(distance) > 2.4 ? 'hidden' : 'visible';
            button.tabIndex = Math.abs(distance) < .5 ? 0 : -1;

        }
        updateCurrent(galleryIndex(Math.round(position),items.length));
        previews.update([...nearby].sort((a,b)=>Math.abs(a[1]-position)-Math.abs(b[1]-position)).map(([index])=>({work:items[index],img:buttons.get(items[index].id).querySelector('img')})));
        return Math.abs(target-position) > .0001 || Math.abs(velocity)>.001;
    });
    function move(index) { target = items.length>1?index:0; loop.wake(); }
    function navigate(index){clearTimeout(settle);wheeling=false;wheelAxis=null;move(index);}
    controls[0].onclick = () => navigate(Math.round(target)-1); controls[1].onclick = () => navigate(Math.round(target)+1);
    title.onclick = () => onOpen(items[current], buttons.get(items[current].id));
    const keydown=event => {
        if(viewport.hidden||viewport.inert||picker.isOpen()||event.target.closest('input,textarea,select,[contenteditable=true]'))return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigate(Math.round(target)+(event.key === 'ArrowRight'?1:-1)); }
        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault(); clearTimeout(settle);
            velocity=0;position = event.key === 'Home' ? 0 : items.length-1;
            move(position);
        }
    };
    document.addEventListener('keydown',keydown);
    const wheel=event=>{
        if(event.ctrlKey||event.metaKey||event.target.closest('.collection-menu'))return;
        event.preventDefault();
        if(!wheeling){wheelAxis=Math.abs(event.deltaX)>Math.abs(event.deltaY)?'x':'y';wheelProgress=0;wheelOrigin=Math.round(target);}
        wheeling=true;
        const unit=event.deltaMode===1?16:event.deltaMode===2?viewport.clientHeight:1;
        const delta=clamp((wheelAxis==='x'?event.deltaX:event.deltaY)*unit,-240,240);
        wheelProgress+=delta;
        move(target+delta/Math.max(360,Math.min(850,viewport.clientWidth*.6)));
        clearTimeout(settle);settle=setTimeout(()=>{
            const snapped=Math.round(target);
            move(snapped===wheelOrigin&&Math.abs(wheelProgress)>55?snapped+Math.sign(wheelProgress):snapped);
            wheeling=false;wheelAxis=null;wheelProgress=0;
        },150);
    };
    viewport.addEventListener('wheel',wheel,{passive:false});footer.addEventListener('wheel',wheel,{passive:false});
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !event.isPrimary) { drag = null; return; }
        clearTimeout(settle);wheeling=false;wheelAxis=null;target=position;velocity=0; moved = false;
        drag = { id:event.pointerId, x:event.clientX, y:event.clientY, start:target, dx:0, dy:0, axis:null, last:0, time:event.timeStamp, velocity:0 };
        viewport.classList.add('is-grabbing');
    });
    viewport.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        drag.dx = event.clientX-drag.x; drag.dy = event.clientY-drag.y;
        if (Math.hypot(drag.dx,drag.dy)<7 && !moved) return;
        moved = true; viewport.setPointerCapture(event.pointerId);
        drag.axis ||= Math.abs(drag.dx)>Math.abs(drag.dy)?'x':'y';
        const delta=drag.axis==='x'?drag.dx:drag.dy;
        const step=viewport.clientWidth<700?430:Math.min(1000,viewport.clientWidth*.7);
        const elapsed=Math.max(8,event.timeStamp-drag.time);
        const speed=-(delta-drag.last)/step/(elapsed/1000);
        drag.velocity=elapsed>100?speed:drag.velocity*.35+speed*.65;
        drag.last=delta;drag.time=event.timeStamp;
        move(drag.start-delta/step);
    });
    function end(event) {
        if (!drag || drag.id !== event.pointerId) return;
        const delta=drag.axis==='x'?drag.dx:drag.dy;
        const speed=event.timeStamp-drag.time>100?0:clamp(drag.velocity,-5,5);
        const destination=releaseGallery(target,drag.start,speed,delta,event.type==='pointercancel');
        velocity=reducedMotion()?0:Math.sign(destination-position)*Math.min(Math.abs(speed),Math.abs(destination-position)*18);
        drag=null;viewport.classList.remove('is-grabbing');move(destination);
        if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
        setTimeout(()=>{moved=false;},0);
    }
    viewport.addEventListener('pointerup',end); viewport.addEventListener('pointercancel',end);
    viewport.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopPropagation();}},true);
    const observer = new ResizeObserver(()=>loop.wake()); observer.observe(viewport); loop.wake();
    return {
        element:viewport, tools:footer, buttons,
        ensureWork(work,immediate=false) {
            let index=items.findIndex(w=>w.id===work.id);
            if(items.length>pool.length && items.at(-1).id!==work.id){
                const previous=items.pop();buttons.get(previous.id)?.parentElement.remove();buttons.delete(previous.id);current=-1;
            }
            if(index<0){index=items.length;items.push(work);add(work,index);current=-1;}
            if(immediate){position=index;velocity=0;updateCurrent(galleryIndex(index,items.length));}move(index);
        },
        snapshot:()=>({collection,position:galleryIndex(target,items.length),positions:{...positions,[collection]:galleryIndex(target,items.length)}}),
        restore(state){
            Object.assign(positions,state.positions);
            const next=collections?.has(state.collection)?state.collection:'Selected works';
            if(next!==collection){
                positions[collection]=galleryIndex(target,items.length);collection=next;pool=collections.get(collection);items=[...pool];
                previews.clear();world.replaceChildren();buttons.clear();rendered.clear();items.forEach(add);picker.set(collection);
                position=target=galleryIndex(positions[collection]??collectionEntry(collection,items),items.length);
            }else position=target=galleryIndex(state.position??positions[collection]??collectionEntry(collection,items),items.length);
            velocity=0;current=-1;updateCurrent(galleryIndex(Math.round(position),items.length));loop.wake();
        },
        setDetailOpen(open){if(!open)loop.wake();},
        setActive(active){viewport.hidden=footer.hidden=!active;clearTimeout(settle);wheeling=false;wheelAxis=null;drag=null;viewport.classList.remove('is-grabbing');velocity=0;target=Math.round(target);if(!active){picker.close();previews.clear();}active?loop.resume():loop.pause();},
        destroy(){document.removeEventListener('keydown',keydown);previews.clear();picker.destroy();loop.destroy();clearTimeout(settle);observer.disconnect();viewport.remove();footer.remove();},
    };
}
