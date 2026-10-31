-- Pseudonymous abuse identifiers only; never store raw network addresses.
ALTER TABLE shop_orders ADD COLUMN ip_hash TEXT;
ALTER TABLE shop_orders ADD COLUMN needs_review INTEGER NOT NULL DEFAULT 0 CHECK(needs_review IN (0,1));
CREATE INDEX shop_orders_ip ON shop_orders(mode,ip_hash,created_at);
CREATE TRIGGER cap_network_reservations BEFORE INSERT ON shop_orders
WHEN NEW.ip_hash IS NOT NULL
BEGIN
 SELECT CASE WHEN (SELECT count(*) FROM shop_orders WHERE mode=NEW.mode AND ip_hash=NEW.ip_hash AND status IN ('creating','open','processing')) >= 2 THEN RAISE(ABORT,'NETWORK_RESERVATION_LIMIT') END;
 SELECT CASE WHEN (SELECT count(*) FROM shop_orders WHERE mode=NEW.mode AND ip_hash=NEW.ip_hash AND created_at > NEW.created_at-86400) >= 10 THEN RAISE(ABORT,'NETWORK_RESERVATION_LIMIT') END;
END;
CREATE TABLE shop_review_alerts (
 order_id TEXT PRIMARY KEY REFERENCES shop_orders(id),
 reason TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 delivered_at INTEGER
);

-- Basket-count caps alone still permit reserving the whole catalogue in one cart.
CREATE TRIGGER cap_network_units BEFORE INSERT ON shop_items
WHEN (SELECT ip_hash FROM shop_orders WHERE id=NEW.order_id) IS NOT NULL
BEGIN
 SELECT CASE WHEN COALESCE((SELECT sum(i.quantity) FROM shop_items i JOIN shop_orders o ON o.id=i.order_id WHERE o.mode=(SELECT mode FROM shop_orders WHERE id=NEW.order_id) AND o.ip_hash=(SELECT ip_hash FROM shop_orders WHERE id=NEW.order_id) AND o.status IN ('creating','open','processing')),0)+NEW.quantity > 6 THEN RAISE(ABORT,'NETWORK_RESERVATION_LIMIT') END;
END;
