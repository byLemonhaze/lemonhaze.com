import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldLimits, containField, overviewCamera, settleFieldSquash, fieldPressure, fieldThrow, stepJuicyField } from '../src/immersive/field-physics.js';
import { zoomCamera } from '../src/immersive/zoom.js';
import { artworkMetadata } from '../src/immersive/metadata.js';

const bounds={left:-7210,right:7400,top:-7000,bottom:7300};
test('a juicy throw uses recent release velocity, with stale holds and extreme spikes bounded',()=>{
    assert.deepEqual(fieldThrow([{x:0,y:0,t:0},{x:100,y:40,t:50},{x:200,y:80,t:100}],100),{x:2700,y:1080});
    assert.deepEqual(fieldThrow([{x:0,y:0,t:0},{x:100,y:40,t:50}],200),{x:0,y:0});
    assert.equal(fieldThrow([{x:0,y:0,t:0},{x:1000,y:0,t:10}],10).x,4000);
});
test('juicy travel retains momentum, stays contained and agrees at different frame rates',()=>{
    const limits={minX:0,maxX:1000,minY:0,maxY:600};
    const initial={x:500,y:300,vx:1800,vy:-600,squash:0,squashVelocity:0};
    const simulate=rate=>{const state={...initial};for(let i=0;i<rate*3;i++){
        stepJuicyField(state,limits,1/rate);
        assert.ok(state.x>=0&&state.x<=1000&&state.y>=0&&state.y<=600);
        assert.ok(Number.isFinite(state.squash)&&Math.abs(state.squash)<=.3);
    }return state;};
    const a=simulate(30),b=simulate(120);
    assert.ok(Math.hypot(a.vx,a.vy)>200,'a throw should still travel after three seconds');
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.01,'frame rate must not change the trajectory');
});
test('the overview remains fully contained at every edge, including soft deformation',()=>{
    for(const [width,height] of [[1440,900],[390,844],[844,390]]){
        const initial=overviewCamera(bounds,width,height);
        for(const squash of [-.3,-.15,0,.15,.3])for(const direction of [-1,1]){
            const camera={...initial,x:direction*1e5,y:direction*1e5},velocity={x:direction*25,y:direction*20};
            const limits=fieldLimits(bounds,width,height,camera.zoom,squash);
            assert.ok(limits.fits);
            containField(camera,velocity,limits);
            assert.equal(Math.sign(velocity.x),-direction);assert.equal(Math.sign(velocity.y),-direction);
            assert.ok(camera.x+bounds.left*camera.zoom*limits.sx>=24-1e-8);
            assert.ok(camera.x+bounds.right*camera.zoom*limits.sx<=width-24+1e-8);
            assert.ok(camera.y+bounds.top*camera.zoom*limits.sy>=(width<700?120:90)-1e-8);
            assert.ok(camera.y+bounds.bottom*camera.zoom*limits.sy<=height-80+1e-8);
        }
    }
});
test('normal landing keeps free panning and reduced motion suppresses bounce',()=>{
    assert.equal(fieldLimits(bounds,1440,900,1).fits,false);
    const camera=overviewCamera(bounds,1440,900),velocity={x:25,y:0};camera.x=1e5;
    containField(camera,velocity,fieldLimits(bounds,1440,900,camera.zoom),false);
    assert.equal(Math.abs(velocity.x),0);
});
test('each work reflection takes priority over shared collection descriptions',()=>{
    const work={id:'example',collection:'Confabulation',description:'Shared collection',year:2026};
    assert.equal(artworkMetadata({...work,reflection:'The initial rupture; perception and orientation begin to fail.'}).description,'The initial rupture; perception and orientation begin to fail.');
    assert.equal(artworkMetadata({...work,reflection:'The mind supplies what the eyes can no longer receive.'}).description,'The mind supplies what the eyes can no longer receive.');
    assert.equal(artworkMetadata(work).description,'Shared collection');
});

test('zoom out continues below fit on narrow mobile screens',()=>{
    const camera=overviewCamera(bounds,390,844),min=Math.min(.025,camera.zoom*.65);
    assert.ok(zoomCamera(camera,1/1.2,{x:195,y:422},min).zoom<camera.zoom);
});

test('strong field impacts visibly squash and rebound with a settling wobble',()=>{
    const camera=overviewCamera(bounds,1440,900),velocity={x:25,y:0};camera.x=1e5;
    const impact=containField(camera,velocity,fieldLimits(bounds,1440,900,camera.zoom));
    assert.ok(impact>=.15);assert.equal(velocity.x,-21.5);
    let spring={value:impact,velocity:0},rebounded=false;
    for(let i=0;i<120;i++){spring=settleFieldSquash(spring.value,spring.velocity,1/60);rebounded ||= spring.value<-.01;}
    assert.ok(rebounded);assert.ok(Math.abs(spring.value)<.0001);
    const whole=settleFieldSquash(.18,0,1),half=settleFieldSquash(.18,0,.5),two=settleFieldSquash(half.value,half.velocity,.5);
    assert.ok(Math.abs(whole.value-two.value)<1e-10);
});

test('pressure is proportional to the held grab position, not velocity or elapsed time',()=>{
    const camera=overviewCamera(bounds,1440,900),limits=fieldLimits(bounds,1440,900,camera.zoom);
    const gentle=fieldPressure({...camera,x:limits.maxX+40},limits);
    const firm=fieldPressure({...camera,x:limits.maxX+160},limits);
    assert.equal(gentle.axis,'x');assert.equal(gentle.side,1);
    assert.ok(firm.squash>gentle.squash&&firm.squash<=.3);
    for(let i=0;i<100;i++)assert.deepEqual(fieldPressure({...camera,x:limits.maxX+40},limits),gentle);
    assert.equal(fieldPressure(camera,limits).squash,0);
    assert.equal(fieldPressure({...camera,y:limits.minY-100},limits).axis,'y');
    assert.ok(fieldPressure({...camera,y:limits.minY-100},limits).squash<0);
    assert.equal(fieldPressure(camera,fieldLimits(bounds,1440,900,1)).squash,0);
});
