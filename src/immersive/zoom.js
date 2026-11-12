export const zoomFactorForWheel = (deltaY, deltaMode = 0, pageHeight = 800) =>
    Math.exp(-Math.max(-100,Math.min(100,deltaY*(deltaMode===1?16:deltaMode===2?pageHeight:1)))*.01);
export function zoomCamera(camera,factor,anchor,min=.025,max=1.7) {
    const zoom=Math.max(min,Math.min(max,camera.zoom*factor));
    return {x:anchor.x-(anchor.x-camera.x)*zoom/camera.zoom,y:anchor.y-(anchor.y-camera.y)*zoom/camera.zoom,zoom};
}
export function bindPinchZoom(viewport,zoom,onGesture=()=>{}) {
    let gesture=false,scale=1,touchPinch=null;
    const wheel=event=>{
        if(!event.ctrlKey||event.metaKey)return;
        event.preventDefault();event.stopImmediatePropagation();
        if(!gesture&&!touchPinch){const r=viewport.getBoundingClientRect();zoom(zoomFactorForWheel(event.deltaY,event.deltaMode,viewport.clientHeight),{x:event.clientX-r.left,y:event.clientY-r.top});}
    };
    const start=event=>{onGesture(true);gesture=true;scale=event.scale||1;event.preventDefault();};
    const change=event=>{event.preventDefault();if(touchPinch)return;const next=event.scale||1;zoom(next/scale);scale=next;};
    const end=event=>{event.preventDefault();gesture=false;scale=1;if(!touchPinch)onGesture(false);};
    const pair=touches=>{const [a,b]=touches,r=viewport.getBoundingClientRect();return {distance:Math.hypot(b.clientX-a.clientX,b.clientY-a.clientY),anchor:{x:(a.clientX+b.clientX)/2-r.left,y:(a.clientY+b.clientY)/2-r.top}};};
    const touchStart=event=>{if(event.touches.length!==2)return;event.preventDefault();touchPinch=pair(event.touches);onGesture(true);};
    const touchMove=event=>{if(!touchPinch||event.touches.length!==2)return;event.preventDefault();const next=pair(event.touches);if(touchPinch.distance>0&&next.distance>0)zoom(next.distance/touchPinch.distance,next.anchor);touchPinch=next;};
    const touchEnd=event=>{if(!touchPinch)return;event.preventDefault();if(event.touches.length<2){touchPinch=null;onGesture(false);}};
    viewport.addEventListener('wheel',wheel,{passive:false,capture:true});
    viewport.addEventListener('gesturestart',start,{passive:false});viewport.addEventListener('gesturechange',change,{passive:false});viewport.addEventListener('gestureend',end,{passive:false});
    for(const [name,fn] of [['touchstart',touchStart],['touchmove',touchMove],['touchend',touchEnd],['touchcancel',touchEnd]])viewport.addEventListener(name,fn,{passive:false});
    return ()=>{for(const [name,fn] of [['touchstart',touchStart],['touchmove',touchMove],['touchend',touchEnd],['touchcancel',touchEnd]])viewport.removeEventListener(name,fn);viewport.removeEventListener('wheel',wheel,true);viewport.removeEventListener('gesturestart',start);viewport.removeEventListener('gesturechange',change);viewport.removeEventListener('gestureend',end);};
}
