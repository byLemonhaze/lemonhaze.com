import {getCdnMediaSrc} from '../modules/artwork-media.js';
import {downloadImageSource} from './media.js';

const extensions={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg','image/avif':'avif'};

export function imageFilename(work,type){
    const name=String(work.name||work.id||'artwork').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').trim().slice(0,150)||'artwork';
    return `${name}.${extensions[type]||'img'}`;
}

export async function fetchDownloadImage(work,{signal}={}){
    const source=downloadImageSource(work);
    const sources=[source];
    // Chain image gateways can reject CORS; the artist's mirror is a still-image fallback.
    if(/^https:\/\/ordinals\.com\/(content|preview)\//.test(source))sources.push(getCdnMediaSrc(work));
    for(const url of [...new Set(sources)]){
        try{
            const response=await fetch(url,{signal});
            if(!response.ok)throw new Error('Image unavailable');
            const blob=await response.blob();
            if(!blob.size||!blob.type.startsWith('image/'))throw new Error('Not an image');
            return {blob,filename:imageFilename(work,blob.type)};
        }catch(error){if(signal?.aborted)throw error;}
    }
    throw new Error('Image download unavailable');
}

export async function downloadArtworkImage(work,{signal}={}){
    const {blob,filename}=await fetchDownloadImage(work,{signal});
    signal?.throwIfAborted();
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=filename;anchor.hidden=true;
    document.body.append(anchor);
    try{anchor.click();}finally{anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
}
