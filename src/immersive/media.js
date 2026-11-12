import {pixelOriginalSource} from '../data/pixel-art.js';
import { isStaticOnlyMedia, getLocalGridPreviewSrc, isHtmlArtwork, isVideoArtwork, getCdnMediaSrc, shouldUseDirectOnchainMedia } from '../modules/artwork-media.js';
import { previewSource } from './model.js';

export const isLiveWork = work => isHtmlArtwork(work) || isVideoArtwork(work);
const staticPreviewSource=work=>isVideoArtwork(work)?getCdnMediaSrc(work,'png'):previewSource(work);
export function originalSource(work) {
    if(pixelOriginalSource(work))return pixelOriginalSource(work);
    if(isStaticOnlyMedia(work))return getLocalGridPreviewSrc(work);
    return work.original || (isHtmlArtwork(work)||shouldUseDirectOnchainMedia(work) ? `https://ordinals.com/content/${work.id}` : getCdnMediaSrc(work));
}
export function upgradePoster(work,img,{source,onSettled=()=>{}}={}) {
    if(!img||img.dataset.quality===work.id){queueMicrotask(onSettled);return ()=>{};}
    let cancelled=false;
    let settled=false;const finish=()=>{if(!settled){settled=true;onSettled();}};
    const before=img.getAttribute('src'), high=new Image();high.decoding='async';
    high.onload=async()=>{
        try { await high.decode(); } catch { finish();return; }
        if(cancelled||!img.isConnected||img.getAttribute('src')!==before){finish();return;}
        img.dataset.quality=work.id;
        img.src=high.src;
        finish();
    };
    let triedCdn=false;
    high.onerror=()=>{
        // A gateway may reject cross-origin images even when the inscription
        // exists. Keep the still sharp using the artist-owned mirror.
        if(!cancelled&&!triedCdn&&/^https:\/\/ordinals\.com\/(content|preview)\//.test(high.src)){
            triedCdn=true;high.src=getCdnMediaSrc(work,isLiveWork(work)?'png':null);return;
        }
        finish();
    };
    high.src=source||(isLiveWork(work)?staticPreviewSource(work):originalSource(work));
    return ()=>{cancelled=true;high.onload=high.onerror=null;high.src='';finish();};
}

// Decode only two sharp static previews at a time. Callers order the current
// artwork first, followed by visible neighbours; leaving the view cancels work.
export function createPreviewQueue(limit=2) {
    const jobs=new Map();let order=[],active=0,updating=false;
    function drain(){
        if(updating)return;
        for(const img of order){
            const job=jobs.get(img);if(active>=limit)break;
            if(!job||job.started)continue;
            job.started=true;active++;
            job.cancel=upgradePoster(job.work,img,{source:staticPreviewSource(job.work),onSettled:()=>{active--;drain();}});
        }
    }
    return {
        update(entries){
            updating=true;const wanted=new Set(entries.map(entry=>entry.img));
            for(const [img,job] of jobs)if(!wanted.has(img)){jobs.delete(img);job.cancel?.();}
            order=entries.map(entry=>entry.img);
            for(const entry of entries)if(!jobs.has(entry.img)&&entry.img.dataset.quality!==entry.work.id)jobs.set(entry.img,{...entry,started:false});
            updating=false;drain();
        },
        clear(){updating=true;order=[];for(const job of jobs.values())job.cancel?.();jobs.clear();updating=false;},
    };
}
