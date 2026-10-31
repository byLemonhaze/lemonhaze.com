import Stripe from 'stripe';
import {CATALOG,ShopError} from './catalog.js';
import {recordSession,nowSeconds} from './store.js';
export function stripeClient(env,options={}) {
  return new Stripe(env.STRIPE_SECRET_KEY,{apiVersion:'2026-09-30.endive',httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:2,timeout:15000,...options});
}
export function checkoutParams(config,cart,id,now) {
  return {
    mode:'payment',allowed_payment_method_types:['card'],client_reference_id:id,
    metadata:{shop_order_id:id,shop_mode:config.mode},
    payment_intent_data:{metadata:{shop_order_id:id,shop_mode:config.mode}},
    line_items:cart.map(i=>({quantity:i.quantity,price_data:{currency:'usd',unit_amount:CATALOG[i.productId][i.offerId],tax_behavior:CATALOG[i.productId].type==='print'?'inclusive':'exclusive',product_data:{name:`${CATALOG[i.productId].name} · ${CATALOG[i.productId].type==='textile'?'Textile + Certificate':'Signed + Certificate — edition of 3'}`,description:CATALOG[i.productId].type==='textile'?`Physical textile artwork · ${CATALOG[i.productId].sizeCm.join(' × ')} cm (W × H) · Certificate of authenticity included`:'Unframed physical print · 13 × 23.11 in · Palo Duro Etching cotton paper'}}})),
    shipping_address_collection:{allowed_countries:config.shipping.countries},
    phone_number_collection:{enabled:config.phone},
    shipping_options:[{shipping_rate_data:{display_name:config.shipping.label,type:'fixed_amount',fixed_amount:{amount:config.shipping.amount,currency:'usd'},tax_behavior:'exclusive',tax_code:'txcd_92010001'}}],
    automatic_tax:{enabled:config.tax==='automatic'},
    expires_at:now+1800,
    adaptive_pricing:{enabled:false},
    success_url:`${config.origin}/shop?order=${id}`,
    cancel_url:`${config.origin}/shop?order=${id}&cancelled=1`,
    custom_text:{submit:{message:config.mode==='test'?'TEST ONLY — no real payment or shipment.':config.shipping.dispatch}},
    // No recovery links: an expired checkout must make a fresh inventory reservation.
    after_expiration:{recovery:{enabled:false}},
  };
}
export const SESSION_EXPANSION={expand:['total_details.breakdown']};
export async function createOrResume(db,stripe,order) {
  let session;
  if(order.session_id)session=await stripe.checkout.sessions.retrieve(order.session_id,SESSION_EXPANSION);
  else {
    // Preserve stock on ambiguous failures. Never recreate after Stripe's idempotency retention window.
    if(nowSeconds()-order.created_at>23*3600)throw new ShopError('This checkout needs a studio review. Please contact the studio before trying again.',409);
    session=await stripe.checkout.sessions.create(JSON.parse(order.params_json),{idempotencyKey:`lh-shop-${order.mode}-${order.id}`});
    await recordSession(db,order,session);
  }
  return session;
}
export async function reconcileSession(db,order,session) {
  try {
    const status=await reconcileVerifiedSession(db,order,session);
    // Review stays latched until a human resolves it; never silently discard an alert.
    return status;
  } catch(error) {
    if(error instanceof ShopError) {
      await db.batch([
        db.prepare('UPDATE shop_orders SET needs_review=1 WHERE id=?').bind(order.id),
        db.prepare('INSERT INTO shop_review_alerts(order_id,reason,created_at) VALUES(?,?,?) ON CONFLICT(order_id) DO NOTHING').bind(order.id,'PAYMENT_VERIFICATION',nowSeconds())
      ]);
      throw new ShopError('Your order needs a payment review. Please contact the studio and do not pay again.',409);
    }
    throw error;
  }
}
async function reconcileVerifiedSession(db,order,session) {
  const params=JSON.parse(order.params_json);
  if(session.client_reference_id!==order.id || session.metadata?.shop_order_id!==order.id || session.metadata?.shop_mode!==order.mode || session.livemode!==(order.mode==='live') || (order.session_id && order.session_id!==session.id))throw new ShopError('Payment confirmation could not be verified.',409);
  const shipping=params.shipping_options[0].shipping_rate_data.fixed_amount.amount;
  const tax=session.total_details?.amount_tax || 0;
  // Stripe's expanded tax breakdown distinguishes tax included in the print price
  // from tax added to textiles/shipping. Never add inclusive taxes a second time.
  if(session.status==='complete') {
    let exclusiveTax=0;
    const taxes=session.total_details?.breakdown?.taxes;
    if(tax>0) {
      if(!Array.isArray(taxes)||!taxes.length||taxes.some(t=>!Number.isSafeInteger(t.amount)||t.amount<0||typeof t.rate?.inclusive!=='boolean')||taxes.reduce((n,t)=>n+t.amount,0)!==tax)throw new ShopError('Payment tax details need review by the studio.',409);
      exclusiveTax=taxes.filter(t=>!t.rate.inclusive).reduce((n,t)=>n+t.amount,0);
    }
    if(session.currency!=='usd'||session.total_details?.amount_discount||(session.total_details?.amount_shipping ?? 0)!==shipping||!Number.isSafeInteger(tax)||tax<0||(!params.automatic_tax.enabled&&tax!==0)||session.amount_total!==order.subtotal+shipping+exclusiveTax)throw new ShopError('Payment totals need review by the studio.',409);
    if(params.automatic_tax.enabled&&session.automatic_tax?.status!=='complete')throw new ShopError('Payment tax calculation needs review by the studio.',409);
  }
  let status;
  if(session.status==='complete' && session.payment_status==='paid')status='paid';
  else if(session.status==='expired')status='expired';
  else if(session.status==='complete')status='processing';
  else status='open';
  // Terminal reservations cannot be resurrected. Paid signed prints never return to the edition pool, including refunds.
  if(['expired','failed'].includes(order.status) && status!==order.status)throw new ShopError('This order needs review by the studio.',409);
  await recordSession(db,order,session);
  await db.prepare("UPDATE shop_orders SET status=?,total=?,updated_at=? WHERE id=? AND status IN ('creating','open','processing')").bind(status,session.amount_total,nowSeconds(),order.id).run();
  return status;
}
