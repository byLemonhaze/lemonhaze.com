import {pixelDimensions} from '../data/pixel-art.js';
import { thumbnailSource, workYear } from './model.js';
import { isHtmlArtwork, isVideoArtwork, shouldUseDirectOnchainMedia, getCdnMediaSrc } from '../modules/artwork-media.js';
import { ease, reducedMotion } from './motion.js';
import { artworkMetadata } from './metadata.js';
import { upgradePoster } from './media.js';
import { loadLiveDocument } from './live-document.js';
import { fitArtwork } from './presentation.js';

export function createDetail({ root, catalog, onSelect, onClose, onWebsite, onCollection, mountMetadata }) {
    const panel = document.createElement('section'); panel.className = 'experience-detail'; panel.hidden = true;
    panel.setAttribute('role','dialog'); panel.setAttribute('aria-label','Artwork details');
    panel.innerHTML = `<div class="detail-rail" role="group" aria-label="Collection artworks"></div>
        <div class="detail-stage"><div class="detail-media"></div></div>
        <div class="detail-caption"><p></p></div>
        <aside class="detail-info"><div class="detail-info-content"><p class="detail-eyebrow"></p><h1></h1><p class="detail-description"></p><dl class="detail-facts"></dl><details class="detail-expanded"><summary>Full details &amp; sales</summary><div class="detail-full-meta"></div></details><div class="detail-links"><button class="detail-collection-link">View collection in Gallery</button><a class="detail-inscription" target="_blank" rel="noopener">View inscription</a><a class="detail-more" href="/shop">Print details</a></div></div></aside>
        <button class="detail-close" aria-label="Close artwork"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
`;
    root.append(panel);
    const info=panel.querySelector('.detail-info'),facts=panel.querySelector('.detail-facts');
    const expanded=panel.querySelector('.detail-expanded'),fullMeta=panel.querySelector('.detail-full-meta');
    let releaseMetadata=null,metadataWork=null;
    function loadMetadata(){
        if(!expanded.open||!metadataWork||releaseMetadata)return;
        releaseMetadata=mountMetadata?.(metadataWork,fullMeta,{onSelect:id=>{const work=catalog.byId.get(id);if(work)onSelect(work);},onCollection});
    }
    expanded.addEventListener('toggle',()=>{if(expanded.open)loadMetadata();});
    fullMeta.addEventListener('click',event=>{
        const anchor=event.target.closest('a[href]');if(!anchor||anchor.dataset.collectionLink||anchor.target==='_blank'||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
        const url=new URL(anchor.href,location.href);if(url.origin!==location.origin)return;
        event.preventDefault();event.stopPropagation();onWebsite(url.pathname+url.search+url.hash);
    },true);
    const collectionLink=panel.querySelector('.detail-collection-link'),inscription=panel.querySelector('.detail-inscription');
    function showInfo(work) {
        releaseMetadata?.();releaseMetadata=null;metadataWork=work;
        expanded.hidden=Boolean(work.href);if(work.href)expanded.open=false;
        loadMetadata();
        const data=artworkMetadata(work);
        panel.querySelector('.detail-eyebrow').textContent=work.collection==='Provenance'?'Parent inscription':work.collection;
        panel.classList.toggle('pixel-art',Boolean(pixelDimensions(work)));
        panel.querySelector('.detail-core-note')?.remove();
        if(data.coreNote){const note=document.createElement('p');note.className='detail-core-note';note.textContent=data.coreNote;panel.querySelector('.detail-description').before(note);}
        const description=panel.querySelector('.detail-description');description.textContent=data.description;description.hidden=!data.description;
        facts.replaceChildren();
        for(const [label,value] of data.fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;facts.append(dt,dd);}
        inscription.hidden=!data.original;if(data.original)inscription.href=data.original;
        collectionLink.onclick=()=>onCollection(work.collection);collectionLink.hidden=!catalog.galleryCollections.has(work.collection);
        more.hidden=!work.href;
        info.scrollTop=0;
    }
    const rail = panel.querySelector('.detail-rail'), media = panel.querySelector('.detail-media');
    const title = panel.querySelector('h1'), meta = panel.querySelector('.detail-caption p'), more = panel.querySelector('.detail-more');
    const close = panel.querySelector('.detail-close');
    const soloEnter=document.createElement('button');soloEnter.type='button';soloEnter.className='detail-solo-enter';
    media.append(soloEnter);
    let solo=false;
    function setSolo(active,focus=false){
        solo=active;root.classList.toggle('detail-solo',solo);
        close.setAttribute('aria-label',solo?'Return to artwork details':'Close artwork');
        for(const node of [rail,info,panel.querySelector('.detail-caption')])node.inert=solo;
        if(focus)(solo?close:soloEnter).focus({preventScroll:true});
    }
    soloEnter.onclick=()=>{if(innerWidth>700){stopAnimation();setSolo(true,true);}};
    root.append(close);close.hidden=true;
    let selected = null, currentCollection = null, opener = null, animation = null, ghost = null, version = 0, live = null, hidden = false,liveTimeout=0,releaseLiveDocument=null,cancelPoster=null;
    const thumbs = new Map();
    const closeDetail=()=>{if(solo)setSolo(false,true);else onClose();};
    close.onclick = closeDetail;
    function stopAnimation() { animation?.cancel(); animation=null; ghost?.remove(); ghost=null; }
    function stopLive() { clearTimeout(liveTimeout);releaseLiveDocument?.();releaseLiveDocument=null;media.classList.remove('live-ready');if(live){ if(live.tagName==='VIDEO')live.pause();live.remove();live=null; } }
    function buildRail(work) {
        if(currentCollection===work.collection) return;
        currentCollection=work.collection;rail.replaceChildren();thumbs.clear();
        for(const item of catalog.collection(work)) {
            const button=document.createElement('button');button.type='button';button.className='detail-thumbnail';
            button.setAttribute('aria-label',item.name);button.title=item.name;
            const image=new Image();image.src=thumbnailSource(item);image.alt='';image.loading='lazy';image.decoding='async';
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
        if(isHtml){node.title=`${work.name} — original animated artwork`;node.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');node.setAttribute('scrolling','no');}
        else {node.controls=true;node.muted=true;node.loop=true;node.playsInline=true;node.autoplay=true;}
        const ready=()=>{if(node===live&&!node.classList.contains('is-ready')){
            clearTimeout(liveTimeout);node.classList.add('is-ready');media.classList.add('live-ready');
        }};
        const fail=()=>{if(node!==live)return;stopLive();};
        node.addEventListener('error',fail,{once:true});
        media.append(node);live=node;
        const url=isHtml||shouldUseDirectOnchainMedia(work)?`https://ordinals.com/content/${work.id}`:getCdnMediaSrc(work);
        if(isHtml)releaseLiveDocument=loadLiveDocument(node,url,work.id,{onReady:ready,onFailure:fail});
        else {node.addEventListener('loadeddata',ready,{once:true});node.src=url;}
        liveTimeout=setTimeout(fail,12000);
    }
    function flight(from, to, src, reverse=false) {
        if(!from||!to||reducedMotion()) return Promise.resolve();
        stopAnimation();
        ghost=new Image();ghost.src=src;ghost.className='artwork-flight'+(pixelDimensions(selected)?' pixel-art':'');ghost.alt='';
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
        const token=++version;cancelPoster?.();cancelPoster=null;stopAnimation();stopLive();hidden=false;
        const opening=panel.hidden||!root.classList.contains('detail-open');
        const originImage=source?.querySelector('img'),originRect=originImage?.naturalWidth?imageRect(originImage):null;
        setSolo(false);selected=work;if(opening)opener=source||document.activeElement;
        soloEnter.setAttribute('aria-label',`View ${work.name} in solo view`);
        if(!soloEnter.isConnected)media.append(soloEnter);
        showInfo(work);buildRail(work);title.textContent=work.name;meta.textContent=`${work.collection==='Provenance'?'Parent inscription':work.collection} · ${workYear(work)}`;
        more.href=work.href||'/?view=website';
        for(const [id,button] of thumbs)button.setAttribute('aria-pressed',String(id===work.id));
        panel.hidden=false;close.hidden=false;root.classList.add('detail-open');
        panel.setAttribute('aria-labelledby','experience-artwork-title');title.id='experience-artwork-title';
        const existing=[...media.querySelectorAll('.detail-poster')],previous=existing.pop();existing.forEach(image=>image.remove());
        const poster=new Image();poster.className='detail-poster';poster.alt=work.name;poster.src=thumbnailSource(work);poster.decoding='async';
        poster.onload=()=>{if(token===version&&poster.naturalWidth&&poster.dataset.presented)sizePoster(poster);};
        poster.onerror=()=>{poster.alt=`Preview unavailable for ${work.name}. Full artwork details remain available.`;};
        poster.style.opacity='0';media.append(poster);
        const animated=isHtmlArtwork(work)||isVideoArtwork(work);
        if(opening)close.focus({preventScroll:true});
        requestAnimationFrame(()=>token===version&&thumbs.get(work.id)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:reducedMotion()?'instant':'smooth'}));
        await poster.decode().catch(()=>{});
        if(token!==version){poster.remove();return;}
        previous?.remove();poster.dataset.presented='true';sizePoster(poster);const r=imageRect(poster);
        const from=source?.querySelector('img');
        if(initial){previous?.remove();poster.style.opacity='1';}
        else if(opening&&from&&originRect){
            previous?.remove();from.style.visibility='hidden';await flight(originRect,r,poster.src);from.style.visibility='';
            if(token!==version)return;
            poster.style.opacity='1';
        }else{
            poster.style.opacity='1';
        }
        // Decode offscreen, then gently resolve the sharper image into focus.
        // A stale load cannot overwrite a new selection or recycled thumbnail.
        // Resolve the sharp still before starting live playback. Both use the
        // same fitted stage, so late still loads cannot resize a live surface.
        cancelPoster=upgradePoster(work,poster,{onSettled:()=>{
            if(token===version&&animated&&!reducedMotion())startLive(work,token);
        }});
    }
    function hide(destination, immediate=false) {
        const token=++version;cancelPoster?.();cancelPoster=null;stopLive();stopAnimation();hidden=true;releaseMetadata?.();releaseMetadata=null;metadataWork=null;
        const poster=[...media.querySelectorAll('.detail-poster')].at(-1), source=destination?.querySelector('img');
        setSolo(false);root.classList.remove('detail-open');close.hidden=true;
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
        if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeDetail();return;}
        if(event.ctrlKey||event.metaKey||event.altKey)return;
        const collection=catalog.collection(selected),index=collection.findIndex(w=>w.id===selected.id);
        if(['ArrowUp','ArrowDown'].includes(event.key)&&event.target.closest('.detail-rail')){
            event.preventDefault();const next=collection[(index+(event.key==='ArrowDown'?1:-1)+collection.length)%collection.length];onSelect(next);thumbs.get(next.id)?.focus({preventScroll:true});
        }
        if(event.key==='Tab'){
            // Keep keyboard focus within detail and the persistent mode switch.
            const focusable=[...document.querySelectorAll('#view-switch a,#site-wordmark'),close,...panel.querySelectorAll('button:not([hidden]),a,iframe,summary')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
            const first=focusable[0],last=focusable.at(-1);
            if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
            else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
        }
    }
    document.addEventListener('keydown',keydown,true);
    const visibility=()=>{if(document.hidden)stopLive();else if(selected&&!reducedMotion())startLive(selected,version);};
    document.addEventListener('visibilitychange',visibility);
    const motionChanged=()=>{
        if(!reducedMotion())return;
        stopLive();stopAnimation();
        const posters=[...media.querySelectorAll('.detail-poster')];posters.slice(0,-1).forEach(p=>p.remove());if(posters.at(-1))posters.at(-1).style.opacity='1';
        if(hidden)panel.hidden=true;
    };
    window.addEventListener('lemonhaze:motion-change',motionChanged);
    function sizePoster(poster) {
        if(!poster.naturalWidth||!poster.naturalHeight)return;
        const fitted=fitArtwork(media.clientWidth,media.clientHeight,poster.naturalWidth/poster.naturalHeight);
        for(const [key,value] of Object.entries(fitted))media.style.setProperty(`--${key==='width'||key==='height'?'original-'+key:key==='frameWidth'?'frame-width':key==='frameHeight'?'frame-height':key}`,`${value}px`);
    }
    const resize=new ResizeObserver(()=>{if(solo&&innerWidth<=700)setSolo(false);const poster=[...media.querySelectorAll('.detail-poster')].at(-1);if(poster?.naturalWidth)sizePoster(poster);});resize.observe(media);
    return {show,hide,element:panel,selected:()=>selected,
        destroy(){++version;cancelPoster?.();releaseMetadata?.();releaseMetadata=null;stopLive();stopAnimation();resize.disconnect();window.removeEventListener('lemonhaze:motion-change',motionChanged);document.removeEventListener('keydown',keydown,true);document.removeEventListener('visibilitychange',visibility);panel.remove();close.remove();},
    };
}
