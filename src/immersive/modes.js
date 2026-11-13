import './modes.css';
import { createExperienceCatalog, viewingMode, immersiveUrl, websiteDestination } from './model.js';
import { collectionEntry } from './collections.js';
import { isExploreWork } from './roster.js';
import { reducedMotion } from './motion.js';

export function createViewingModes({ appState, applyWebsite, destroyHome, closeModal, router, mountMetadata }) {
    const catalog=createExperienceCatalog(appState.artworks);
    let experience=null, mode=null, selected=null, current=null, saved={}, generation=0;
    let websiteAnimation=null;
    let websiteContext=null,websiteReturn={url:'/?view=website',scroll:0};
    document.querySelector('#view-switch')?.remove();
    const nav=document.createElement('nav');nav.id='view-switch';nav.setAttribute('aria-label','Viewing mode');
    nav.innerHTML='<i class="view-saddle" aria-hidden="true"></i>'+['explore','gallery','website'].map(view=>`<a href="/?view=${view}" data-view="${view}"><span>${view==='website'?'Menu':view[0].toUpperCase()+view.slice(1)}</span></a>`).join('');
    for(const link of nav.querySelectorAll('a')){
        const reset=()=>{link.style.setProperty('--magnet-x','0px');link.style.setProperty('--magnet-y','0px');};
        link.addEventListener('pointermove',event=>{
            if(event.pointerType!=='mouse'||reducedMotion())return;
            const box=link.getBoundingClientRect();
            link.style.setProperty('--magnet-x',`${(event.clientX-box.left-box.width/2)*.13}px`);
            link.style.setProperty('--magnet-y',`${(event.clientY-box.top-box.height/2)*.17}px`);
        });
        link.addEventListener('pointerleave',reset);link.addEventListener('blur',reset);
    }
    nav.addEventListener('keydown',event=>{
        const links=[...nav.querySelectorAll('a')],index=links.indexOf(document.activeElement);
        if(index<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
        event.preventDefault();
        links[event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3].focus();
    });
    document.querySelector('#site-wordmark')?.remove();
    const brand=document.createElement('a');brand.id='site-wordmark';brand.href='/?view=explore';brand.textContent='LEMONHAZE';brand.setAttribute('aria-label','Lemonhaze — Explore');
    document.body.append(nav,brand);
    brand.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();save();selected=null;current=null;write('/?view=explore');applyLocation().catch(fallback);});
    function save() {
        if(experience)saved={...saved,...experience.snapshot()};
        history.replaceState({...history.state,experience:saved},'',location.href);
    }
    function write(url,replace=false) { history[replace?'replaceState':'pushState']({...history.state,experience:saved},'',url); }
    function setModeUi(next) {
        document.documentElement.dataset.view=next;
        document.querySelectorAll('body > aside, body > main:not(#immersive-experience)').forEach(node=>{node.inert=next!=='website';});
        for(const link of nav.querySelectorAll('a')) { if(link.dataset.view===next)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current'); }
        nav.style.setProperty('--mode-index',['explore','gallery','website'].indexOf(next));
    }
    function context() {
        return selected || catalog.byId.get(appState.activeArtworkId)
            || catalog.all.find(work=>work.collection===appState.currentFilter)
            || (new URLSearchParams(location.search).get('work')?catalog.byId.get(new URLSearchParams(location.search).get('work')):null);
    }
    function modeUrl(next,work=null) {
        const collection=experience?.snapshot().gallery?.collection||saved.gallery?.collection;
        return immersiveUrl(next,work)+(next==='gallery'&&collection&&collection!=='Selected works'?'&series='+encodeURIComponent(collection):'');
    }
    function galleryFocusUrl(work) {
        const shown=catalog.original(work)||work;
        const collection=catalog.galleryCollections.has(shown.collection)?shown.collection:'Selected works';
        return immersiveUrl('gallery')+(collection==='Selected works'?'':'&series='+encodeURIComponent(collection))+'&at='+encodeURIComponent(shown.id);
    }
    async function onCollectionChange(collection) {
        const work=selected?.collection===collection?selected:null;
        save();write(work?galleryFocusUrl(work):immersiveUrl('gallery')+(collection==='Selected works'?'':'&series='+encodeURIComponent(collection)));
        current=null;selected=null;await applyLocation();
    }
    function onOpen(work,source) {
        save();selected=current=work;write(mode==='website'?websiteDestination(work):modeUrl(mode,work));
        experience.open(work,source);window.dispatchEvent(new Event('lemonhaze:immersive-change'));window.dispatchEvent(new Event('lemonhaze:route-change'));
    }
    function onClose() {
        if(mode==='website'){
            save();selected=null;write(websiteReturn.url);
            const pending=applyLocation(),token=generation;
            pending.then(async()=>{if(token!==generation)return;await applyWebsite();if(token===generation)document.querySelector('#content-area')?.scrollTo({top:websiteReturn.scroll,behavior:'instant'});});return;
        }
        save();selected=null;write(modeUrl(mode)+(mode==='gallery'&&current?'&at='+encodeURIComponent(current.id):''));experience.close();
    }
    function openWebsiteArtwork(id){
        const work=catalog.byId.get(id);if(!work||mode!=='website')return false;
        websiteReturn={url:location.pathname+location.search+location.hash,scroll:document.querySelector('#content-area')?.scrollTop||0};
        save();write(typeof work==='string'?work:websiteDestination(work));applyLocation().catch(fallback);return true;
    }
    async function toWebsite(work = null) {
        save();write(typeof work==='string'?work:websiteDestination(work));
        const pending=applyLocation(),token=generation;await pending;
        if(token!==generation)return;
        await applyWebsite();if(token!==generation)return;
        if(!work)document.querySelector('#content-area')?.scrollTo({top:0,behavior:'instant'});
        if(location.hash){
            const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if(target?.tagName==='DETAILS')target.open=true;
            target?.scrollIntoView({block:'start',behavior:'instant'});
        }
        websiteAnimation?.cancel();
        if(!selected&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&document.documentElement.dataset.motion!=='reduced'){
            const page=document.querySelector('body > main:not(#immersive-experience)');
            websiteAnimation=page?.animate([{opacity:.25},{opacity:1}],{duration:220,easing:'ease-out'});
        }
    }
    async function switchMode(next) {
        // The Menu tab always means the website home, even when a detail is already open there.
        if(next==='website'){await toWebsite();return;}
        if(next===mode&&next===viewingMode(new URL(location.href))&&!selected)return;
        save();
        let work=mode==='website'?context():selected||(mode==='gallery'&&next==='explore'?current:null);
        // Leaving a detail for Gallery means entering its collection at the
        // current work, not carrying the open detail or an old carousel context.
        if(next==='gallery'&&work){write(galleryFocusUrl(work));await applyLocation();return;}
        if(next==='explore'&&work&&!isExploreWork(catalog.original(work)))work=null;
        if(next==='explore'){
            write(immersiveUrl('explore')+(work?'&at='+encodeURIComponent(catalog.original(work).id):''));
            await applyLocation();return;
        }
        if(mode==='website'){websiteContext=work;current=work;}
        write(modeUrl(next,work));const pending=applyLocation(),token=generation;await pending;
        if(token===generation&&!work&&current)experience?.focusWork(current,true);
    }
    nav.addEventListener('click',event=>{
        const link=event.target.closest('a');if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        event.preventDefault();switchMode(link.dataset.view).catch(fallback);
    });
    function fallback(error) {
        console.error('Immersive view unavailable',error);experience?.destroy();experience=null;mode='website';setModeUi(mode);
        write('/?view=website',true);applyWebsite();
        const message=document.createElement('p');message.className='experience-error';message.setAttribute('role','status');
        message.textContent='The immersive view is unavailable. You can continue browsing the website.';document.body.append(message);setTimeout(()=>message.remove(),8000);
    }
    async function ensureExperience(token){
        if(experience)return true;
        const {createExperience}=await import('./experience.js');if(token!==generation)return false;
        experience=createExperience({catalog,saved,mountMetadata,onOpen,onClose,onWebsite:toWebsite,onCollectionChange,onCurrent:work=>{
            current=work;
            if(mode==='gallery'&&viewingMode(new URL(location.href))==='gallery'&&!selected){const u=new URL(location.href);u.searchParams.set('at',work.id);history.replaceState(history.state,'',u);}
        }});
        return true;
    }
    async function applyLocation() {
        const token=++generation,url=new URL(location.href),next=viewingMode(url);
        websiteAnimation?.cancel();websiteAnimation=null;
        saved={...saved,...history.state?.experience};
        if(next==='website') {
            const route=router.getRouteStateFromUrl(),work=catalog.byId.get(route.artwork||url.searchParams.get('work'));
            if(work){
                destroyHome();closeModal({updateUrl:false});mode=next;selected=current=work;setModeUi(next);
                if(!await ensureExperience(token))return true;
                document.querySelectorAll('body > aside, body > main:not(#immersive-experience)').forEach(node=>{node.inert=true;});
                experience.showStandalone(work);appState.activeArtworkId=work.id;window.dispatchEvent(new Event('lemonhaze:route-change'));return true;
            }
            if(experience){saved={...saved,...experience.snapshot()};experience.destroy();experience=null;}
            document.querySelector('#immersive-experience')?.remove();mode=next;setModeUi(next);selected=null;
            return false;
        }
        destroyHome();closeModal({updateUrl:false});
        // Remove inactive conventional rendering, including live iframes and videos.
        document.querySelector('#gallery-grid')?.replaceChildren();
        const explicit=url.searchParams.get('work');
        const route=router.getRouteStateFromUrl();
        const work=catalog.byId.get(explicit||route.artwork)||(!['/','/index.html'].includes(url.pathname)?catalog.all.find(w=>w.collection===route.collection):null)||null;
        try{if(!await ensureExperience(token))return true;}catch(error){if(token===generation)fallback(error);return true;}
        if(token!==generation)return true;
        mode=next;selected=work;current=work||current||websiteContext;setModeUi(next);
        if(next==='gallery'){
            const requested=url.searchParams.get('series')||'Selected works',collection=catalog.galleryCollections.has(requested)?requested:'Selected works';
            const position=saved.gallery?.collection===collection?saved.gallery.position:saved.gallery?.positions?.[collection]??collectionEntry(collection,catalog.galleryCollections.get(collection));
            saved.gallery={...saved.gallery,collection,position};
        }
        experience.setMode(next,work,true,saved);
        const at=catalog.byId.get(url.searchParams.get('at'));if(!work&&at)experience.focusWork(at,true);
        window.dispatchEvent(new Event('lemonhaze:immersive-change'));
        window.dispatchEvent(new Event('lemonhaze:route-change'));
        return true;
    }
    const artworkLinks=event=>{
        if(mode!=='website'||event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
        const anchor=event.target.closest('a[href]');if(!anchor||anchor.target==='_blank')return;
        const url=new URL(anchor.href,location.href);if(url.origin!==location.origin)return;
        const id=decodeURIComponent(url.pathname.replace(/^\//,''));
        if(catalog.byId.has(id)){event.preventDefault();event.stopImmediatePropagation();openWebsiteArtwork(id);}
    };
    document.addEventListener('click',artworkLinks,true);
    return {applyLocation, switchMode, catalog,openWebsiteArtwork,openWebsitePage:toWebsite};
}
