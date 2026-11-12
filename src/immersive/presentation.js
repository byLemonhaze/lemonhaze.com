// A shared mat surrounds the artwork, independent of its native aspect ratio.
export function fitArtwork(width,height,ratio) {
    const padding=Math.min(28,Math.max(12,width*.045),width/4,height/4);
    const artWidth=Math.max(1,Math.min(width-padding*2,(height-padding*2)*ratio));
    const artHeight=artWidth/ratio;
    return {width:artWidth,height:artHeight,frameWidth:artWidth+padding*2,frameHeight:artHeight+padding*2,padding};
}
