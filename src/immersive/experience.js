import './experience.css';
import { createExplore } from './explore.js';
import { createGallery } from './gallery.js';
import { createDetail } from './detail.js';

export function createExperience({ catalog, onOpen, onClose, onWebsite, onCurrent, onCollectionChange, mountMetadata, saved = {} }) {
    const root=document.createElement('main');root.id='immersive-experience';root.className='immersive-experience';
    root.innerHTML='<div class="experience-scene"></div>';
    root.dataset.surface=new URLSearchParams(location.search).get('surface')==='paper'?'paper':'flat';
    const scene=root.querySelector('.experience-scene');
    document.querySelector('#immersive-experience')?.remove();document.body.append(root);
    const views={}; let mode=null;
    const representative=(view,work)=>view==='explore'?catalog.original(work):work;
    const detail=createDetail({root,catalog,mountMetadata,onSelect:onOpen,onClose,onWebsite,onCollection:onCollectionChange});
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion=()=>window.dispatchEvent(new Event('lemonhaze:motion-change'));
    preference.addEventListener('change',updateMotion);updateMotion();
    const visibility=()=>{if(mode)views[mode]?.setActive(!document.hidden);};document.addEventListener('visibilitychange',visibility);
    return {
        setMode(next,work=null,initial=false,snapshots={}){
            if(!views[next]) views[next]=(next==='explore'?createExplore:createGallery)({container:scene,works:next==='explore'?catalog.explore:catalog.selected,onOpen,onCurrent,collections:catalog.galleryCollections,onCollectionChange,saved:saved[next]});
            for(const [name,view] of Object.entries(views))view.setActive(name===next);
            if(snapshots[next])views[next].restore(snapshots[next]);
            mode=next;root.dataset.mode=next;
            if(work){const shown=representative(next,work);views[next].ensureWork(shown,true);if(detail.selected()?.id!==work.id)detail.show(work,views[next].buttons.get(shown.id),initial);}
            else if(detail.selected())detail.hide(views[next].buttons.get(representative(next,detail.selected()).id),initial);
            this.setBackgroundAccess();
        },
        setBackgroundAccess(){const open=Boolean(detail.selected());for(const view of Object.values(views)){view.element.inert=open;view.tools.inert=open;view.setDetailOpen(open);}},
        showStandalone(work){for(const view of Object.values(views))view.setActive(false);mode=null;root.dataset.mode='website';detail.show(work,null,true);this.setBackgroundAccess();},
        open(work,source,initial=false){views[mode]?.ensureWork(representative(mode,work));detail.show(work,source,initial);this.setBackgroundAccess();},
        close(){const selected=detail.selected(),id=selected?representative(mode,selected).id:null;for(const view of Object.values(views)){view.element.inert=false;view.tools.inert=false;}detail.hide(views[mode].buttons.get(id));this.setBackgroundAccess();},
        focusWork(work,immediate=false){const view=views[mode];if(view?.focusWork)view.focusWork(representative(mode,work),immediate);else view?.ensureWork(representative(mode,work),immediate);},
        snapshot(){return Object.fromEntries(Object.entries(views).map(([key,view])=>[key,view.snapshot()]));},
        destroy(){document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',updateMotion);detail.destroy();Object.values(views).forEach(view=>view.destroy());root.remove();},
    };
}
