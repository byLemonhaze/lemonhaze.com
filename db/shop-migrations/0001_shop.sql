-- No customer names, addresses, emails, phones, card details or webhook payloads.
CREATE TABLE IF NOT EXISTS shop_inventory (
  mode TEXT NOT NULL CHECK(mode IN ('test','live')),
  product_id TEXT NOT NULL,
  allocated INTEGER NOT NULL DEFAULT 0 CHECK(allocated BETWEEN 0 AND 8),
  PRIMARY KEY(mode, product_id)
);
INSERT OR IGNORE INTO shop_inventory(mode,product_id)
VALUES
('test','print1'),
('test','print2'),
('test','print3'),
('test','print4'),
('test','print5'),
('test','print6'),
('live','print1'),
('live','print2'),
('live','print3'),
('live','print4'),
('live','print5'),
('live','print6');
CREATE TABLE IF NOT EXISTS shop_orders (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK(mode IN ('test','live')),
  owner_hash TEXT NOT NULL,
  cart_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL CHECK(subtotal > 0),
  total INTEGER,
  session_id TEXT UNIQUE,
  params_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('creating','open','processing','paid','expired','failed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS shop_active_owner ON shop_orders(mode,owner_hash)
WHERE status IN ('creating','open','processing');
CREATE INDEX IF NOT EXISTS shop_orders_owner ON shop_orders(mode,owner_hash,created_at);
CREATE INDEX IF NOT EXISTS shop_orders_status ON shop_orders(mode,status,created_at);
CREATE TABLE IF NOT EXISTS shop_items (
  order_id TEXT NOT NULL REFERENCES shop_orders(id),
  product_id TEXT NOT NULL,
  offer_id TEXT NOT NULL CHECK(offer_id IN ('normal','signed')),
  quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 10 AND (offer_id != 'signed' OR quantity <= 8)),
  PRIMARY KEY(order_id,product_id,offer_id)
);
CREATE TRIGGER IF NOT EXISTS reserve_signed BEFORE INSERT ON shop_items
WHEN NEW.offer_id = 'signed'
BEGIN
  UPDATE shop_inventory SET allocated = allocated + NEW.quantity
  WHERE mode = (SELECT mode FROM shop_orders WHERE id=NEW.order_id)
    AND product_id=NEW.product_id AND allocated + NEW.quantity <= 8;
  SELECT CASE WHEN changes() != 1 THEN RAISE(ABORT,'SIGNED_EDITION_UNAVAILABLE') END;
END;
CREATE TRIGGER IF NOT EXISTS no_paid_release BEFORE UPDATE OF status ON shop_orders
WHEN OLD.status='paid' AND NEW.status!='paid'
BEGIN SELECT RAISE(ABORT,'PAID_EDITION_IS_PERMANENT'); END;
CREATE TRIGGER IF NOT EXISTS release_signed AFTER UPDATE OF status ON shop_orders
WHEN OLD.status IN ('creating','open','processing') AND NEW.status IN ('expired','failed')
BEGIN
  UPDATE shop_inventory SET allocated = allocated - COALESCE((
    SELECT quantity FROM shop_items WHERE order_id=NEW.id AND product_id=shop_inventory.product_id AND offer_id='signed'
  ),0) WHERE mode=NEW.mode;
END;
CREATE TABLE IF NOT EXISTS shop_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
