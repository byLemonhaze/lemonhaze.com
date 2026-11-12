// Critically damped motion preserves velocity between inputs without oscillating.
export const GALLERY_SETTLE_RATE=15;
export function settleGallery(position,velocity,target,seconds,rate=GALLERY_SETTLE_RATE) {
    const distance=position-target,impulse=velocity+rate*distance,decay=Math.exp(-rate*seconds);
    return {position:target+(distance+impulse*seconds)*decay,velocity:(velocity-rate*impulse*seconds)*decay};
}

// Release projects only a short distance; a deliberate small swipe still
// advances, while a held or cancelled grab settles at the nearest artwork.
export function releaseGallery(position,start,velocity,distance,cancelled=false) {
    if(cancelled)return Math.round(position);
    let target=Math.round(position+Math.max(-.8,Math.min(.8,velocity*.16)));
    if(target===Math.round(start)&&Math.abs(distance)>55)target+=Math.sign(position-start);
    return target;
}

// Virtual slots continue past both ends; each work keeps one nearby mount.
export const galleryIndex=(slot,count)=>count?((slot%count)+count)%count:0;
export const nearestGallerySlot=(index,position,count)=>index+Math.round((position-index)/count)*count;
export function galleryNeighbors(position,count) {
    const nearby=new Map();
    for(let slot=Math.floor(position)-2;slot<=Math.ceil(position)+2;slot++){
        const index=galleryIndex(slot,count),previous=nearby.get(index);
        if(previous===undefined||Math.abs(slot-position)<Math.abs(previous-position))nearby.set(index,slot);
    }
    return nearby;
}
