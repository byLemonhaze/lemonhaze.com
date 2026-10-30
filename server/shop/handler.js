import Stripe from 'stripe';
import {CATALOG,ShopError,validateCart} from './catalog.js';
import {settings,shippingAmount} from './config.js';
import {json,owner,checkOrigin,readBody,rateLimit,verifyHuman} from './http.js';
import {activeOrder,ownedOrder,reserveOrder,publicOrder,nowSeconds} from './store.js';
import {SESSION_EXPANSION,stripeClient,checkoutParams,createOrResume,reconcileSession} from './stripe.js';

const orderId=value=>typeof value==='string'&&/^[a-f0-9-]{36}$/.test(value);
const webhookEvents=new Set(['checkout.session.completed','checkout.session.expired','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed']);

export async function handleShop(request,env,dependencies={}) {
  const path=new URL(request.url).pathname.replace(/\/$/,'').split('/').pop();
  const stripe=()=>dependencies.stripe||stripeClient(env);
  try {
    // Independent launch gate: credentials/readiness never imply permission to sell.
    // Leave confirmations and existing-order support operational while closed.
    if(env.SHOP_STOREFRONT_OPEN!=='true') {
      if(path==='config' && request.method==='GET')return json({available:false,comingSoon:true,message:'Online ordering is coming soon.'});
      if(path==='checkout')throw new ShopError('Online ordering is coming soon.',503);
    }
    if(path==='config' && request.method==='GET') {
      let config;
      try{config=settings(env);}catch(error){if(error instanceof ShopError)return json({available:false,message:error.message});throw error;}
      const visitor=await owner(request,config.local,true);
      return json({available:true,mode:config.mode,countries:config.shipping.countries,shipping:{rates:Object.fromEntries(config.shipping.countries.map(c=>[c,shippingAmount(config.shipping,c)])),label:config.shipping.label,dispatch:config.shipping.dispatch},phone:config.phone,turnstileSiteKey:config.turnstileSiteKey,contact:env.SHOP_CONTACT_EMAIL||null,returns:env.SHOP_RETURNS_TEXT||null},200,visitor.cookie?{'Set-Cookie':visitor.cookie}:{});
    }
    // Webhooks remain operational even if the storefront is subsequently disabled.
    if(path==='webhook') {
      if(request.method!=='POST')return json({error:'Method not allowed.'},405);
      if(!env.STRIPE_SECRET_KEY||!env.STRIPE_WEBHOOK_SECRET||!env.SHOP_DB)throw new ShopError('Payment confirmation is not configured.',503);
      const signature=request.headers.get('stripe-signature');
      if(!signature || Number(request.headers.get('content-length')||0)>1048576)throw new ShopError('Invalid payment notification.',400);
      const reader=request.body?.getReader();if(!reader)throw new ShopError('Invalid payment notification.');
      const chunks=[];let bytes=0;while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1048576){await reader.cancel();throw new ShopError('Invalid payment notification.',413);}chunks.push(value);}
      const joined=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}
      const client=stripe();let event;
      try{event=await client.webhooks.constructEventAsync(new TextDecoder().decode(joined),signature,env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider());}catch{throw new ShopError('Invalid payment notification.',400);}
      if(!webhookEvents.has(event.type))return json({received:true});
      const session=event.data.object;
      const id=session.metadata?.shop_order_id;
      if(!orderId(id))return json({received:true}); // Other Stripe products may share this account.
      const order=await env.SHOP_DB.prepare('SELECT * FROM shop_orders WHERE id=?').bind(id).first();
      if(!order)throw new ShopError('Order is not available yet.',503); // Stripe retries, including a reservation/create race.
      if(event.livemode!==(order.mode==='live'))throw new ShopError('Invalid payment notification.',400);
      // Retrieve current state: an out-of-order webhook must never release a paid reservation.
      await reconcileSession(env.SHOP_DB,order,await client.checkout.sessions.retrieve(session.id,SESSION_EXPANSION));
      return json({received:true});
    }
    const config=settings(env);
    if(!['checkout','order','cancel'].includes(path))return json({error:'Not found.'},404);
    const expected=path==='order'?'GET':'POST';
    if(request.method!==expected)return json({error:'Method not allowed.'},405);
    if(request.method==='POST')checkOrigin(request,config.origin);
    const visitor=await owner(request,config.local);
    await rateLimit(env,request,path,path==='order'?90:20);
    const client=stripe();
    if(path==='checkout') {
      const body=await readBody(request);
      if(Object.keys(body).some(k=>!['items','country','turnstileToken'].includes(k)))throw new ShopError('Invalid checkout request.');
      if(typeof body.country!=='string'||!config.shipping.countries.includes(body.country))throw new ShopError('Choose a supported shipping destination.');
      const {cart,subtotal}=validateCart(body.items);
      await verifyHuman(env,config,body.turnstileToken,dependencies.fetcher);
      let order=await activeOrder(env.SHOP_DB,config.mode,visitor.hash);
      if(order) {
        const session=await createOrResume(env.SHOP_DB,client,order);
        const status=await reconcileSession(env.SHOP_DB,order,session);
        if(['paid','processing'].includes(status))return json({orderId:order.id,status});
        order=await activeOrder(env.SHOP_DB,config.mode,visitor.hash);
        if(order && (order.cart_json!==JSON.stringify(cart)||JSON.parse(order.params_json).shipping_address_collection.allowed_countries[0]!==body.country))return json({error:'An earlier checkout is still open. Cancel it before changing the selection or destination.',orderId:order.id},409);
      }
      if(!order) {
        const id=crypto.randomUUID(),now=nowSeconds();
        // Lock this session to the selected country. International carrier labels
        // need a delivery phone; ordinary Canada Post domestic delivery does not.
        const checkoutConfig={...config,phone:config.phone||body.country!=='CA',shipping:{...config.shipping,amount:cart.every(i=>CATALOG[i.productId].type==='print')?0:shippingAmount(config.shipping,body.country),countries:[body.country]}};
        const candidate={id,mode:config.mode,owner:visitor.hash,subtotal,now,params:checkoutParams(checkoutConfig,cart,id,now)};
        try{await reserveOrder(env.SHOP_DB,candidate,cart);}catch(error){
          if(String(error.message).includes('SIGNED_EDITION_UNAVAILABLE'))throw new ShopError('This artwork is no longer available in the selected quantity. Please update your basket.',409);
          if(String(error.message).includes('UNIQUE'))throw new ShopError('A checkout is already starting. Please try again.',409);
          throw error;
        }
        order=await ownedOrder(env.SHOP_DB,config.mode,visitor.hash,id);
      }
      const session=await createOrResume(env.SHOP_DB,client,order);
      if(session.status!=='open')return json({orderId:order.id,status:await reconcileSession(env.SHOP_DB,order,session)},409);
      // Allow only Stripe-hosted checkout, never a redirect supplied by the browser.
      const url=new URL(session.url);
      if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw new ShopError('Checkout could not be opened.',502);
      return json({url:url.href,orderId:order.id,mode:config.mode});
    }
    const id=path==='order'?new URL(request.url).searchParams.get('id'):(await readBody(request)).orderId;
    if(!orderId(id))throw new ShopError('Order not found.',404);
    let order=await ownedOrder(env.SHOP_DB,config.mode,visitor.hash,id);
    if(!order)throw new ShopError('Order not found in this browser. Check your Stripe receipt or contact the studio.',404);
    if(['creating','open','processing'].includes(order.status)) {
      let session=await createOrResume(env.SHOP_DB,client,order);
      if(path==='cancel'&&session.status==='open') {
        try{session=await client.checkout.sessions.expire(session.id);}catch{
          // Payment may have won the race. Retrieve before releasing anything.
          session=await client.checkout.sessions.retrieve(session.id,SESSION_EXPANSION);
          if(session.status==='open')throw new ShopError('Could not cancel yet. Please try again.',409);
        }
      }
      await reconcileSession(env.SHOP_DB,order,session);
      order=await ownedOrder(env.SHOP_DB,config.mode,visitor.hash,id);
    }
    return json(await publicOrder(order));
  } catch(error) {
    if(error instanceof ShopError)return json({error:error.message},error.status);
    // Never return/log Stripe bodies, customer data, request headers or credentials.
    return json({error:'Checkout is temporarily unavailable. Your payment status has not been changed. Please try again.'},503);
  }
}
