import test from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {localDatabase} from '../server/shop/local-db.js';
import {validateCart} from '../server/shop/catalog.js';
import {handleShop} from '../server/shop/handler.js';
import {reserveOrder,ownedOrder} from '../server/shop/store.js';
import {settings} from '../server/shop/config.js';
import {checkoutParams,reconcileSession} from '../server/shop/stripe.js';
import {verifyHuman} from '../server/shop/http.js';
import {deliverReviewAlerts} from '../server/shop/alerts.js';
import {reconcileOutstanding,runMaintenance} from '../server/shop/maintenance.js';

const cart=[{productId:'print1',offerId:'signed',quantity:1}];
function harness(t){
  const db=localDatabase();t.after(()=>db.close());
  const env={SHOP_STOREFRONT_OPEN:'true',SHOP_DB:db,SHOP_MODE:'test',SHOP_ORIGIN:'http://127.0.0.1:5173',STRIPE_SECRET_KEY:'sk_test_mock',STRIPE_WEBHOOK_SECRET:'whsec_test_mock',SHOP_RATE_SECRET:'testing-only-'.repeat(4)};
  const sessions=new Map(),byIdempotency=new Map();let creates=0,expirationFailure=false;
  const sdk=new Stripe('sk_test_mock');
  const stripe={webhooks:sdk.webhooks,checkout:{sessions:{
    async create(params,options){
      if(byIdempotency.has(options.idempotencyKey))return byIdempotency.get(options.idempotencyKey);
      creates++;const id=`cs_test_${creates}`;
      const subtotal=params.line_items.reduce((n,i)=>n+i.quantity*i.price_data.unit_amount,0);
      const shipping=params.shipping_options[0].shipping_rate_data.fixed_amount.amount;
      const session={id,url:`https://checkout.stripe.com/c/pay/${id}`,client_reference_id:params.client_reference_id,metadata:params.metadata,livemode:false,status:'open',payment_status:'unpaid',currency:'usd',amount_subtotal:subtotal,amount_total:subtotal+shipping,total_details:{amount_tax:0,amount_shipping:shipping,amount_discount:0}};
      sessions.set(id,session);byIdempotency.set(options.idempotencyKey,session);return session;
    },
    async retrieve(id){if(!sessions.has(id))throw new Error('Unknown session');return sessions.get(id);},
    async expire(id){if(expirationFailure)throw new Error('Simulated timeout');const s=sessions.get(id);if(s.status!=='open')throw new Error('Already complete');s.status='expired';return s;}
  }}};
  const request=async(path,{body,cookie,origin='http://127.0.0.1:5173',method=body?'POST':'GET',headers={}}={})=>handleShop(new Request(`http://127.0.0.1:5173/api/shop/${path}`,{method,headers:{'cf-connecting-ip':cookie||'test-config',...(cookie?{cookie}:{}),...(body?{'Content-Type':'application/json',origin}:{}),...headers},body:body?JSON.stringify(body):undefined}),env,{stripe});
  const visitor=async()=>{const r=await request('config');return r.headers.get('set-cookie').split(';')[0];};
  const checkout=async(cookie,items=cart,country='CA')=>request('checkout',{cookie,body:{items,country}});
  const allocated=async(product='print1',mode='test')=>(await db.prepare('SELECT allocated FROM shop_inventory WHERE mode=? AND product_id=?').bind(mode,product).first()).allocated;
  return {db,env,stripe,sessions,request,visitor,checkout,allocated,get creates(){return creates;},failExpiration(){expirationFailure=true;}};
}
test('server rejects price injection, unsupported offers/products and malformed quantities',()=>{
  for(const item of [{...cart[0],price:1},{...cart[0],quantity:9},{...cart[0],quantity:1.5},{...cart[0],quantity:'1'},{...cart[0],productId:'print7'},{...cart[0],offerId:'onchain'},{...cart[0],offerId:'normal'},{...cart[0],productId:['print1']},{...cart[0],productId:'__proto__'}])assert.throws(()=>validateCart([item]));
  assert.throws(()=>validateCart([cart[0],cart[0]]));
  assert.equal(validateCart([{productId:'print6',offerId:'signed',quantity:2},cart[0]]).subtotal,150000);
});
test('unconfigured checkout fails closed and exposes no credentials',async t=>{
  const h=harness(t);delete h.env.STRIPE_SECRET_KEY;
  const r=await h.request('config');assert.deepEqual((await r.json()).available,false);assert.equal(r.headers.get('cache-control'),'no-store, private');
  assert.equal((await h.checkout(null)).status,503);
});
test('live checkout requires HTTPS and explicit policies, tax, shipping, and bot protection',t=>{
  const h=harness(t);h.env.SHOP_MODE='live';h.env.STRIPE_SECRET_KEY='sk_live_mock';assert.throws(()=>settings(h.env));
  Object.assign(h.env,{SHOP_ORIGIN:'https://lemonhaze.com',SHOP_SHIPPING_JSON:JSON.stringify({countries:['CA'],amount:1200,label:'Confirmed shipping',dispatch:'Confirmed dispatch'}),SHOP_TAX_MODE:'automatic',SHOP_LIVE_ENABLED:'true',SHOP_POLICIES_CONFIRMED:'true',SHOP_CONTACT_EMAIL:'studio@example.com',SHOP_RETURNS_TEXT:'Confirmed policy',TURNSTILE_SECRET_KEY:'test',TURNSTILE_SITE_KEY:'test'});
  assert.equal(settings(h.env).mode,'live');delete h.env.SHOP_TAX_MODE;assert.throws(()=>settings(h.env));
});
test('cross-site and cookieless writes are rejected',async t=>{
  const h=harness(t),cookie=await h.visitor();
  assert.equal((await h.request('checkout',{cookie,body:{items:cart,country:'CA'},origin:'https://evil.example'})).status,403);
  assert.equal((await h.checkout(null)).status,401);
  assert.equal((await h.request('checkout',{cookie,body:{items:cart,country:'CA'},origin:''})).status,403);
  assert.equal(h.creates,0);
});
test('cookie is HttpOnly; production cookie has Secure and host prefix',async t=>{
  const h=harness(t);let r=await h.request('config');assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Lax/);
  h.env.SHOP_ORIGIN='https://lemonhaze.com';h.env.TURNSTILE_SITE_KEY='public';h.env.TURNSTILE_SECRET_KEY='secret';r=await h.request('config');assert.match(r.headers.get('set-cookie'),/^__Host-lh-shop-owner=.*; Secure$/);
});
test('repeated checkout reuses session and reservation without doubling signed stock',async t=>{
  const h=harness(t),cookie=await h.visitor();const first=await (await h.checkout(cookie)).json(),second=await (await h.checkout(cookie)).json();
  assert.equal(first.orderId,second.orderId);assert.equal(first.url,second.url);assert.equal(h.creates,1);assert.equal(await h.allocated(),1);
  const row=await h.db.prepare('SELECT * FROM shop_orders').first();assert.notEqual(row.owner_hash,cookie.split('=')[1]);
  assert.equal(Object.hasOwn(row,'email'),false);assert.equal(Object.hasOwn(row,'address'),false);
});
test('country is locked; phone is omitted domestically and required internationally',async t=>{
  const h=harness(t);await h.checkout(await h.visitor(),cart,'CA');await h.checkout(await h.visitor(),cart,'US');
  const rows=(await h.db.prepare('SELECT params_json FROM shop_orders ORDER BY rowid').all()).results.map(x=>JSON.parse(x.params_json));
  for(const params of rows){assert.deepEqual(params.allowed_payment_method_types,['card']);assert.equal(Object.hasOwn(params,'payment_method_types'),false);}
  assert.deepEqual(rows[0].shipping_address_collection.allowed_countries,['CA']);assert.equal(rows[0].phone_number_collection.enabled,false);
  assert.deepEqual(rows[1].shipping_address_collection.allowed_countries,['US']);assert.equal(rows[1].phone_number_collection.enabled,true);
  assert.equal((await h.checkout(await h.visitor(),cart,'ZZ')).status,400);
});
test('changing a basket or destination requires cancelling its previous reservation',async t=>{
  const h=harness(t),cookie=await h.visitor();await h.checkout(cookie);
  assert.equal((await h.checkout(cookie,[{...cart[0],quantity:2}])).status,409);
  assert.equal((await h.checkout(cookie,cart,'US')).status,409);assert.equal(await h.allocated(),1);
});
test('atomic reservations protect the third edition and rollback the whole basket',async t=>{
  const h=harness(t);assert.equal((await h.checkout(await h.visitor(),[{...cart[0],quantity:3}])).status,200);
  const r=await h.checkout(await h.visitor(),[{productId:'print2',offerId:'signed',quantity:1},cart[0]]);assert.equal(r.status,409);
  assert.equal(await h.allocated(),3);assert.equal(await h.allocated('print2'),0);
  assert.equal((await h.db.prepare('SELECT count(*) n FROM shop_orders').first()).n,1);
});
test('competing reservations cannot sell more than three signed copies',async t=>{
  const h=harness(t),cookies=await Promise.all(Array.from({length:4},()=>h.visitor()));
  const results=await Promise.all(cookies.map(c=>h.checkout(c)));assert.equal(results.filter(r=>r.status===200).length,3);assert.equal(await h.allocated(),3);
});
test('owner isolation hides other orders and prevents cancellation',async t=>{
  const h=harness(t),a=await h.visitor(),b=await h.visitor();const {orderId}=await (await h.checkout(a)).json();
  assert.equal((await h.request(`order?id=${orderId}`,{cookie:b})).status,404);
  assert.equal((await h.request('cancel',{cookie:b,body:{orderId}})).status,404);assert.equal(await h.allocated(),1);
});
test('verified cancellation releases stock exactly once',async t=>{
  const h=harness(t),cookie=await h.visitor();const {orderId}=await (await h.checkout(cookie)).json();
  assert.equal((await (await h.request('cancel',{cookie,body:{orderId}})).json()).status,'expired');
  await h.request('cancel',{cookie,body:{orderId}});assert.equal(await h.allocated(),0);
});
test('cancel URL alone and failed cancellation cannot release a reservation',async t=>{
  const h=harness(t),cookie=await h.visitor();const {orderId}=await (await h.checkout(cookie)).json();h.failExpiration();
  await h.request(`order?id=${orderId}&cancelled=1`,{cookie});assert.equal(await h.allocated(),1);
  assert.equal((await h.request('cancel',{cookie,body:{orderId}})).status,409);assert.equal(await h.allocated(),1);
});
test('payment winning a cancellation race stays paid and never releases its edition',async t=>{
  const h=harness(t),cookie=await h.visitor();const {orderId}=await (await h.checkout(cookie)).json();
  Object.assign([...h.sessions.values()][0],{status:'complete',payment_status:'paid'});
  const r=await h.request('cancel',{cookie,body:{orderId}});assert.equal((await r.json()).status,'paid');assert.equal(await h.allocated(),1);
  await assert.rejects(h.db.prepare("UPDATE shop_orders SET status='expired' WHERE id=?").bind(orderId).run(),/PAID_EDITION_IS_PERMANENT/);
});
test('retry after a payment does not create a second session for the active checkout',async t=>{
  const h=harness(t),cookie=await h.visitor();await h.checkout(cookie);Object.assign([...h.sessions.values()][0],{status:'complete',payment_status:'paid'});
  const r=await h.checkout(cookie);assert.equal((await r.json()).status,'paid');assert.equal(h.creates,1);
});
test('mismatched payment totals are never accepted as paid',async t=>{
  const h=harness(t),cookie=await h.visitor();const {orderId}=await (await h.checkout(cookie)).json();
  Object.assign([...h.sessions.values()][0],{status:'complete',payment_status:'paid',amount_total:1});
  const r=await h.request(`order?id=${orderId}`,{cookie});assert.equal(r.status,409);assert.equal(await h.allocated(),1);
  assert.equal((await h.db.prepare('SELECT status FROM shop_orders WHERE id=?').bind(orderId).first()).status,'open');
});
test('invalid webhook signatures and stale timestamps are rejected',async t=>{
  const h=harness(t);const payload=JSON.stringify({id:'evt_bad',type:'checkout.session.completed'});
  for(const signature of ['invalid',h.stripe.webhooks.generateTestHeaderString({payload,secret:h.env.STRIPE_WEBHOOK_SECRET,timestamp:Math.floor(Date.now()/1000)-1000})]){
    const result=await handleShop(new Request('http://127.0.0.1:5173/api/shop/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),h.env,{stripe:h.stripe});assert.equal(result.status,400);
  }
});
test('verified duplicate and out-of-order webhooks use current Stripe state',async t=>{
  const h=harness(t);await h.checkout(await h.visitor());const session=[...h.sessions.values()][0];Object.assign(session,{status:'complete',payment_status:'paid'});
  for(const type of ['checkout.session.completed','checkout.session.completed','checkout.session.expired']){
    const payload=JSON.stringify({id:'evt_test',type,livemode:false,data:{object:{...session,status:type.endsWith('expired')?'expired':'complete'}}});
    const signature=h.stripe.webhooks.generateTestHeaderString({payload,secret:h.env.STRIPE_WEBHOOK_SECRET});
    const r=await handleShop(new Request('http://127.0.0.1:5173/api/shop/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),h.env,{stripe:h.stripe});assert.equal(r.status,200);
  }
  assert.equal((await h.db.prepare('SELECT status FROM shop_orders').first()).status,'paid');assert.equal(await h.allocated(),1);
});
test('test and live inventory are isolated',async t=>{
  const h=harness(t);await h.checkout(await h.visitor(),[{...cart[0],quantity:3}]);assert.equal(await h.allocated('print1','live'),0);
});
test('unresolved creation retains inventory after an ambiguous Stripe failure',async t=>{
  const h=harness(t),cookie=await h.visitor();h.stripe.checkout.sessions.create=async()=>{throw new Error('Stripe network timeout with secret details');};
  const r=await h.checkout(cookie);assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/secret details/);assert.equal(await h.allocated(),1);
});
test('production human verification checks hostname and intended action',async t=>{
  const h=harness(t),config={local:false,origin:'https://lemonhaze.com'};
  const fetcher=value=>async()=>new Response(JSON.stringify(value));
  await assert.rejects(verifyHuman(h.env,config,'token',fetcher({success:true,hostname:'evil.example',action:'shop-checkout'})));
  await assert.rejects(verifyHuman(h.env,config,'token',fetcher({success:true,hostname:'lemonhaze.com',action:'other'})));
  await verifyHuman(h.env,config,'token',fetcher({success:true,hostname:'lemonhaze.com',action:'shop-checkout'}));
});
test('maintenance repairs missed expiry without releasing an open payment',async t=>{
  const h=harness(t);await h.checkout(await h.visitor());await h.checkout(await h.visitor());
  [...h.sessions.values()][0].status='expired';
  assert.deepEqual(await reconcileOutstanding(h.env,h.stripe),{checked:2,needsReview:0});assert.equal(await h.allocated(),1);
  await reconcileOutstanding(h.env,h.stripe);assert.equal(await h.allocated(),1);
});

test('textile prices and quantities are server-owned and print-only offers are rejected',()=>{
 for(const productId of ['textile1','textile2','textile3','textile4','textile5','textile6','textile7','textile8','textile9']) {
  assert.equal(validateCart([{productId,offerId:'signed',quantity:1}]).subtotal,80000);
  for(const offerId of ['normal','onchain'])assert.throws(()=>validateCart([{productId,offerId,quantity:1}]));
  assert.throws(()=>validateCart([{productId,offerId:'signed',quantity:2}]));
 }
});
test('only one buyer can reserve each textile; cancellation releases it once',async t=>{
 const h=harness(t),cookies=await Promise.all([h.visitor(),h.visitor()]);
 const item=[{productId:'textile1',offerId:'signed',quantity:1}];
 const responses=await Promise.all(cookies.map(c=>h.checkout(c,item)));
 assert.equal(responses.filter(r=>r.status===200).length,1);
 assert.equal(responses.filter(r=>r.status===409).length,1);
 assert.equal(await h.allocated('textile1'),1);
 const winner=responses.findIndex(r=>r.status===200),{orderId}=await responses[winner].json();
 await h.request('cancel',{cookie:cookies[winner],body:{orderId}});
 await h.request('cancel',{cookie:cookies[winner],body:{orderId}});
 assert.equal(await h.allocated('textile1'),0);
 assert.equal((await h.checkout(cookies[1-winner],item)).status,200);
});
test('new print editions and mixed textile baskets reserve independently with correct Stripe descriptions',async t=>{
 const h=harness(t),cookie=await h.visitor();
 const items=[{productId:'print10',offerId:'signed',quantity:3},{productId:'print11',offerId:'signed',quantity:1},{productId:'textile2',offerId:'signed',quantity:1}];
 assert.equal((await h.checkout(cookie,items)).status,200);
 assert.equal(await h.allocated('print10'),3);assert.equal(await h.allocated('textile2'),1);
 const order=await h.db.prepare('SELECT * FROM shop_orders').first();assert.equal(order.subtotal,280000);
 const lines=JSON.parse(order.params_json).line_items;
 const textile=lines.find(l=>l.price_data.unit_amount===80000).price_data.product_data;
 assert.match(textile.name,/Textile \+ Certificate/);assert.doesNotMatch(textile.name,/edition of 3/);
 assert.match(textile.description,/textile/);assert.doesNotMatch(textile.description,/13|paper/);
});

test('all nine textile inventory rows reserve exactly one and reject a second buyer',async t=>{
 const h=harness(t);
 const items=Array.from({length:9},(_,i)=>({productId:`textile${i+1}`,offerId:'signed',quantity:1}));
 for(const item of items)assert.equal((await h.checkout(await h.visitor(),[item])).status,200);
 for(const item of items)assert.equal(await h.allocated(item.productId),1);
 for(const item of items)assert.equal((await h.checkout(await h.visitor(),[item])).status,409);
 for(const item of items)assert.equal(await h.allocated(item.productId),1);
});

test('unsigned checkout requests are rejected before Stripe or stock reservations',async t=>{
 const h=harness(t),cookie=await h.visitor();
 assert.equal((await h.checkout(cookie,[{productId:'print1',offerId:'normal',quantity:1}])).status,400);
 assert.equal(h.creates,0);assert.equal(await h.allocated(),0);
});

test('destination shipping rates are selected on the server and locked into Stripe',async t=>{
  const h=harness(t);
  h.env.SHOP_SHIPPING_JSON=JSON.stringify({countries:['CA','US','FR'],rates:{CA:0,US:1500,FR:3000},label:'Flat shipping',dispatch:'Dispatch Monday–Friday'});
  const config=await (await h.request('config')).json();
  assert.deepEqual(config.shipping.rates,{CA:0,US:1500,FR:3000});
  for(const [country,amount] of Object.entries(config.shipping.rates)){
    const result=await (await h.checkout(await h.visitor(),cart,country)).json();
    const row=await h.db.prepare('SELECT params_json FROM shop_orders WHERE id=?').bind(result.orderId).first();
    const params=JSON.parse(row.params_json);
    assert.equal(params.shipping_options[0].shipping_rate_data.fixed_amount.amount,0);
    assert.deepEqual(params.shipping_address_collection.allowed_countries,[country]);
  }
  assert.equal((await h.request('checkout',{cookie:await h.visitor(),body:{items:cart,country:'FR',shippingAmount:0}})).status,400);
});
test('missing or invalid country rates fail closed',t=>{
  const h=harness(t);
  for(const rates of [{CA:0},{CA:0,US:-1},{CA:0,US:'1500'},[],null]){
    h.env.SHOP_SHIPPING_JSON=JSON.stringify({countries:['CA','US'],rates,label:'Shipping',dispatch:'Weekdays'});
    assert.throws(()=>settings(h.env));
  }
});


test('inclusive print tax stays inside $500; mixed baskets add only exclusive textile tax',async t=>{
 for(const mixed of [false,true]){
  const h=harness(t);h.env.SHOP_TAX_MODE='automatic';
  const items=mixed?[...cart,{productId:'textile1',offerId:'signed',quantity:1}]:cart;
  await h.checkout(await h.visitor(),items);
  const order=await h.db.prepare('SELECT * FROM shop_orders').first();
  const params=JSON.parse(order.params_json);
  assert.equal(params.line_items[0].price_data.tax_behavior,'inclusive');
  if(mixed)assert.equal(params.line_items[1].price_data.tax_behavior,'exclusive');
  const session=[...h.sessions.values()][0];
  Object.assign(session,{status:'complete',payment_status:'paid',automatic_tax:{status:'complete'},amount_total:order.subtotal+(mixed?4000:0),total_details:{amount_discount:0,amount_shipping:0,amount_tax:2381+(mixed?4000:0),breakdown:{taxes:[{amount:2381,rate:{inclusive:true}},...(mixed?[{amount:4000,rate:{inclusive:false}}]:[])]}}});
  assert.equal(await reconcileSession(h.db,order,session),'paid');
  session.amount_total+=2381;
  await assert.rejects(reconcileSession(h.db,order,session),/payment review/);
  delete session.total_details.breakdown;
  await assert.rejects(reconcileSession(h.db,order,session),/payment review/);
 }
});
test('textile and mixed baskets keep the specified destination shipping rates',async t=>{
 for(const mixed of [false,true]){
  const h=harness(t);h.env.SHOP_SHIPPING_JSON=JSON.stringify({countries:['US'],rates:{US:1500},label:'Flat shipping',dispatch:'5 business days'});
  const items=[{productId:'textile1',offerId:'signed',quantity:1},...(mixed?cart:[])];
  assert.equal((await h.checkout(await h.visitor(),items,'US')).status,200);
  const row=await h.db.prepare('SELECT params_json FROM shop_orders').first();
  assert.equal(JSON.parse(row.params_json).shipping_options[0].shipping_rate_data.fixed_amount.amount,1500);
 }
});

test('coming-soon gate rejects new checkout without Stripe calls or reservations, even when configured',async t=>{
 const h=harness(t),cookie=await h.visitor();
 for(const value of [undefined,'false','TRUE']) {
  h.env.SHOP_STOREFRONT_OPEN=value;
  const config=await h.request('config');
  assert.deepEqual(await config.json(),{available:false,comingSoon:true,message:'Online ordering is coming soon.'});
  assert.equal(config.headers.get('set-cookie'),null);
  const response=await h.checkout(cookie);
  assert.equal(response.status,503);assert.match((await response.json()).error,/coming soon/);
 }
 assert.equal(h.creates,0);assert.equal(await h.allocated(),0);
 // Payment readiness and live credentials must not bypass the launch gate.
 Object.assign(h.env,{SHOP_MODE:'live',STRIPE_SECRET_KEY:'sk_live_mock',SHOP_LIVE_ENABLED:'true',SHOP_POLICIES_CONFIRMED:'true'});
 assert.equal((await h.checkout(cookie)).status,503);assert.equal(h.creates,0);assert.equal(await h.allocated('print1','live'),0);
});

test('closing sales preserves existing order status, cancellation and signed payment webhooks',async t=>{
 const h=harness(t),cookie=await h.visitor();
 const {orderId}=await (await h.checkout(cookie)).json();
 h.env.SHOP_STOREFRONT_OPEN='false';
 assert.equal((await h.request(`order?id=${orderId}`,{cookie})).status,200);
 assert.equal((await h.request('cancel',{cookie,body:{orderId}})).status,200);
 assert.equal(await h.allocated(),0);
 h.env.SHOP_STOREFRONT_OPEN='true';
 await h.checkout(cookie);
 h.env.SHOP_STOREFRONT_OPEN='false';
 const session=[...h.sessions.values()].at(-1);
 Object.assign(session,{status:'complete',payment_status:'paid'});
 const payload=JSON.stringify({id:'evt_closed',type:'checkout.session.completed',livemode:false,data:{object:session}});
 const signature=h.stripe.webhooks.generateTestHeaderString({payload,secret:h.env.STRIPE_WEBHOOK_SECRET});
 const result=await handleShop(new Request('http://127.0.0.1:5173/api/shop/webhook',{method:'POST',headers:{'stripe-signature':signature},body:payload}),h.env,{stripe:h.stripe});
 assert.equal(result.status,200);
 assert.equal((await h.db.prepare("SELECT count(*) n FROM shop_orders WHERE status='paid'").first()).n,1);
 assert.equal(await h.allocated(),1);
});

test('fresh cookies cannot bypass atomic network reservation caps',async t=>{
 const h=harness(t);
 const attempt=async()=>h.request('checkout',{cookie:await h.visitor(),body:{items:cart,country:'CA'},headers:{'cf-connecting-ip':'192.0.2.10'}});
 const responses=await Promise.all([attempt(),attempt(),attempt()]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,200,429]);
 assert.equal(await h.allocated(),2);assert.equal(h.creates,2);
 const rows=await h.db.prepare('SELECT ip_hash,params_json FROM shop_orders').all();
 for(const row of rows.results){assert.match(row.ip_hash,/^[a-f0-9]{64}$/);assert.equal(JSON.parse(row.params_json).adaptive_pricing.enabled,false);}
 assert.doesNotMatch(JSON.stringify(rows),/192\.0\.2\.10/);
});
test('daily network limit survives cancelled checkouts',async t=>{
 const h=harness(t);
 for(let i=0;i<11;i++){
  const cookie=await h.visitor();
  const response=await h.request('checkout',{cookie,body:{items:cart,country:'CA'},headers:{'cf-connecting-ip':'192.0.2.20'}});
  assert.equal(response.status,i<10?200:429);
  if(i<10){const {orderId}=await response.json();assert.equal((await h.request('cancel',{cookie,body:{orderId}})).status,200);}
 }
 assert.equal(await h.allocated(),0);
});
test('one-cent paid mismatch persists one review alert without releasing stock',async t=>{
 const h=harness(t),cookie=await h.visitor();const {orderId}=await (await h.checkout(cookie)).json();
 const session=[...h.sessions.values()][0];session.status='complete';session.payment_status='paid';session.amount_total++;
 for(let i=0;i<2;i++)assert.equal((await h.request(`order?id=${orderId}`,{cookie})).status,409);
 assert.equal((await h.db.prepare('SELECT needs_review FROM shop_orders WHERE id=?').bind(orderId).first()).needs_review,1);
 assert.equal((await h.db.prepare('SELECT count(*) AS n FROM shop_review_alerts').first()).n,1);
 assert.equal(await h.allocated(),1);
});

test('a single basket cannot reserve the entire catalogue and rejection rolls back',async t=>{
 const h=harness(t),cookie=await h.visitor();
 const items=Array.from({length:7},(_,i)=>({productId:`textile${i+1}`,offerId:'signed',quantity:1}));
 assert.equal((await h.checkout(cookie,items)).status,429);
 assert.equal(h.creates,0);
 for(const item of items)assert.equal(await h.allocated(item.productId),0);
 assert.equal((await h.db.prepare('SELECT count(*) n FROM shop_orders').first()).n,0);
});

test('monitor repairs a missed paid webhook and persists a private heartbeat',async t=>{
  const h=harness(t);await h.checkout(await h.visitor());
  Object.assign([...h.sessions.values()][0],{status:'complete',payment_status:'paid'});
  const result=await runMaintenance(h.env,{stripe:h.stripe});
  assert.deepEqual(result,{checked:1,needsReview:0,delivered:0,configured:false});
  assert.equal((await h.db.prepare('SELECT status FROM shop_orders').first()).status,'paid');
  assert.equal(await h.allocated(),1);
  const heartbeat=await h.db.prepare('SELECT * FROM shop_monitor').first();
  assert.equal(heartbeat.status,'ok');assert.ok(heartbeat.finished_at>=heartbeat.started_at);
  assert.equal(heartbeat.alerts_configured,0);
  assert.deepEqual(await runMaintenance(h.env,{stripe:h.stripe}),{skipped:true});
});
test('Stripe outage creates a durable review alert without releasing inventory',async t=>{
  const h=harness(t);await h.checkout(await h.visitor());h.sessions.clear();
  assert.deepEqual(await reconcileOutstanding(h.env,h.stripe),{checked:0,needsReview:1});
  await reconcileOutstanding(h.env,h.stripe);
  assert.equal(await h.allocated(),1);
  assert.equal((await h.db.prepare('SELECT needs_review FROM shop_orders').first()).needs_review,1);
  const alerts=(await h.db.prepare('SELECT * FROM shop_review_alerts').all()).results;
  assert.equal(alerts.length,1);assert.equal(alerts[0].reason,'STRIPE_RECONCILIATION');
});
test('alert delivery retries failures, isolates modes and omits customer details',async t=>{
  const h=harness(t);await h.checkout(await h.visitor());h.sessions.clear();await reconcileOutstanding(h.env,h.stripe);
  Object.assign(h.env,{SHOP_ALERT_URL:'https://alerts.example.test/shop',SHOP_ALERT_TOKEN:'testing-only'});
  let attempts=0;
  const fetcher=async(url,init)=>{attempts++;assert.equal(init.redirect,'error');assert.equal(init.headers.Authorization,'Bearer testing-only');assert.deepEqual(Object.keys(JSON.parse(init.body)).sort(),['orderId','reason','type']);return new Response('',{status:attempts===1?503:200});};
  assert.equal((await deliverReviewAlerts({...h.env,SHOP_MODE:'live'},fetcher)).delivered,0);assert.equal(attempts,0);
  assert.equal((await deliverReviewAlerts(h.env,fetcher)).delivered,0);
  assert.equal((await h.db.prepare('SELECT delivered_at FROM shop_review_alerts').first()).delivered_at,null);
  assert.equal((await deliverReviewAlerts(h.env,fetcher)).delivered,1);
  assert.equal((await deliverReviewAlerts(h.env,fetcher)).delivered,0);assert.equal(attempts,2);
  assert.equal((await h.db.prepare('SELECT needs_review FROM shop_orders').first()).needs_review,1);
});
test('failed monitor invocation records failure and permits a later retry',async t=>{
  const h=harness(t);h.env.STRIPE_SECRET_KEY='sk_live_wrong_mode';
  await assert.rejects(runMaintenance(h.env,{stripe:h.stripe}),/Shop monitoring failed/);
  assert.equal((await h.db.prepare('SELECT status FROM shop_monitor').first()).status,'failed');
  await h.db.prepare('UPDATE shop_monitor SET started_at=0').run();h.env.STRIPE_SECRET_KEY='sk_test_mock';
  assert.equal((await runMaintenance(h.env,{stripe:h.stripe})).checked,0);
  assert.equal((await h.db.prepare('SELECT status FROM shop_monitor').first()).status,'ok');
});
test('maintenance requires its private token while the public shop remains closed',async t=>{
  const h=harness(t);h.env.SHOP_STOREFRONT_OPEN='false';h.env.SHOP_MAINTENANCE_TOKEN='private-test-token-'.repeat(3);
  for(const headers of [{},{authorization:'Bearer wrong'}])assert.equal((await h.request('maintenance',{method:'POST',headers})).status,404);
  const headers={authorization:`Bearer ${h.env.SHOP_MAINTENANCE_TOKEN}`};
  assert.equal((await h.request('maintenance',{headers})).status,405);
  assert.equal((await h.request('maintenance',{method:'POST',headers})).status,200);
  assert.equal((await h.checkout(null)).status,503);
  assert.equal((await (await h.request('config')).json()).comingSoon,true);
});
test('unpaid complete session cannot be fulfilled and retains its allocation',async t=>{
  const h=harness(t);await h.checkout(await h.visitor());Object.assign([...h.sessions.values()][0],{status:'complete',payment_status:'unpaid'});
  await runMaintenance(h.env,{stripe:h.stripe});
  assert.equal((await h.db.prepare('SELECT status FROM shop_orders').first()).status,'processing');assert.equal(await h.allocated(),1);
});
