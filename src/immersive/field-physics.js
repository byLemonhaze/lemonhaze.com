// Contain the complete field only when it fits. Normal close-up panning is unchanged.
export function fieldLimits(bounds, width, height, zoom, squash = 0) {
    let sx = 1 - squash, sy = 1 + squash;
    const mobile = width < 700;
    const left = mobile ? 14 : 24, right = width - left, top = mobile ? 120 : 90, bottom = height - 80;
    const fits = (bounds.right-bounds.left)*zoom*1.025 <= right-left && (bounds.bottom-bounds.top)*zoom*1.025 <= bottom-top;
    // Expansion yields to the opposite walls: the entire deformed field stays visible.
    if(fits){sx=Math.min(sx,(right-left)/((bounds.right-bounds.left)*zoom));sy=Math.min(sy,(bottom-top)/((bounds.bottom-bounds.top)*zoom));}
    return { fits, mobile, sx: fits?sx:1, sy: fits?sy:1,
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
    return {squash:balance*Math.min(.3,Math.abs(distance)*(limits.mobile?.0045:.0015)),axis,side:Math.sign(distance)};
}

// Juicy overview tuning, chosen in the local interaction lab. Positions use
// resting bounds; the visual squash never feeds back into collision velocity.
export const JUICY_FIELD = Object.freeze({gain:1.35,drag:.34,bounce:.89,softness:.22});
export function fieldThrow(samples,now) {
    const recent=samples.filter(sample=>now-sample.t<110),first=recent[0],last=recent.at(-1);
    if(recent.length<2||now-last.t>90)return {x:0,y:0};
    const seconds=Math.max(.012,(now-first.t)/1000);
    const speed=axis=>Math.max(-4000,Math.min(4000,(last[axis]-first[axis])/seconds*JUICY_FIELD.gain));
    return {x:speed('x'),y:speed('y')};
}
export function stepJuicyField(state,limits,seconds) {
    // A phone may have only 40px of sideways travel. Desktop throw speeds
    // would ricochet across it several times per frame. Give each rebound
    // time to read, and scale its deformation to the available travel.
    const mobile=limits.mobile;
    const speedX=mobile?Math.max(0,limits.maxX-limits.minX)/.24:Infinity;
    const speedY=mobile?Math.max(0,limits.maxY-limits.minY)/.24:Infinity;
    if(mobile){
        state.vx=Math.max(-speedX,Math.min(speedX,state.vx));
        state.vy=Math.max(-speedY,Math.min(speedY,state.vy));
    }
    let remaining=seconds;
    while(remaining>1e-9){
        const dt=Math.min(1/240,remaining);remaining-=dt;
        const damping=Math.exp(-(mobile?.55:JUICY_FIELD.drag)*dt);
        state.vx*=damping;state.vy*=damping;
        state.x+=state.vx*dt;state.y+=state.vy*dt;
        for(const [axis,velocity,min,max,sign] of [['x','vx',limits.minX,limits.maxX,1],['y','vy',limits.minY,limits.maxY,-1]]){
            if(state[axis]<min&&state[velocity]<0||state[axis]>max&&state[velocity]>0){
                const strength=mobile ? .2*Math.min(1,Math.abs(state[velocity])/Math.max(1,axis==='x'?speedX:speedY)) : Math.min(JUICY_FIELD.softness,Math.abs(state[velocity])/6500);
                state.squashVelocity+=sign*strength*32;
                state[velocity]*=-(mobile?.84:JUICY_FIELD.bounce);
                state[axis]=state[axis]<min?min+(min-state[axis]):max-(state[axis]-max);
            }
            state[axis]=Math.max(min,Math.min(max,state[axis]));
        }
        state.squashVelocity+=(-360*state.squash-16*state.squashVelocity)*dt;
        state.squash=Math.max(-.3,Math.min(.3,state.squash+state.squashVelocity*dt));
    }
    if(Math.hypot(state.vx,state.vy)<5)state.vx=state.vy=0;
    return state;
}
