import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCart, cartSummary, prepareCheckout, PRODUCTS, OFFERS, money } from '../src/shop/catalog.js';
test('stored baskets reject unknown products and invalid quantities', () => {
 assert.deepEqual(normalizeCart({ 'print1:signed': 2, 'print2:signed': -1, 'print3:signed': 0.5, 'print4:signed': '3', 'print5:signed': 100, injected: 4 }), { 'print5:signed': 3, 'print1:signed': 2 });
 for (const value of [null, [], 'bad']) assert.deepEqual(normalizeCart(value), {});
});
test('totals come from catalogue prices and include quantities', () => {
 assert.equal(PRODUCTS.length, 18);
 const summary = cartSummary({ 'print1:signed': 2, 'print6:signed': 1, bogus: 10 });
 assert.equal(summary.count, 3);
 assert.equal(summary.subtotal, 150000);
 assert.equal(money(summary.subtotal), '$1,500.00');
});
test('all supported checkout paths remain previews without payment requests', () => {
 for (const method of ['stripe', 'btc', 'usdc']) {
  const draft = prepareCheckout({ 'print3:signed': 1 }, method);
  assert.equal(draft.payable, false);
  assert.equal(draft.mode, 'preview');
  assert.equal(draft.subtotalCents, 50000);
  assert.equal(draft.shippingCents, null);
  assert.equal(draft.taxCents, null);
 }
 assert.throws(() => prepareCheckout({}, 'stripe'), /empty/);
 assert.throws(() => prepareCheckout({print1: 1}, 'unknown'), /supported/);
});

test('withdrawn unsigned baskets are discarded without upgrading the price', () => {
 const summary = cartSummary({ 'print1:normal': 2, print2: 1, 'print1:signed': 1 });
 assert.equal(summary.count, 1);
 assert.equal(summary.subtotal, 50000);
 assert.deepEqual(summary.items.map(p => [p.offerId,p.priceCents]), [['signed',50000]]);
 assert.throws(()=>prepareCheckout({'print1:normal':1,print2:1},'stripe'),/empty/);
});
test('all nine print on-chain offers are unavailable even in a tampered stored basket', () => {
 assert.equal(OFFERS.find(o=>o.id==='onchain').available,false);
 for (const p of PRODUCTS) {
  assert.deepEqual(normalizeCart({[`${p.id}:onchain`]:1}),{});
  assert.throws(()=>prepareCheckout({[`${p.id}:onchain`]:1},'usdc'),/empty/);
 }
 assert.deepEqual(normalizeCart({'print1:normal':1,'print1:onchain':1,'print1:madeup':1}),{});
});
test('legacy unsigned selections are removed and signed quantities remain capped', () => {
 const migrated = normalizeCart({print1:2,'print1:normal':3,'print2:signed':30});
 assert.deepEqual(migrated,{'print2:signed':3});
 assert.deepEqual(normalizeCart(migrated),migrated);
});

test('withdrawn prints are removed from legacy and variant baskets', () => {
 assert.deepEqual(PRODUCTS.map(p=>p.id), ['print6','print5','print4','print3','print2','print1','print10','print11','print12','textile1','textile2','textile3','textile4','textile5','textile6','textile7','textile8','textile9']);
 assert.deepEqual(normalizeCart({print7:1, 'print8:normal':2, 'print9:signed':1, 'print6:signed':1}), {'print6:signed':1});
});
test('signed editions are limited to three per artwork with unsigned prints unavailable', () => {
 assert.equal(OFFERS.find(o=>o.id==='signed').editionLimit,3);
 const cart = normalizeCart({'print1:signed':9,'print2:signed':3,'print1:normal':10});
 assert.deepEqual(cart, {'print2:signed':3,'print1:signed':3});
 assert.equal(cartSummary(cart).items.find(p=>p.key==='print1:signed').maxQuantity,3);
 assert.equal(prepareCheckout(cart,'stripe').items.find(p=>p.offerId==='signed').quantity,3);
});

test('textile basket includes certificate at $800 and cannot select print offers or multiple copies',()=>{
 const summary=cartSummary({'textile1:signed':4,'textile2:signed':1,'textile3:normal':1,'print10:signed':1});
 assert.equal(summary.count,3);assert.equal(summary.subtotal,210000);
 assert.equal(summary.items.find(p=>p.id==='textile1').maxQuantity,1);
 assert.equal(summary.items.find(p=>p.id==='textile1').editionLimit,undefined);
});
test('every available storefront variant agrees with server prices and bundled artwork exists',async()=>{
 const {CATALOG,validateCart}=await import('../server/shop/catalog.js');
 const {offersFor}=await import('../src/shop/catalog.js');
 const {existsSync}=await import('node:fs');
 for(const p of PRODUCTS){
  assert.equal(CATALOG[p.id].name,p.title);
  for(const offer of offersFor(p).filter(o=>o.available))assert.equal(validateCart([{productId:p.id,offerId:offer.id,quantity:1}]).subtotal,offer.priceCents);
  for(const asset of [p.preview,p.original])assert.ok(existsSync(new URL(`../public${asset}`,import.meta.url)),asset);
 }
});

test('textile measurements match the artist captions in width-height order',()=>{
 const textiles=PRODUCTS.filter(p=>p.type==='textile');
 assert.deepEqual(textiles.map(p=>p.sizeCm),[[11,15],[18.5,23],[10,12],[11.5,13],[11,22],[18.5,18.5],[10.7,13],[14.5,10.5],[11.5,17]]);
 assert.equal(textiles[0].preview,'/shop/textiles/textile1-v2.webp');
});

test('every curated print has three bundled scenes matched to its composition',async()=>{
 const {mockups}=await import('../src/shop/mockups.js');
 const {existsSync}=await import('node:fs');
 const prints=PRODUCTS.filter(p=>p.type==='print');
 assert.equal(Object.keys(mockups).length,18);
 for(const p of prints){
  assert.equal(mockups[p.id].length,3,p.id);
  for(const scene of mockups[p.id]){
   assert.equal(scene.seed,p.seed);
   assert.ok(existsSync(new URL(`../public/shop/${scene.file}`,import.meta.url)),scene.file);
  }
 }
});
