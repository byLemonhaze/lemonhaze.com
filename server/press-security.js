import {checkOrigin,readBody,rateLimit} from './shop/http.js';
import {ShopError} from './shop/catalog.js';
export async function authorizePress(request,env) {
 if(!env.SHOP_DB || !env.SHOP_RATE_SECRET || (env.PRESS_ENGINE_PASSWORD||'').length<32)throw new ShopError('Content lab is unavailable.',503);
 const origin=new URL(request.url).origin;
 checkOrigin(request,origin);
 await rateLimit(env,request,'press-auth',10,3600);
 const supplied=request.headers.get('x-press-password')||'';
 if(supplied.length>512)throw new ShopError('Unauthorized',401);
 const enc=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',enc.encode(env.PRESS_ENGINE_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 const signature=await crypto.subtle.sign('HMAC',key,enc.encode(env.PRESS_ENGINE_PASSWORD));
 if(!await crypto.subtle.verify('HMAC',key,signature,enc.encode(supplied)))throw new ShopError('Unauthorized',401);
 const body=await readBody(request,8192);
 if(Object.keys(body).some(k=>!['action','type','collection','context'].includes(k)) || Object.values(body).some(v=>v!==null&&typeof v!=='string'))throw new ShopError('Invalid request.');
 if(body.action==='auth')return body;
 // A hard global call budget bounds credit exposure even if the credential leaks.
 await rateLimit(env,request,'press-generation-day',20,86400,true);
 await rateLimit(env,request,'press-generation-month',200,30*86400,true);
 return body;
}
