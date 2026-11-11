import './modes.css';
import { createExperienceCatalog, viewingMode, immersiveUrl } from './model.js';

export function createViewingModes({ appState, applyWebsite, destroyHome, closeModal, router }) {
    const catalog=createExperienceCatalog(appState.artworks);
    let experience=null, mode=null, selected=null, current=null, saved={}, generation=0, websiteUrl='/?view=website',websiteScroll=0;
    let websiteContext=null;
    document.querySelector('#view-switch')?.remove();
    const nav=document.createElement('nav');nav.id='view-switch';nav.setAttribute('aria-label','Viewing mode');
    nav.innerHTML=['explore','gallery','website'].map(view=>`<a href="/?view=${view}" data-view="${view}">${view[0].toUpperCase()+view.slice(1)}</a>`).join('');
    document.body.append(nav);
    function save() {
        if(experience)saved={...saved,...experience.snapshot()};
        history.replaceState({...history.state,experience:saved},'',location.href);
        if(mode==='website'){websiteUrl=location.pathname+location.search+location.hash;websiteScroll=document.querySelector('#content-area')?.scrollTop||0;}
    }
    function write(url,replace=false) { history[replace?'replaceState':'pushState']({...history.state,experience:saved},'',url); }
    function setModeUi(next) {
        document.documentElement.dataset.view=next;
        document.querySelectorAll('body > aside, body > main:not(#immersive-experience)').forEach(node=>{node.inert=next!=='website';});
        for(const link of nav.querySelectorAll('a')) { if(link.dataset.view===next)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current'); }
    }
    function context() {
        return catalog.byId.get(appState.activeArtworkId)
            || catalog.all.find(work=>work.collection===appState.currentFilter)
            || (new URLSearchParams(location.search).get('work')?catalog.byId.get(new URLSearchParams(location.search).get('work')):null);
    }
    function onOpen(work,source) {
        save();selected=current=work;write(immersiveUrl(mode,work));
        experience.open(work,source);window.dispatchEvent(new Event('lemonhaze:immersive-change'));
    }
    function onClose() {
        save();selected=null;write(immersiveUrl(mode)+(mode==='gallery'&&current?'&at='+encodeURIComponent(current.id):''));experience.close();
    }
    async function toWebsite(work) {
        save();const next=work || current;
        const url=next ? next.href?`${next.href}?view=website&work=${encodeURIComponent(next.id)}`:`/${next.id}?view=website` : websiteUrl;
        write(url);await applyLocation();await applyWebsite();
        if(url===websiteUrl)document.querySelector('#content-area')?.scrollTo({top:websiteScroll,behavior:'instant'});
    }
    async function switchMode(next) {
        if(next===mode)return;
        if(next==='website'){await toWebsite(selected||current);return;}
        save();
        const work=mode==='website'?context():selected;
        if(mode==='website'){websiteContext=work;current=work;}
        write(immersiveUrl(next,work));await applyLocation();
        if(!work&&current)experience?.focusWork(current,true);
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
    async function applyLocation() {
        const token=++generation,url=new URL(location.href),next=viewingMode(url);
        saved={...saved,...history.state?.experience};
        if(next==='website') {
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
        if(!experience){
            try{
                const {createExperience}=await import('./experience.js');if(token!==generation)return true;
                experience=createExperience({catalog,saved,onOpen,onClose,onWebsite:toWebsite,onCurrent:work=>{
                    current=work;
                    // Browsing a slide is not a new history entry or an open detail.
                    if(mode==='gallery'&&!selected){const u=new URL(location.href);u.searchParams.set('at',work.id);history.replaceState(history.state,'',u);}
                }});
            }catch(error){fallback(error);return true;}
        }
        if(token!==generation)return true;
        mode=next;selected=work;current=work||current||websiteContext;setModeUi(next);
        experience.setMode(next,work,true,saved);
        const at=catalog.byId.get(url.searchParams.get('at'));if(!work&&at)experience.focusWork(at,true);
        window.dispatchEvent(new Event('lemonhaze:immersive-change'));
        window.dispatchEvent(new Event('lemonhaze:route-change'));
        return true;
    }
    return {applyLocation, switchMode, catalog};
}
