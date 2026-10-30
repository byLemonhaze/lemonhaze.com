import {ShopError} from './catalog.js';

export const responseHeaders = {
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, private',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Vary':'Cookie, Origin',
};
export const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{...responseHeaders,...headers}});
export async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function owner(request,local,create=false) {
  const name=local?'lh-shop-owner':'__Host-lh-shop-owner';
  const found=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(`${name}=`))?.slice(name.length+1);
  let token=/^[a-f0-9]{64}$/.test(found||'')?found:null;
  let cookie;
  if(!token && create) {
    token=[...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('');
    cookie=`${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${local?'':'; Secure'}`;
  }
  if(!token)throw new ShopError('Please reload the shop before checking out.',401);
  return {hash:await digest(token),cookie};
}
export function checkOrigin(request,origin) {
  if(request.headers.get('origin')!==origin || request.headers.get('sec-fetch-site')==='cross-site')throw new ShopError('Please start checkout from the Print Shop.',403);
}
export async function readBody(request,max=8192) {
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ShopError('Expected a JSON request.',415);
  if(Number(request.headers.get('content-length')||0)>max)throw new ShopError('Request too large.',413);
  // Bound streamed bodies as well as declared lengths.
  const reader=request.body?.getReader();if(!reader)throw new ShopError('Missing request.');
  const parts=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new ShopError('Request too large.',413);}parts.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
  try{const body=JSON.parse(new TextDecoder().decode(bytes));if(!body||Array.isArray(body)||typeof body!=='object')throw 0;return body;}catch{throw new ShopError('Invalid request.');}
}
export async function rateLimit(env,request,category,limit=20) {
  const now=Math.floor(Date.now()/1000),window=Math.floor(now/600);
  // Only the edge-provided IP is trusted; forwarded browser headers are ignored.
  const ip=request.headers.get('cf-connecting-ip')||'local';
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.SHOP_RATE_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signed=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${category}:${window}:${ip}`));
  const bucket=[...new Uint8Array(signed)].map(b=>b.toString(16).padStart(2,'0')).join('');
  await env.SHOP_DB.prepare('DELETE FROM shop_rate_limits WHERE expires_at < ?').bind(now).run();
  const row=await env.SHOP_DB.prepare('INSERT INTO shop_rate_limits(bucket,count,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,(window+1)*600).first();
  if(row.count>limit)throw new ShopError('Please wait a few minutes before trying again.',429);
}
export async function verifyHuman(env,config,token,fetcher=fetch) {
  if(config.local)return;
  if(typeof token!=='string'||token.length<1||token.length>2048)throw new ShopError('Please complete the checkout security check.',403);
  const result=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token}),signal:AbortSignal.timeout(8000)});
  const verification=await result.json();
  if(!verification.success || verification.hostname!==new URL(config.origin).hostname || verification.action!=='shop-checkout')throw new ShopError('Please repeat the checkout security check.',403);
}
