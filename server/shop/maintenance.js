import {SESSION_EXPANSION,stripeClient,reconcileSession} from './stripe.js';
import {deliverReviewAlerts} from './alerts.js';
import {nowSeconds} from './store.js';
// A scheduled worker repairs missed notifications. It never infers payment or
// expiry from the local clock, and never logs customer data or Stripe responses.
export async function reconcileOutstanding(env,client=stripeClient(env)) {
  const mode=env.SHOP_MODE==='live'?'live':'test';
  if(!new RegExp(`^(sk|rk)_${mode}_`).test(env.STRIPE_SECRET_KEY||''))throw new Error('Payment mode mismatch.');
  const orders=await env.SHOP_DB.prepare("SELECT * FROM shop_orders WHERE mode=? AND session_id IS NOT NULL AND status IN ('open','processing') ORDER BY updated_at LIMIT 10").bind(mode).all();
  const result={checked:0,needsReview:0};
  for(const order of orders.results){
    try{await reconcileSession(env.SHOP_DB,order,await client.checkout.sessions.retrieve(order.session_id,SESSION_EXPANSION));result.checked++;}
    catch{
      result.needsReview++;
      await env.SHOP_DB.batch([
        env.SHOP_DB.prepare('UPDATE shop_orders SET updated_at=?,needs_review=1 WHERE id=?').bind(nowSeconds(),order.id),
        env.SHOP_DB.prepare("INSERT INTO shop_review_alerts(order_id,reason,created_at) VALUES (?,'STRIPE_RECONCILIATION',?) ON CONFLICT(order_id) DO NOTHING").bind(order.id,nowSeconds())
      ]);
    }
  }
  const unresolved=await env.SHOP_DB.prepare("SELECT count(*) AS count FROM shop_orders WHERE mode=? AND session_id IS NULL AND status='creating' AND created_at<?").bind(mode,nowSeconds()-3600).first();
  result.needsReview+=unresolved.count;
  await env.SHOP_DB.prepare("INSERT INTO shop_review_alerts(order_id,reason,created_at) SELECT id,'CHECKOUT_CREATION',? FROM shop_orders WHERE mode=? AND session_id IS NULL AND status='creating' AND created_at<? ON CONFLICT(order_id) DO NOTHING").bind(nowSeconds(),mode,nowSeconds()-3600).run();
  await env.SHOP_DB.prepare("UPDATE shop_orders SET needs_review=1 WHERE mode=? AND session_id IS NULL AND status='creating' AND created_at<?").bind(mode,nowSeconds()-3600).run();
  // Retain the network identifier only for the abuse window, plus active holds.
  await env.SHOP_DB.prepare("UPDATE shop_orders SET ip_hash=NULL WHERE created_at<? AND status NOT IN ('creating','open','processing') AND ip_hash IS NOT NULL").bind(nowSeconds()-30*86400).run();
  return result;
}

// A database lease prevents overlapping cron retries. A stale running heartbeat
// remains visible when an invocation is terminated before its catch handler.
export async function runMaintenance(env,dependencies={}) {
  const mode=env.SHOP_MODE==='live'?'live':'test', now=nowSeconds();
  const lease=await env.SHOP_DB.prepare("INSERT INTO shop_monitor(mode,started_at,status) VALUES (?,?,'running') ON CONFLICT(mode) DO UPDATE SET started_at=excluded.started_at,finished_at=NULL,status='running' WHERE shop_monitor.started_at<? RETURNING mode").bind(mode,now,now-300).first();
  if(!lease)return {skipped:true};
  try {
    const result=await reconcileOutstanding(env,dependencies.stripe||stripeClient(env,{timeout:8000,maxNetworkRetries:0}));
    const alerts=await deliverReviewAlerts(env,dependencies.fetcher||fetch);
    await env.SHOP_DB.prepare("UPDATE shop_monitor SET finished_at=?,status='ok',checked=?,needs_review=?,delivered=?,alerts_configured=? WHERE mode=?").bind(nowSeconds(),result.checked,result.needsReview,alerts.delivered,Number(alerts.configured),mode).run();
    return {...result,...alerts};
  } catch {
    await env.SHOP_DB.prepare("UPDATE shop_monitor SET finished_at=?,status='failed' WHERE mode=?").bind(nowSeconds(),mode).run();
    throw new Error('Shop monitoring failed.');
  }
}
