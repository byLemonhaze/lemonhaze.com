import test from 'node:test';
import assert from 'node:assert/strict';
import { fitArtwork } from '../src/immersive/presentation.js';
import { settleGallery, galleryIndex, galleryNeighbors, nearestGallerySlot, releaseGallery } from '../src/immersive/gallery-motion.js';
import { browsingSource,thumbnailSource } from '../src/immersive/model.js';
import { printPreviews } from '../src/curation/selection.js';

test('square, portrait and landscape artworks share equal mat edges without changing aspect ratio',()=>{
    for(const [width,height] of [[686,684],[286,363]])for(const ratio of [1,9/16,16/9,2/3]){
        const fit=fitArtwork(width,height,ratio);
        assert.ok(Math.abs(fit.width/fit.height-ratio)<1e-10);
        assert.ok(fit.frameWidth<=width+1e-8&&fit.frameHeight<=height+1e-8);
        assert.ok(Math.abs((fit.frameWidth-fit.width)/2-fit.padding)<1e-10);
        assert.ok(Math.abs((fit.frameHeight-fit.height)/2-fit.padding)<1e-10);
    }
});
test('gallery settling is frame-rate independent and comes to rest without overshoot',()=>{
    const sample=hz=>{let value={position:0,velocity:0};for(let i=0;i<hz;i++)value=settleGallery(value.position,value.velocity,1,1/hz);return value;};
    const a=sample(60),b=sample(120);
    assert.ok(Math.abs(a.position-b.position)<1e-10);
    assert.ok(a.position>.999&&a.position<=1);
    let value={position:0,velocity:0};for(let i=0;i<120;i++){value=settleGallery(value.position,value.velocity,1,1/120);assert.ok(value.position<=1);}
});
test('Impossible Folds uses its sharp display preview at landing size and a tiny thumbnail in the overview',()=>{
    const work=printPreviews.find(work=>work.id==='shop-print6');
    assert.equal(browsingSource(work,1,512),'/shop/impossible-folds-2026-11-04/impossible-folds-01.webp');
    assert.equal(browsingSource(work,.05,512),thumbnailSource(work));
});

test('gallery wraps in both directions with adjacent slots and no repeated mounts',()=>{
    assert.equal(galleryIndex(-1,8),7);
    assert.equal(galleryIndex(8,8),0);
    assert.equal(nearestGallerySlot(0,7.8,8),8);
    assert.equal(nearestGallerySlot(7,-.2,8),-1);
    for(const count of [1,2,3,8,421])for(const position of [-1.1,0,count-.1,count+1.1]){
        const nearby=galleryNeighbors(position,count);
        assert.ok(nearby.has(galleryIndex(Math.round(position),count)));
        assert.ok(nearby.size<=Math.min(count,6));
        for(const [index,slot] of nearby){assert.equal(galleryIndex(slot,count),index);assert.ok(Math.abs(slot-position)<3);}
    }
});


test('gallery release distinguishes a flick, a held drag and cancellation',()=>{
    assert.equal(releaseGallery(.2,0,3,80),1);
    assert.equal(releaseGallery(.1,0,0,20),0);
    assert.equal(releaseGallery(-.2,0,-3,-80),-1);
    assert.equal(releaseGallery(1.6,0,0,1000),2);
    assert.equal(releaseGallery(.2,0,3,80,true),0);
    assert.equal(releaseGallery(.7,0,0,450,true),1);
});
