// Contain the complete field only when it fits. Normal close-up panning is unchanged.
export function fieldLimits(bounds, width, height, zoom, squash = 0) {
    let sx = 1 - squash, sy = 1 + squash;
    const left = 24, right = width - 24, top = width < 700 ? 120 : 90, bottom = height - 80;
    const fits = (bounds.right-bounds.left)*zoom*1.025 <= right-left && (bounds.bottom-bounds.top)*zoom*1.025 <= bottom-top;
    // Expansion yields to the opposite walls: the entire deformed field stays visible.
    if(fits){sx=Math.min(sx,(right-left)/((bounds.right-bounds.left)*zoom));sy=Math.min(sy,(bottom-top)/((bounds.bottom-bounds.top)*zoom));}
    return { fits, sx: fits?sx:1, sy: fits?sy:1,
        minX: fits ? left-bounds.left*zoom*sx : -bounds.right*zoom+width*.25,
        maxX: fits ? right-bounds.right*zoom*sx : -bounds.left*zoom+width*.75,
        minY: fits ? top-bounds.top*zoom*sy : -bounds.bottom*zoom+height*.25,
        maxY: fits ? bottom-bounds.bottom*zoom*sy : -bounds.top*zoom+height*.75 };
}
export function containField(camera, velocity, limits, bounce = true) {
    let impact = 0;
    for (const [axis,min,max] of [['x',limits.minX,limits.maxX],['y',limits.minY,limits.maxY]]) {
        const before = camera[axis];
        camera[axis] = Math.max(min,Math.min(max,before));
        if (camera[axis] !== before && limits.fits) {
            const outward = (before < min && velocity[axis] < 0) || (before > max && velocity[axis] > 0);
            if(bounce&&outward)impact += (axis==='x'?1:-1)*Math.min(.18,Math.abs(velocity[axis])*.008);
            if(outward)velocity[axis] *= bounce ? -.86 : 0;
        }
    }
    return impact;
}
export function overviewCamera(bounds,width,height) {
    const top=width<700?120:90,bottom=height-80;
    const zoom=Math.min((width-64)/(bounds.right-bounds.left),(bottom-top-30)/(bounds.bottom-bounds.top))/1.025;
    return {zoom,x:width/2-(bounds.left+bounds.right)/2*zoom,y:(top+bottom)/2-(bounds.top+bounds.bottom)/2*zoom};
}

// An underdamped spring lets an impact squash, rebound, then gently wobble to rest.
export function settleFieldSquash(value,velocity,seconds) {
    const damping=8,frequency=11,decay=Math.exp(-damping*seconds);
    const a=value,b=(velocity+damping*value)/frequency,c=Math.cos(frequency*seconds),s=Math.sin(frequency*seconds);
    return {value:decay*(a*c+b*s),velocity:decay*((b*frequency-damping*a)*c-(a*frequency+damping*b)*s)};
}

// Use the unbounded grab position, not the clamped/rendered camera. Pressure
// remains present while the pointer is held still beyond the resting wall.
export function fieldPressure(desired,limits) {
    if(!limits.fits)return {squash:0,axis:null,side:0};
    const x=desired.x-Math.max(limits.minX,Math.min(limits.maxX,desired.x));
    const y=desired.y-Math.max(limits.minY,Math.min(limits.maxY,desired.y));
    const axis=Math.abs(x)>=Math.abs(y)?'x':'y',distance=axis==='x'?x:y;
    if(!distance)return {squash:0,axis:null,side:0};
    const total=Math.abs(x)+Math.abs(y);
    const balance=(Math.abs(x)-Math.abs(y))/total;
    return {squash:balance*Math.min(.3,Math.abs(distance)*.0015),axis,side:Math.sign(distance)};
}
