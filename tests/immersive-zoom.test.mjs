import test from 'node:test';
import assert from 'node:assert/strict';
import { bindPinchZoom, zoomCamera, zoomFactorForWheel } from '../src/immersive/zoom.js';

test('trackpad wheel pinch zooms in and out around the same anchor without drift',()=>{
    const camera={x:400,y:300,zoom:1},anchor={x:270,y:190};
    const closer=zoomCamera(camera,zoomFactorForWheel(-25),anchor);
    const farther=zoomCamera(closer,zoomFactorForWheel(25),anchor);
    assert.ok(closer.zoom>camera.zoom);
    for(const key of ['x','y','zoom'])assert.ok(Math.abs(farther[key]-camera[key])<1e-9);
    assert.ok(zoomCamera(camera,zoomFactorForWheel(25),anchor).zoom<1);
    assert.equal(zoomCamera(camera,1000,anchor).zoom,1.7);
    assert.equal(zoomCamera(camera,.00001,anchor).zoom,.025);
});

test('both browser pinch event paths share zoom and release every listener',()=>{
    const handlers=new Map(),calls=[];
    const viewport={clientHeight:800,getBoundingClientRect:()=>({left:10,top:20}),addEventListener:(type,fn)=>handlers.set(type,fn),removeEventListener:(type,fn)=>{assert.equal(handlers.get(type),fn);handlers.delete(type);}};
    const dispose=bindPinchZoom(viewport,(factor,anchor)=>calls.push({factor,anchor}));
    const event=overrides=>({ctrlKey:true,metaKey:false,deltaY:20,deltaMode:0,clientX:100,clientY:140,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...overrides});
    const out=event({});handlers.get('wheel')(out);assert.ok(calls.at(-1).factor<1);assert.ok(out.prevented&&out.stopped);
    handlers.get('wheel')(event({deltaY:-20}));assert.ok(calls.at(-1).factor>1);assert.deepEqual(calls.at(-1).anchor,{x:90,y:120});
    const length=calls.length;handlers.get('wheel')(event({ctrlKey:false}));handlers.get('wheel')(event({metaKey:true}));assert.equal(calls.length,length);
    handlers.get('gesturestart')(event({scale:1}));handlers.get('gesturechange')(event({scale:.8}));assert.equal(calls.at(-1).factor,.8);
    handlers.get('gesturechange')(event({scale:1}));assert.equal(calls.at(-1).factor,1.25);
    const before=calls.length;handlers.get('wheel')(event({}));assert.equal(calls.length,before,'Do not apply Safari gesture and wheel twice');
    handlers.get('gestureend')(event({}));handlers.get('wheel')(event({}));assert.equal(calls.length,before+1);
    dispose();assert.equal(handlers.size,0);
});

test('two-touch pinch changes only the field camera and prevents native page zoom',()=>{
 const handlers=new Map(),calls=[],states=[];
 const viewport={getBoundingClientRect:()=>({left:0,top:0}),addEventListener:(type,fn)=>handlers.set(type,fn),removeEventListener:type=>handlers.delete(type)};
 const dispose=bindPinchZoom(viewport,(factor,anchor)=>calls.push({factor,anchor}),active=>states.push(active));
 const event=points=>({touches:points.map(([clientX,clientY])=>({clientX,clientY})),preventDefault(){this.prevented=true;}});
 const start=event([[100,300],[200,300]]);handlers.get('touchstart')(start);assert.ok(start.prevented);
 const into=event([[50,300],[250,300]]);handlers.get('touchmove')(into);assert.ok(into.prevented);assert.equal(calls.at(-1).factor,2);
 const out=event([[100,300],[200,300]]);handlers.get('touchmove')(out);assert.equal(calls.at(-1).factor,.5);assert.deepEqual(calls.at(-1).anchor,{x:150,y:300});
 handlers.get('touchend')(event([]));assert.deepEqual(states,[true,false]);dispose();assert.equal(handlers.size,0);
});
