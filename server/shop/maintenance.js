import {SESSION_EXPANSION,stripeClient,reconcileSession} from './stripe.js';
import {nowSeconds} from './store.js';
// A scheduled worker repairs missed notifications. It never infers payment or
// expiry from the local clock, and never logs customer data or Stripe responses.
export async function reconcileOutstanding(env,client=stripeClient(env)) {
  const mode=env.SHOP_MODE==='live'?'live':'test';
  if(!new RegExp(`^(sk|rk)_${mode}_`).test(env.STRIPE_SECRET_KEY||''))throw new Error('Payment mode mismatch.');
  const orders=await env.SHOP_DB.prepare("SELECT * FROM shop_orders WHERE mode=? AND session_id IS NOT NULL AND status IN ('open','processing') ORDER BY updated_at LIMIT 100").bind(mode).all();
  const result={checked:0,needsReview:0};
  for(const order of orders.results){
    try{await reconcileSession(env.SHOP_DB,order,await client.checkout.sessions.retrieve(order.session_id,SESSION_EXPANSION));result.checked++;}
    catch{result.needsReview++;await env.SHOP_DB.prepare('UPDATE shop_orders SET updated_at=? WHERE id=?').bind(nowSeconds(),order.id).run();}
  }
  const unresolved=await env.SHOP_DB.prepare("SELECT count(*) AS count FROM shop_orders WHERE mode=? AND session_id IS NULL AND status='creating' AND created_at<?").bind(mode,nowSeconds()-3600).first();
  result.needsReview+=unresolved.count;
  await env.SHOP_DB.prepare("INSERT INTO shop_review_alerts(order_id,reason,created_at) SELECT id,'CHECKOUT_CREATION',? FROM shop_orders WHERE mode=? AND session_id IS NULL AND status='creating' AND created_at<? ON CONFLICT(order_id) DO NOTHING").bind(nowSeconds(),mode,nowSeconds()-3600).run();
  await env.SHOP_DB.prepare("UPDATE shop_orders SET needs_review=1 WHERE mode=? AND session_id IS NULL AND status='creating' AND created_at<?").bind(mode,nowSeconds()-3600).run();
  // Retain the network identifier only for the abuse window, plus active holds.
  await env.SHOP_DB.prepare("UPDATE shop_orders SET ip_hash=NULL WHERE created_at<? AND status NOT IN ('creating','open','processing') AND ip_hash IS NOT NULL").bind(nowSeconds()-30*86400).run();
  return result;
}
