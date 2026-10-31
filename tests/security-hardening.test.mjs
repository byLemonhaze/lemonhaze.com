import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizePress} from '../server/press-security.js';
import {localDatabase} from '../server/shop/local-db.js';
import {secureResponse,commonHeaders,shopHeaders} from '../server/security-headers.js';
import {esc,assetUrl} from '../src/shop/html.js';
import {deliverReviewAlerts} from '../server/shop/alerts.js';
import {readFileSync} from 'node:fs';
const password='test-only-long-credential-'.repeat(3);
function setup(t){const db=localDatabase();t.after(()=>db.close());return {SHOP_DB:db,SHOP_RATE_SECRET:password,PRESS_ENGINE_PASSWORD:password};}
function req(secret=password,body={action:'auth'},ip='192.0.2.1') {return new Request('https://lemonhaze.com/api/press-engine',{method:'POST',headers:{origin:'https://lemonhaze.com','content-type':'application/json','x-press-password':secret,'cf-connecting-ip':ip},body:JSON.stringify(body)});}
test('press authentication fails closed, limits guessing and validates bodies',async t=>{
 const env=setup(t);
 await assert.rejects(authorizePress(req(),{...env,PRESS_ENGINE_PASSWORD:'short'}),e=>e.status===503);
 for(let i=0;i<10;i++)await assert.rejects(authorizePress(req('wrong'),env),e=>e.status===401);
 await assert.rejects(authorizePress(req(),env),e=>e.status===429);
 await assert.rejects(authorizePress(req(password,{context:'x'.repeat(9000)},'192.0.2.2'),env),e=>e.status===413);
 await assert.rejects(authorizePress(req(password,{context:{}},'192.0.2.3'),env),e=>e.status===400);
 assert.deepEqual(await authorizePress(req(password,{action:'auth'},'192.0.2.4'),env),{action:'auth'});
});
test('press generation budget is global across different connections',async t=>{
 const env=setup(t);
 for(let i=0;i<20;i++)await authorizePress(req(password,{type:'statement'},`192.0.2.${i+1}`),env);
 await assert.rejects(authorizePress(req(password,{type:'statement'},'192.0.2.100'),env),e=>e.status===429);
});
test('shop framing protection is enforced and artwork embedding stays possible',()=>{
 const response=secureResponse(new Request('https://lemonhaze.com/shop'),new Response('ok'));
 assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.equal(response.headers.get('x-frame-options'),'DENY');
 assert.ok(response.headers.get('strict-transport-security'));
 for(const path of ['/', '/about', '/collection.html'])assert.equal(secureResponse(new Request('https://lemonhaze.com'+path),new Response('shell',{headers:{'Content-Type':'text/html'}})).headers.get('x-frame-options'),'DENY');
 assert.equal(secureResponse(new Request('https://lemonhaze.com/lab/art.html'),new Response()).headers.get('x-frame-options'),null);
 const staticHeaders=readFileSync(new URL('../public/_headers',import.meta.url),'utf8');
 for(const [k,v] of Object.entries({...commonHeaders,...shopHeaders}))assert.ok(staticHeaders.includes(`${k}: ${v}`));
});
test('catalogue markup and URL schemes are independently escaped',()=>{
 assert.equal(esc('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
 for(const value of ['javascript:alert(1)','data:text/html,x','http://bad.example','https://user:pass@bad.example'])assert.equal(assetUrl(value),'#');
 assert.equal(assetUrl('/safe.webp?x=" onerror="x'),'/safe.webp?x=&quot; onerror=&quot;x');
});
test('review outbox retries failures and sends no customer data',async t=>{
 const env=setup(t);
 await env.SHOP_DB.prepare("INSERT INTO shop_orders(id,mode,owner_hash,cart_json,subtotal,params_json,status,created_at,updated_at) VALUES('test-order','test','owner','[]',1,'{}','open',1,1)").run();
 await env.SHOP_DB.prepare("INSERT INTO shop_review_alerts VALUES('test-order','PAYMENT_VERIFICATION',1,NULL)").run();
 assert.deepEqual(await deliverReviewAlerts(env),{delivered:0,configured:false});
 env.SHOP_ALERT_URL='https://alerts.example/review';env.SHOP_ALERT_TOKEN='test-only';
 assert.equal((await deliverReviewAlerts(env,async()=>new Response('',{status:503}))).delivered,0);
 let calls=0;
 const deliver=async(url,options)=>{calls++;assert.equal(url,env.SHOP_ALERT_URL);assert.deepEqual(JSON.parse(options.body),{type:'shop.review',orderId:'test-order',reason:'PAYMENT_VERIFICATION'});assert.equal(options.redirect,'error');return new Response('ok');};
 assert.equal((await deliverReviewAlerts(env,deliver)).delivered,1);
 assert.equal((await deliverReviewAlerts(env,deliver)).delivered,0);assert.equal(calls,1);
});
