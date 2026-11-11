import './experience.css';
import { createExplore } from './explore.js';
import { createGallery } from './gallery.js';
import { createDetail } from './detail.js';
import { reducedMotion } from './motion.js';

export function createExperience({ catalog, onOpen, onClose, onWebsite, onCurrent, saved = {} }) {
    const root=document.createElement('main');root.id='immersive-experience';root.className='immersive-experience';
    root.innerHTML='<a class="experience-brand" href="/?view=explore" aria-label="Lemonhaze — Explore">LEMONHAZE</a><div class="experience-scene"></div><div class="experience-note"><span class="experience-edition">Selected works</span><button class="motion-toggle" aria-label="Reduce motion">Motion on</button></div>';
    const scene=root.querySelector('.experience-scene');
    document.querySelector('#immersive-experience')?.remove();document.body.append(root);
    const views={}; let mode=null;
    const detail=createDetail({root,catalog,onSelect:onOpen,onClose,onWebsite});
    const motion=root.querySelector('.motion-toggle'),preference=matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion=()=>{motion.setAttribute('aria-pressed',String(reducedMotion()));motion.textContent=reducedMotion()?'Motion reduced':'Motion on';motion.disabled=preference.matches;motion.title=preference.matches?'Reduced motion follows your device preference':'Toggle reduced motion';window.dispatchEvent(new Event('lemonhaze:motion-change'));};
    motion.onclick=()=>{document.documentElement.dataset.motion=reducedMotion()?'full':'reduced';updateMotion();};
    preference.addEventListener('change',updateMotion);updateMotion();
    const visibility=()=>{if(mode)views[mode]?.setActive(!document.hidden);};document.addEventListener('visibilitychange',visibility);
    return {
        setMode(next,work=null,initial=false,snapshots={}){
            if(!views[next]) views[next]=(next==='explore'?createExplore:createGallery)({container:scene,works:catalog.selected,onOpen,onCurrent,saved:saved[next]});
            for(const [name,view] of Object.entries(views))view.setActive(name===next);
            if(snapshots[next])views[next].restore(snapshots[next]);
            mode=next;root.dataset.mode=next;
            if(work){views[next].ensureWork(work,true);if(detail.selected()?.id!==work.id)detail.show(work,views[next].buttons.get(work.id),initial);}
            else if(detail.selected())detail.hide(views[next].buttons.get(detail.selected().id),initial);
            this.setBackgroundAccess();
        },
        setBackgroundAccess(){const open=Boolean(detail.selected());for(const view of Object.values(views)){view.element.inert=open;view.tools.inert=open;}},
        open(work,source,initial=false){views[mode].ensureWork(work);detail.show(work,source,initial);this.setBackgroundAccess();},
        close(){const id=detail.selected()?.id;for(const view of Object.values(views)){view.element.inert=false;view.tools.inert=false;}detail.hide(views[mode].buttons.get(id));this.setBackgroundAccess();},
        focusWork(work,immediate=false){views[mode]?.ensureWork(work,immediate);},
        snapshot(){return Object.fromEntries(Object.entries(views).map(([key,view])=>[key,view.snapshot()]));},
        destroy(){document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',updateMotion);detail.destroy();Object.values(views).forEach(view=>view.destroy());root.remove();},
    };
}
