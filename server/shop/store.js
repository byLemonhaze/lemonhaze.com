export const nowSeconds=()=>Math.floor(Date.now()/1000);
export async function activeOrder(db,mode,owner) {
  return db.prepare("SELECT * FROM shop_orders WHERE mode=? AND owner_hash=? AND status IN ('creating','open','processing') ORDER BY created_at DESC LIMIT 1").bind(mode,owner).first();
}
export async function ownedOrder(db,mode,owner,id) {
  return db.prepare('SELECT * FROM shop_orders WHERE mode=? AND owner_hash=? AND id=?').bind(mode,owner,id).first();
}
export async function reserveOrder(db,order,cart) {
  // One atomic D1 transaction. A trigger rejects the entire basket if any signed edition would exceed its configured stock limit.
  await db.batch([
    db.prepare("INSERT INTO shop_orders(id,mode,owner_hash,cart_json,subtotal,params_json,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'creating',?,?)").bind(order.id,order.mode,order.owner,JSON.stringify(cart),order.subtotal,JSON.stringify(order.params),order.now,order.now),
    ...cart.map(i=>db.prepare('INSERT INTO shop_items(order_id,product_id,offer_id,quantity) VALUES(?,?,?,?)').bind(order.id,i.productId,i.offerId,i.quantity))
  ]);
}
export async function recordSession(db,order,session) {
  await db.prepare("UPDATE shop_orders SET session_id=?, status=CASE WHEN status='creating' THEN 'open' ELSE status END, updated_at=? WHERE id=? AND (session_id IS NULL OR session_id=?)").bind(session.id,nowSeconds(),order.id,session.id).run();
}
export async function publicOrder(order) {
  return {id:order.id,mode:order.mode,status:order.status,items:JSON.parse(order.cart_json),subtotal:order.subtotal,total:order.total};
}
