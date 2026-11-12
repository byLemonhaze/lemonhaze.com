import { workYear } from './model.js';
import preservedCore from './core-placements.json' with { type: 'json' };
import lemonOutline from './lemon-outline.json' with { type: 'json' };

export const CORE_PLACEMENTS = [
    [-300,-80,390,510], [300,-380,290,420], [680,100,370,340],
    [200,190,360,360], [-740,210,370,300], [-225,650,280,380],
    [-650,-600,350,330], [-165,-730,440,440],
];
const SEPARATED = new Map([['Lagom',[-1000,-340]],['Wu Wei',[850,-710]],['Ikigai',[140,1050]]]);
const LARGE = new Set(['BEST BEFORE','Manufactured']);
export function presentationSize(work) {
    const dimensions=String(work.dimensions||'').match(/(\d+)\s*[x×]\s*(\d+)/i);
    const ratio=dimensions ? Number(dimensions[1])/Number(dimensions[2])
        : work.collection==='Impossible Folds'||work.collection==='BEST BEFORE' ? 9/16 : 1;
    const height=Math.min(310,270/ratio);
    return [height*ratio,height];
}
// Sample the actual emoji silhouette, including its uneven body, tip and leaf.
// Only placement coordinates use this outline; artwork pixels are never changed.
export function lemonContains(x,y,scale) {
    const px=x/scale+lemonOutline.center[0],py=Math.floor(y/scale+lemonOutline.center[1]);
    return (lemonOutline.rows[py]||[]).some(([left,right])=>px>=left&&px<right);
}
export function buildExploreLayout(works) {
    const placements=new Map(), layerRadii=new Map(), occupied=[], buckets=new Map();
    const nearby = (x,y,w,h) => {
        const found=new Set();
        for(let bx=Math.floor((x-w/2-34)/400);bx<=Math.floor((x+w/2+34)/400);bx++)
            for(let by=Math.floor((y-h/2-34)/400);by<=Math.floor((y+h/2+34)/400);by++)
                for(const point of buckets.get(`${bx},${by}`)||[])found.add(point);
        return found;
    };
    const blocked=p=>[...nearby(...p)].some(q=>Math.abs(p[0]-q[0])<(p[2]+q[2])/2+34 && Math.abs(p[1]-q[1])<(p[3]+q[3])/2+34);
    function place(work,p) {
        placements.set(work.id,p);occupied.push(p);
        for(let bx=Math.floor((p[0]-p[2]/2)/400);bx<=Math.floor((p[0]+p[2]/2)/400);bx++)
            for(let by=Math.floor((p[1]-p[3]/2)/400);by<=Math.floor((p[1]+p[3]/2)/400);by++){
                const key=`${bx},${by}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(p);
            }
    }
    works.slice(0,8).forEach((work,index)=>place(work,[...CORE_PLACEMENTS[index]]));
    // The artist approved this landing region through Minute, papillon!.
    // Keep its exact coordinates and presentation sizes as the archive expands.
    for(const work of works)if(preservedCore[work.id]&&!placements.has(work.id))place(work,[...preservedCore[work.id]]);
    for(const work of works)if(work.collection==='Chrysalis'&&SEPARATED.has(work.name)&&!placements.has(work.id))
        place(work,[...SEPARATED.get(work.name),...presentationSize(work)]);
    const side=Math.ceil(Math.sqrt(works.length)*1.35)+8,grid=[];
    for(let row=-side;row<=side;row++)for(let column=-side;column<=side;column++){
        const x=column*330+(Math.abs(row)%2)*165,y=row*350;
        if(Math.hypot(x,y)>800&&!blocked([x,y,270,310]))grid.push({x,y,r:Math.hypot(x,y),used:false});
    }
    // Fit the existing archive into the emoji outline. A small reserve allows
    // collection separation/year boundaries without changing any fixed work.
    const needed=works.length-placements.size+32;
    let low=1,high=400;
    for(let i=0;i<18;i++){
        const scale=(low+high)/2;
        if(grid.filter(c=>lemonContains(c.x,c.y,scale)).length>=needed)high=scale;else low=scale;
    }
    const candidates=grid.filter(c=>lemonContains(c.x,c.y,high));
    candidates.sort((a,b)=>a.r-b.r || Math.atan2(a.y,a.x)-Math.atan2(b.y,b.x));
    function next(work,minRadius=0,avoid=[]) {
        const size=presentationSize(work);
        const candidate=candidates.find(c=>!c.used&&c.r>=minRadius&&avoid.every(p=>Math.hypot(c.x-p[0],c.y-p[1])>900)&&!blocked([c.x,c.y,...size]));
        if(!candidate)throw new Error('Explore layout exhausted');
        candidate.used=true;layerRadii.set(work.id,candidate.r);const p=[candidate.x,candidate.y,...size];place(work,p);return p;
    }
    // Two distinct works from each large collection may sit near the core,
    // separated from each other. Their remaining works begin farther out.
    for(const collection of LARGE){const anchors=works.filter(w=>w.collection===collection&&placements.has(w.id)&&Math.hypot(...placements.get(w.id).slice(0,2))<2200).map(w=>placements.get(w.id));
        for(const work of works.filter(w=>w.collection===collection&&!placements.has(w.id)&&/Nº\d+/.test(w.name)).slice(0,Math.max(0,2-anchors.length)))anchors.push(next(work,1050,anchors));
    }
    // All twenty-five Gentlemen belong in the inner half, outside the fixed landing.
    for(const work of works.filter(w=>w.collection==='Gentlemen'&&!placements.has(w.id)))next(work,2500);
    const rest=works.filter(work=>!placements.has(work.id));
    const years=[...new Set(rest.map(work=>Number(workYear(work))||2023))].sort((a,b)=>b-a);
    let yearFloor=0;
    for(const year of years){
        let outerRadius=yearFloor;
        const groups=new Map();
        for(const work of rest.filter(work=>(Number(workYear(work))||2023)===year).sort((a,b)=>String(b.timestamp||'').localeCompare(String(a.timestamp||'')))){
            if(!groups.has(work.collection))groups.set(work.collection,[]);groups.get(work.collection).push(work);
        }
        // Round-robin series within each year avoids one collection occupying
        // every neighbouring slot when several series are available.
        while([...groups.values()].some(group=>group.length))for(const group of groups.values()){
            const work=group.shift();if(work){const p=next(work,Math.max(yearFloor,LARGE.has(work.collection)?2200:0));outerRadius=Math.max(outerRadius,layerRadii.get(work.id));}
        }
        yearFloor=Math.max(yearFloor,outerRadius-350);
    }
    const points=[...placements.values()];
    return {placements,bounds:{left:Math.min(...points.map(p=>p[0]-p[2]/2)),right:Math.max(...points.map(p=>p[0]+p[2]/2)),top:Math.min(...points.map(p=>p[1]-p[3]/2)),bottom:Math.max(...points.map(p=>p[1]+p[3]/2))}};
}
