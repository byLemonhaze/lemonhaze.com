import {nowSeconds} from './store.js';
// Durable outbox; no customer details, payment objects or credentials in payloads.
// The receiver must deduplicate by orderId (delivery is at least once).
export async function deliverReviewAlerts(env,fetcher=fetch) {
  if(!env.SHOP_ALERT_URL || !env.SHOP_ALERT_TOKEN)return {delivered:0,configured:false};
  const url=new URL(env.SHOP_ALERT_URL);
  if(url.protocol!=='https:' || url.username || url.password)throw new Error('Invalid alert endpoint');
  const rows=await env.SHOP_DB.prepare('SELECT order_id,reason FROM shop_review_alerts WHERE delivered_at IS NULL ORDER BY created_at LIMIT 50').all();
  let delivered=0;
  for(const row of rows.results) {
    try {
      const response=await fetcher(url.href,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.SHOP_ALERT_TOKEN}`},body:JSON.stringify({type:'shop.review',orderId:row.order_id,reason:row.reason}),signal:AbortSignal.timeout(8000)});
      if(!response.ok)continue;
      await env.SHOP_DB.prepare('UPDATE shop_review_alerts SET delivered_at=? WHERE order_id=? AND delivered_at IS NULL').bind(nowSeconds(),row.order_id).run();
      delivered++;
    } catch { /* Keep pending for the next scheduled attempt. */ }
  }
  return {delivered,configured:true};
}
