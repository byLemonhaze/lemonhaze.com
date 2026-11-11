import { previewSource, workYear } from './model.js';
import { isHtmlArtwork, isVideoArtwork, shouldUseDirectOnchainMedia, getCdnMediaSrc } from '../modules/artwork-media.js';
import { ease, reducedMotion } from './motion.js';

export function createDetail({ root, catalog, onSelect, onClose, onWebsite }) {
    const panel = document.createElement('section'); panel.className = 'experience-detail'; panel.hidden = true;
    panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Artwork and collection');
    panel.innerHTML = `<div class="detail-rail" role="group" aria-label="Collection artworks"></div>
        <div class="detail-stage"><div class="detail-media"></div></div>
        <div class="detail-caption"><div><h1></h1><p></p></div><a class="detail-more" href="/?view=website">Full artwork details <span aria-hidden="true">↗</span></a></div>
        <button class="detail-close" aria-label="Close artwork"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
        <div class="detail-live-controls"></div>`;
    root.append(panel);
    const rail = panel.querySelector('.detail-rail'), media = panel.querySelector('.detail-media');
    const title = panel.querySelector('h1'), meta = panel.querySelector('p'), more = panel.querySelector('.detail-more');
    const close = panel.querySelector('.detail-close'), liveControls = panel.querySelector('.detail-live-controls');
    let selected = null, currentCollection = null, opener = null, animation = null, ghost = null, version = 0, live = null, hidden = false;
    const thumbs = new Map();
    close.onclick = onClose;
    more.onclick = event => { if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onWebsite(selected); };
    function stopAnimation() { animation?.cancel(); animation=null; ghost?.remove(); ghost=null; }
    function stopLive() { if(live){ if(live.tagName==='VIDEO')live.pause();live.remove();live=null; } }
    function buildRail(work) {
        if(currentCollection===work.collection) return;
        currentCollection=work.collection;rail.replaceChildren();thumbs.clear();
        for(const item of catalog.collection(work)) {
            const button=document.createElement('button');button.type='button';button.className='detail-thumbnail';
            button.setAttribute('aria-label',item.name);button.title=item.name;
            const image=new Image();image.src=previewSource(item);image.alt='';image.loading='lazy';image.decoding='async';
            image.onerror=()=>{image.hidden=true;button.textContent=item.name;button.classList.add('thumbnail-unavailable');};
            button.append(image);button.onclick=()=>onSelect(item);rail.append(button);thumbs.set(item.id,button);
        }
        rail.hidden=thumbs.size<2;
    }
    function startLive(work, token) {
        if(hidden||token!==version||!selected||work.id!==selected.id||document.hidden) return;
        stopLive();
        const isHtml=isHtmlArtwork(work), isVideo=isVideoArtwork(work);
        if(!isHtml&&!isVideo) return;
        const node=document.createElement(isHtml?'iframe':'video');node.className='detail-original';
        if(isHtml){node.title=`${work.name} — original animated artwork`;node.setAttribute('sandbox','allow-scripts allow-same-origin');node.setAttribute('scrolling','no');}
        else {node.controls=true;node.muted=true;node.loop=true;node.playsInline=true;node.autoplay=true;}
        node.addEventListener(isHtml?'load':'loadeddata',()=>{if(node===live)node.classList.add('is-ready');},{once:true});
        node.src=isHtml||shouldUseDirectOnchainMedia(work)?`https://ordinals.com/content/${work.id}`:getCdnMediaSrc(work);
        media.append(node);live=node;
    }
    function flight(from, to, src, reverse=false) {
        if(!from||!to||reducedMotion()) return Promise.resolve();
        stopAnimation();
        ghost=new Image();ghost.src=src;ghost.className='artwork-flight';ghost.alt='';
        ghost.style.cssText=`left:${to.left}px;top:${to.top}px;width:${to.width}px;height:${to.height}px`;
        document.body.append(ghost);
        const transform=`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/to.height})`;
        const frames=[{transform,opacity:1},{transform:'none',opacity:1}];
        const flying=ghost, running=ghost.animate(reverse?frames.reverse():frames,{duration:680,easing:ease,fill:'both'});animation=running;
        return running.finished.catch(()=>{}).then(()=>{flying.remove();if(animation===running){animation=null;ghost=null;}});
    }
    function imageRect(image) {
        const r=image.getBoundingClientRect(),ratio=(image.naturalWidth||1)/(image.naturalHeight||1);
        const width=Math.min(r.width,r.height*ratio),height=width/ratio;
        return {left:r.left+(r.width-width)/2,top:r.top+(r.height-height)/2,width,height};
    }
    async function show(work, source, initial=false) {
        const token=++version;stopAnimation();stopLive();hidden=false;
        const opening=panel.hidden||!root.classList.contains('detail-open');
        selected=work;if(opening)opener=source||document.activeElement;
        buildRail(work);title.textContent=work.name;meta.textContent=`${work.collection} · ${workYear(work)}`;
        more.href=work.href?`${work.href}?view=website&work=${encodeURIComponent(work.id)}`:`/${work.id}?view=website`;
        for(const [id,button] of thumbs)button.setAttribute('aria-pressed',String(id===work.id));
        panel.hidden=false;root.classList.add('detail-open');
        panel.setAttribute('aria-labelledby','experience-artwork-title');title.id='experience-artwork-title';
        const previous=media.querySelector('.detail-poster');
        const poster=new Image();poster.className='detail-poster';poster.alt=work.name;poster.src=previewSource(work);poster.decoding='async';
        poster.onerror=()=>{poster.alt=`Preview unavailable for ${work.name}. Full artwork details remain available.`;};
        poster.style.opacity='0';media.append(poster);
        liveControls.replaceChildren();
        const animated=isHtmlArtwork(work)||isVideoArtwork(work);
        if(animated){const play=document.createElement('button');play.textContent=reducedMotion()?'Play original':'Pause artwork';play.onclick=()=>{const playing=play.textContent==='Play original';if(playing)startLive(work,token);else stopLive();play.textContent=playing?'Pause artwork':'Play original';};liveControls.append(play);}
        if(opening)close.focus({preventScroll:true});
        requestAnimationFrame(()=>thumbs.get(work.id)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reducedMotion()?'instant':'smooth'}));
        await poster.decode().catch(()=>{});
        if(token!==version){poster.remove();return;}
        const r=imageRect(poster);media.style.setProperty('--original-width',`${r.width}px`);media.style.setProperty('--original-height',`${r.height}px`);
        const from=source?.querySelector('img');
        if(opening&&from&&!initial){
            previous?.remove();from.style.visibility='hidden';await flight(imageRect(from),r,poster.src);from.style.visibility='';
            if(token!==version)return;
            poster.style.opacity='1';
        }else{
            poster.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'none'}],{duration:reducedMotion()?0:420,easing:ease});poster.style.opacity='1';
            if(previous){const out=previous.animate([{opacity:1},{opacity:0}],{duration:reducedMotion()?0:300,fill:'forwards'});out.finished.catch(()=>{}).then(()=>previous.remove());}
        }
        // Full-resolution stills load only after the preview is on screen.
        if(!animated){const high=new Image();high.src=work.original||(shouldUseDirectOnchainMedia(work)?`https://ordinals.com/content/${work.id}`:getCdnMediaSrc(work));high.onload=()=>{if(token===version)poster.src=high.src;};}
        else if(!reducedMotion())startLive(work,token);
    }
    function hide(destination, immediate=false) {
        const token=++version;stopLive();stopAnimation();hidden=true;
        const poster=media.querySelector('.detail-poster'), source=destination?.querySelector('img');
        root.classList.remove('detail-open');
        if(immediate||!poster||!source||reducedMotion()){panel.hidden=true;media.replaceChildren();}
        else {
            poster.style.opacity='0';
            // Read the destination after the background begins returning to its exact saved camera.
            const start=imageRect(poster),end=imageRect(source);
            const transform=getComputedStyle(root.querySelector('.experience-scene')).transform;
            if(transform!=='none')end.left-=new DOMMatrixReadOnly(transform).m41;
            source.style.visibility='hidden';
            flight(start,end,poster.src).then(()=>{source.style.visibility='';if(token===version){panel.hidden=true;media.replaceChildren();}});
        }
        const returnFocus=destination?.isConnected?destination:opener;
        returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});selected=null;
    }
    function keydown(event) {
        if(panel.hidden||hidden)return;
        if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();onClose();return;}
        if(event.ctrlKey||event.metaKey||event.altKey)return;
        const collection=catalog.collection(selected),index=collection.findIndex(w=>w.id===selected.id);
        if(['ArrowUp','ArrowDown'].includes(event.key)&&event.target.closest('.detail-rail')){
            event.preventDefault();const next=collection[(index+(event.key==='ArrowDown'?1:-1)+collection.length)%collection.length];onSelect(next);thumbs.get(next.id)?.focus({preventScroll:true});
        }
        if(event.key==='Tab'){
            // Keep keyboard focus within detail and the persistent mode switch.
            const focusable=[...document.querySelectorAll('#view-switch a'),...panel.querySelectorAll('button:not([hidden]),a,iframe')].filter(el=>el.getClientRects().length);
            const first=focusable[0],last=focusable.at(-1);
            if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
            else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        }
    }
    document.addEventListener('keydown',keydown,true);
    const visibility=()=>{if(document.hidden)stopLive();else if(selected&&!reducedMotion()&&liveControls.querySelector('button')?.textContent==='Pause artwork')startLive(selected,version);};
    document.addEventListener('visibilitychange',visibility);
    const motionChanged=()=>{
        if(!reducedMotion())return;
        stopLive();stopAnimation();
        const posters=[...media.querySelectorAll('.detail-poster')];posters.slice(0,-1).forEach(p=>p.remove());if(posters.at(-1))posters.at(-1).style.opacity='1';
        if(hidden)panel.hidden=true;
        const play=liveControls.querySelector('button');if(play)play.textContent='Play original';
    };
    window.addEventListener('lemonhaze:motion-change',motionChanged);
    const resize=new ResizeObserver(()=>{const poster=media.querySelector('.detail-poster');if(poster?.naturalWidth){const r=imageRect(poster);media.style.setProperty('--original-width',`${r.width}px`);media.style.setProperty('--original-height',`${r.height}px`);}});resize.observe(media);
    return {show,hide,element:panel,selected:()=>selected,
        destroy(){++version;stopLive();stopAnimation();resize.disconnect();window.removeEventListener('lemonhaze:motion-change',motionChanged);document.removeEventListener('keydown',keydown,true);document.removeEventListener('visibilitychange',visibility);panel.remove();},
    };
}
