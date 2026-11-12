import { ARTWORK_SANDBOX } from '../ui/artwork-sandbox.js';

// Observe the first actual paint rather than the outer HTML loader's load event.
function paintBridge(token, sourceUrl) {
    const originalFetch=window.fetch.bind(window);
    window.fetch=(input,init)=>originalFetch(typeof input==='string'?new URL(input,sourceUrl).href:input,init);
    let painted=false,finished=false,resizeObserver=null,fitFrame=0;
    function fitSurface(surface) {
        // Fit the artwork's own tight wrapper, never its viewport. Some works
        // (Griffintown) size their canvas from that viewport on every frame;
        // scaling body feeds our scale back into their renderer indefinitely.
        let mount=surface;
        const bounds=surface.getBoundingClientRect();
        for(let parent=surface.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
            const r=parent.getBoundingClientRect();
            if(Math.abs(r.width-bounds.width)>1||Math.abs(r.height-bounds.height)>1)break;
            mount=parent;
        }
        const originalScale=mount.style.scale,originalTranslate=mount.style.translate;
        const fit=()=>{
            mount.style.scale=originalScale;mount.style.translate=originalTranslate;
            const r=mount.getBoundingClientRect(),w=document.documentElement.clientWidth,h=document.documentElement.clientHeight;
            if(r.width<16||r.height<16)return;
            const scale=Math.min(w/r.width,h/r.height);
            mount.style.transformOrigin='0 0';
            mount.style.translate=`${(w-r.width*scale)/2-r.left}px ${(h-r.height*scale)/2-r.top}px`;
            mount.style.scale=String(scale);
        };
        const schedule=()=>{cancelAnimationFrame(fitFrame);fitFrame=requestAnimationFrame(fit);};
        fit();resizeObserver=new ResizeObserver(schedule);resizeObserver.observe(surface);
        addEventListener('resize',schedule);
    }
    for(const [type,methods] of [[window.CanvasRenderingContext2D,['drawImage','fillRect','fill','stroke','putImageData']], [window.WebGLRenderingContext,['drawArrays','drawElements']], [window.WebGL2RenderingContext,['drawArrays','drawElements']]]) {
        if(!type)continue;
        for(const name of methods){const original=type.prototype[name];if(!original)continue;type.prototype[name]=function(...args){const result=original.apply(this,args);painted=true;return result;};}
    }
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>16&&r.height>16&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';};
    const watch=setInterval(()=>{
        if(finished)return;
        const canvas=painted&&[...document.querySelectorAll('canvas')].some(visible);
        const image=[...document.images].some(img=>img.complete&&img.naturalWidth>16&&visible(img));
        const svg=[...document.querySelectorAll('svg')].some(el=>el.children.length&&visible(el));
        const video=[...document.querySelectorAll('video')].some(el=>el.readyState>=2&&visible(el));
        if(!canvas&&!image&&!svg&&!video)return;
        // Recursive wrappers may retain a loading label while their assets arrive.
        if(/^(loading[. …]*|just a moment[. …]*)$/i.test(document.body?.innerText?.trim()||''))return;
        const surfaces=[...document.querySelectorAll('canvas,img,svg,video')].filter(visible).sort((a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return y.width*y.height-x.width*x.height;});
        if(surfaces[0])fitSurface(surfaces[0]);
        finished=true;clearInterval(watch);
        requestAnimationFrame(()=>requestAnimationFrame(()=>parent.postMessage({channel:'lemonhaze-artwork-paint',token},'*')));
    },100);
    addEventListener('pagehide',()=>{clearInterval(watch);resizeObserver?.disconnect();cancelAnimationFrame(fitFrame);});
}
export function buildLiveDocument(source,url,token,id) {
    // BEST BEFORE explicitly derives its identity and chain mode from location.
    source=source.replace('return window.location.pathname.split("/").pop();',`return ${JSON.stringify(id)};`)
        .replace('location.protocol === "file:" || location.origin === "null"','false');
    // Unknown self-location protocols must retain their static fallback.
    if(/\b(?:window\.)?location\s*\.\s*(?:pathname|href|hash|search|origin|protocol)\b/.test(source))throw new Error('Artwork requires its original location');
    const literal=value=>JSON.stringify(value).replaceAll('<','\\u003c');
    const setup=`<base href=${literal(url)}><script>(${paintBridge.toString()})(${literal(token)},${literal(url)});</script>`;
    return /<head[\s>]/i.test(source)?source.replace(/<head([^>]*)>/i,(_,attributes)=>`<head${attributes}>${setup}`):setup+source;
}
export function loadLiveDocument(frame,url,id,{onReady,onFailure}) {
    const token=crypto.randomUUID(),abort=new AbortController();let disposed=false;
    const message=event=>{if(event.source===frame.contentWindow&&event.data?.channel==='lemonhaze-artwork-paint'&&event.data.token===token)onReady();};
    window.addEventListener('message',message);
    frame.setAttribute('sandbox',ARTWORK_SANDBOX);
    fetch(url,{signal:abort.signal}).then(async response=>{
        if(!response.ok)throw new Error('Artwork unavailable');
        const source=await response.text();
        if(disposed)return;
        frame.srcdoc=buildLiveDocument(source,url,token,id);
    }).catch(()=>{if(!disposed)onFailure();});
    return ()=>{disposed=true;abort.abort();window.removeEventListener('message',message);};
}
