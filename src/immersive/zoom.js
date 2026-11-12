export const zoomFactorForWheel = (deltaY, deltaMode = 0, pageHeight = 800) =>
    Math.exp(-Math.max(-100,Math.min(100,deltaY*(deltaMode===1?16:deltaMode===2?pageHeight:1)))*.01);
export function zoomCamera(camera,factor,anchor,min=.025,max=1.7) {
    const zoom=Math.max(min,Math.min(max,camera.zoom*factor));
    return {x:anchor.x-(anchor.x-camera.x)*zoom/camera.zoom,y:anchor.y-(anchor.y-camera.y)*zoom/camera.zoom,zoom};
}
export function bindPinchZoom(viewport,zoom) {
    let gesture=false,scale=1;
    const wheel=event=>{
        if(!event.ctrlKey||event.metaKey)return;
        event.preventDefault();event.stopImmediatePropagation();
        if(!gesture){const r=viewport.getBoundingClientRect();zoom(zoomFactorForWheel(event.deltaY,event.deltaMode,viewport.clientHeight),{x:event.clientX-r.left,y:event.clientY-r.top});}
    };
    const start=event=>{gesture=true;scale=event.scale||1;event.preventDefault();};
    const change=event=>{event.preventDefault();const next=event.scale||1;zoom(next/scale);scale=next;};
    const end=event=>{event.preventDefault();gesture=false;scale=1;};
    viewport.addEventListener('wheel',wheel,{passive:false,capture:true});
    viewport.addEventListener('gesturestart',start,{passive:false});viewport.addEventListener('gesturechange',change,{passive:false});viewport.addEventListener('gestureend',end,{passive:false});
    return ()=>{viewport.removeEventListener('wheel',wheel,true);viewport.removeEventListener('gesturestart',start);viewport.removeEventListener('gesturechange',change);viewport.removeEventListener('gestureend',end);};
}
