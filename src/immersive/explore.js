import overviewTexture from './overview.json' with {type:'json'};
import { thumbnailSource, browsingSource } from './model.js';
import { artworkButton, clamp, motionLoop, reducedMotion } from './motion.js';

import { buildExploreLayout, presentationSize } from './layout.js';
import { bindPinchZoom, zoomCamera } from './zoom.js';
import { isExploreWork } from './roster.js';
import { createPreviewQueue } from './media.js';
import { fieldLimits, containField, overviewCamera, settleFieldSquash, fieldPressure } from './field-physics.js';

export function createExplore({ container, works, onOpen, saved = {} }) {
    const viewport = document.createElement('div'); viewport.className = 'explore-viewport';
    viewport.tabIndex = 0; viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Explore artworks. Drag or scroll to pan. Arrow keys move the canvas; plus and minus zoom. Tab to select a work.');
    const world = document.createElement('div'); world.className = 'explore-world'; viewport.append(world);
    const camera = { x: 0, y: 0, zoom: 1, ...saved };
    let target = { ...camera }, vx = 0, vy = 0, drag = null, moved = false, alive = true, pinching=false;
    const buttons = new Map(), loaded=new Set(), sources=new Map(),workIndex=new Map(works.map(work=>[work.id,work]));
    const layout=buildExploreLayout(works), placements=layout.placements;
    const overview=new Image();overview.className='explore-overview';overview.alt='';overview.decoding='async';overview.hidden=true;overview.onload=()=>document.querySelector('#mobile-explore-preview')?.remove();
    const b=layout.bounds;overview.style.cssText=`position:absolute;left:${b.left}px;top:${b.top}px;width:${b.right-b.left}px;height:${b.bottom-b.top}px;pointer-events:none`;world.prepend(overview);
    let lastLoad={x:Infinity,y:Infinity,zoom:0}, squash=0,squashVelocity=0;
    const fieldIds=new Set(works.map(work=>work.id));
    const previews=createPreviewQueue();
    function add(work, index) {
        if (buttons.has(work.id)) return;
        workIndex.set(work.id,work);
        let p=placements.get(work.id);
        if(!p){p=[layout.bounds.right+220,0,...presentationSize(work)];placements.set(work.id,p);}
        const button = artworkButton(work, null, (w, el) => { if (!moved) onOpen(w, el.querySelector('img').naturalWidth?el:null); });
        sources.set(work.id,thumbnailSource(work));button.classList.add('art-pending');button.title=work.name;
        button.style.cssText = `left:${p[0]}px;top:${p[1]}px;width:${p[2]}px;height:${p[3]}px`;
        button.addEventListener('focus', () => {
            if (!button.matches(':focus-visible')) return;
            target.x = viewport.clientWidth / 2 - p[0] * target.zoom;
            target.y = viewport.clientHeight / 2 - p[1] * target.zoom;
            vx = vy = 0; loop.wake();
        });
        button.querySelector('img').loading='eager';
        world.append(button); buttons.set(work.id, button);
    }
    function bounds() {
        return layout.bounds;
    }
    function refreshImages(force=false) {
        if(!force && Math.hypot(camera.x-lastLoad.x,camera.y-lastLoad.y)<100 && Math.abs(camera.zoom-lastLoad.zoom)<Math.min(.025,lastLoad.zoom*.08))return;
        lastLoad={...camera};
        const distant=camera.zoom<.075;
        viewport.classList.toggle('is-overview',distant);overview.hidden=!distant;
        if(distant){
            if(!overview.hasAttribute('src'))overview.src='/previews/explore-overview.webp?v='+overviewTexture.version;
            previews.clear();
            for(const id of loaded){const img=buttons.get(id).querySelector('img');img.removeAttribute('src');delete img.dataset.quality;}
            loaded.clear();return;
        }
        document.querySelector('#mobile-explore-preview')?.remove();
        const width=viewport.clientWidth,height=viewport.clientHeight;
        const visible=[...placements].filter(([,p])=>{const x=camera.x+p[0]*camera.zoom,y=camera.y+p[1]*camera.zoom;return x+p[2]*camera.zoom/2>-250&&x-p[2]*camera.zoom/2<width+250&&y+p[3]*camera.zoom/2>-250&&y-p[3]*camera.zoom/2<height+250;})
            .sort(([,a],[,b])=>Math.hypot(camera.x+a[0]*camera.zoom-width/2,camera.y+a[1]*camera.zoom-height/2)-Math.hypot(camera.x+b[0]*camera.zoom-width/2,camera.y+b[1]*camera.zoom-height/2));
        const wanted=new Set(visible.map(([id])=>id));
        for(const id of loaded)if(!wanted.has(id)){const button=buttons.get(id);button.querySelector('img').removeAttribute('src');delete button.querySelector('img').dataset.quality;button.classList.add('art-pending');loaded.delete(id);}
        for(const id of wanted){
            const button=buttons.get(id),img=button.querySelector('img'),p=placements.get(id);
            const source=browsingSource(workIndex.get(id),camera.zoom,Math.max(p[2],p[3]));
            if(!loaded.has(id)||sources.get(id)!==source||(img.dataset.quality&&camera.zoom*Math.max(p[2],p[3])<=180)){
                delete img.dataset.quality;
                button.classList.remove('media-unavailable');img.onload=()=>button.classList.remove('art-pending','media-unavailable');
                img.src=source;sources.set(id,source);loaded.add(id);
            }
        }
        previews.update(visible.filter(([,p])=>camera.zoom*Math.max(p[2],p[3])>180).map(([id])=>({work:workIndex.get(id),img:buttons.get(id).querySelector('img')})));
    }
    function bound() {
        // Collide against stable walls. The animated outline must never feed
        // its changing bounds back into the next frame's velocity.
        const limits=fieldLimits(bounds(),viewport.clientWidth,viewport.clientHeight,target.zoom,drag?squash:0);
        if(drag){containField(target,{x:0,y:0},limits,false);return;}
        const velocity={x:vx,y:vy};
        const impact=containField(target,velocity,limits,!reducedMotion());
        vx=velocity.x;vy=velocity.y;
        if(!reducedMotion()&&impact){squash=clamp(squash+impact,-.3,.3);squashVelocity=0;}
    }
    const loop = motionLoop(dt => {
        const reduce = reducedMotion();
        if(reduce){vx=vy=0;squash=squashVelocity=0;}
        const restingLimits=fieldLimits(bounds(),viewport.clientWidth,viewport.clientHeight,target.zoom);
        const pressure=drag&&moved?fieldPressure(drag.desired,restingLimits):{squash:0,axis:null,side:0};
        if(drag){
            if(moved){target.x=drag.desired.x;target.y=drag.desired.y;}
            squash+=(pressure.squash-squash)*(1-Math.exp(-dt/45));squashVelocity=0;
            if(reduce)squash=0;
        }else{
            const spring=settleFieldSquash(squash,squashVelocity,dt/1000);squash=spring.value;squashVelocity=spring.velocity;
        }
        const damping=restingLimits.fits?.925:.88;
        if (!drag && !reduce) { target.x += vx * dt / 16.67; target.y += vy * dt / 16.67; vx *= Math.pow(damping, dt / 16.67); vy *= Math.pow(damping, dt / 16.67); }
        bound();
        if(drag&&pressure.axis){
            const contact=fieldLimits(bounds(),viewport.clientWidth,viewport.clientHeight,target.zoom,squash);
            target[pressure.axis]=contact[(pressure.side<0?'min':'max')+(pressure.axis==='x'?'X':'Y')];
        }
        const a = reduce ? 1 : 1 - Math.exp(-dt / (drag ? 32 : 72));
        for (const key of ['x', 'y', 'zoom']) camera[key] += (target[key] - camera[key]) * a;
        const limits=fieldLimits(bounds(),viewport.clientWidth,viewport.clientHeight,camera.zoom,squash);
        if(limits.fits){
            containField(camera,{x:0,y:0},limits,false);
        }
        world.style.transform = `translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.zoom*limits.sx},${camera.zoom*limits.sy})`;
        refreshImages();
        fit.setAttribute('aria-label',viewport.clientWidth<700&&target.zoom<.075?'Focus Impossible Folds 01':'Show all Explore works');
        const deformation=drag?Math.abs((reduce?0:pressure.squash)-squash)*100:Math.abs(vx)+Math.abs(vy)+Math.abs(squash)*100+Math.abs(squashVelocity)*10;
        return Math.abs(target.x-camera.x)+Math.abs(target.y-camera.y)+Math.abs(target.zoom-camera.zoom)*100+deformation > .08;
    });
    works.forEach(add); container.append(viewport);
    if (!Object.hasOwn(saved, 'zoom')) {
        const small = viewport.clientWidth < 700;
        const initial=small?overviewCamera(bounds(),viewport.clientWidth,viewport.clientHeight):{zoom:1,x:viewport.clientWidth/2,y:viewport.clientHeight/2};
        Object.assign(camera,initial);Object.assign(target,initial);
    }
    loop.wake();
    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('pointerdown', event => {
        if (pinching || event.button !== 0 || !event.isPrimary) { drag = null; return; }
        moved = false; vx = vy = 0;
        // Catch the visible field, not the destination of its previous throw.
        target={...camera};
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, at: performance.now(), sx: target.x, sy: target.y, desired:{x:target.x,y:target.y} };
    });
    viewport.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (!moved && Math.hypot(dx, dy) < 7) return;
        moved = true; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging');
        const now = performance.now(), dt = Math.max(8, now - drag.at);
        const blend=1-Math.exp(-dt/55);
        vx += (clamp((event.clientX-drag.lastX)/dt*16.67,-22,22)-vx)*blend;
        vy += (clamp((event.clientY-drag.lastY)/dt*16.67,-22,22)-vy)*blend;
        drag.lastX = event.clientX; drag.lastY = event.clientY; drag.at = now;
        drag.desired={x:drag.sx+dx,y:drag.sy+dy};target.x=drag.desired.x;target.y=drag.desired.y;loop.wake();
    });
    function end(event) {
        if (!drag || drag.id !== event.pointerId) return;
        const pressure=moved?fieldPressure(drag.desired,fieldLimits(bounds(),viewport.clientWidth,viewport.clientHeight,target.zoom)):null;
        if (event.type === 'pointercancel' || performance.now() - drag.at > 90) vx = vy = 0;
        if(event.type!=='pointercancel'&&!reducedMotion()&&pressure?.axis){
            // Release from the visible contact point, never from the overshot grab target.
            target.x=camera.x;target.y=camera.y;
            const rebound=-pressure.side*Math.max(3,Math.abs(squash)*45);
            if(pressure.axis==='x')vx=rebound;else vy=rebound;
        }
        drag = null; viewport.classList.remove('is-dragging'); loop.wake();
        // The synthetic click follows pointerup; retain the drag decision until then.
        setTimeout(() => { moved = false; }, 0);
    }
    viewport.addEventListener('pointerup', end); viewport.addEventListener('pointercancel', end);
    viewport.addEventListener('click', event => { if (moved) { event.preventDefault(); event.stopPropagation(); } }, true);
    viewport.addEventListener('wheel', event => {
        if (event.ctrlKey || event.metaKey) return; // Pinch is handled separately; Cmd zoom remains native.
        event.preventDefault(); vx = vy = 0;
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
        target.x -= event.deltaX * unit; target.y -= event.deltaY * unit; loop.wake();
    }, { passive: false });
    function zoom(factor,anchor={x:viewport.clientWidth/2,y:viewport.clientHeight/2}) {
        const minZoom=Math.min(.025,overviewCamera(bounds(),viewport.clientWidth,viewport.clientHeight).zoom*.65);
        Object.assign(target,zoomCamera(target,factor,anchor,minZoom));vx=vy=0;loop.wake();
    }
    const unbindPinch=bindPinchZoom(viewport,zoom,active=>{pinching=active;drag=null;moved=true;vx=vy=0;viewport.classList.remove('is-dragging');});
    viewport.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const move = { ArrowLeft:[110,0], ArrowRight:[-110,0], ArrowUp:[0,110], ArrowDown:[0,-110] }[event.key];
        if (move) { event.preventDefault(); target.x += move[0]; target.y += move[1]; vx = vy = 0; loop.wake(); }
        if (event.key === '+' || event.key === '=') zoom(1.2);
        if (event.key === '-') zoom(1/1.2);
    });
    const toolbar = document.createElement('div'); toolbar.className = 'explore-tools';
    toolbar.innerHTML = '<span>Drag to explore</span><button aria-label="Zoom out">−</button><button aria-label="Show all Explore works"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/></svg></button><button aria-label="Zoom in">+</button>';
    const [out, fit, into] = toolbar.querySelectorAll('button');
    out.onclick = () => zoom(1/1.2); into.onclick = () => zoom(1.2);
    function focusPlacement(work,immediate=false) {
        const p=placements.get(work.id);if(!p)return;
        const width=viewport.clientWidth,height=viewport.clientHeight,small=width<700;
        const top=small?136:90,bottom=height-(small?80:90);
        target.zoom=Math.min(small?.9:1,(width-(small?64:80))/p[2],(bottom-top)/p[3]);
        target.x=width/2-p[0]*target.zoom;
        target.y=(top+bottom)/2-p[1]*target.zoom;
        vx=vy=0;if(immediate)Object.assign(camera,target);loop.wake();
    }
    fit.onclick = () => {
        const hero=workIndex.get('shop-print6');
        if(viewport.clientWidth<700&&target.zoom<.075&&hero)focusPlacement(hero);
        else {Object.assign(target,overviewCamera(bounds(),viewport.clientWidth,viewport.clientHeight));vx=vy=0;loop.wake();}
    };
    container.append(toolbar);
    let oldWidth=viewport.clientWidth,oldHeight=viewport.clientHeight;
    const observer = new ResizeObserver(() => {
        if (!alive || !viewport.clientWidth) return;
        const width=viewport.clientWidth,height=viewport.clientHeight;
        if(width!==oldWidth||height!==oldHeight){
            const wasOverview=fieldLimits(bounds(),oldWidth,oldHeight,target.zoom).fits;
            const ratio=(width<700)===(oldWidth<700)?1:width<700?.66:1/.66;
            target.x=width/2+(target.x-oldWidth/2)*ratio;
            target.y=height/2+(target.y-oldHeight/2)*ratio;target.zoom*=ratio;
            if(wasOverview)Object.assign(target,overviewCamera(bounds(),width,height));
            Object.assign(camera,target);oldWidth=width;oldHeight=height;
        }
        bound();lastLoad.x=Infinity;loop.wake();
    }); observer.observe(viewport);
    return {
        element: viewport, tools: toolbar, buttons,
        ensureWork(work) {
            if(!isExploreWork(work))return;
            for(const [id,button] of buttons)if(!fieldIds.has(id)&&id!==work.id){button.remove();buttons.delete(id);placements.delete(id);loaded.delete(id);sources.delete(id);}
            if (!buttons.has(work.id)) { add(work, works.length); buttons.get(work.id).classList.add('context-art'); }
        },
        focusWork(work,immediate=false) {
            this.ensureWork(work);
            focusPlacement(work,immediate);
        },
        snapshot: () => ({ ...target }),
        restore(state) { Object.assign(target,state);Object.assign(camera,state);vx=vy=0;loop.wake(); },
        setDetailOpen(){},
        setActive(active) { viewport.hidden = toolbar.hidden = !active;lastLoad.x=Infinity; drag = null; vx=vy=0;if(!active)previews.clear();active ? loop.resume() : loop.pause(); },
        destroy() { alive = false;previews.clear(); loop.destroy(); unbindPinch();observer.disconnect(); viewport.remove(); toolbar.remove(); },
    };
}
