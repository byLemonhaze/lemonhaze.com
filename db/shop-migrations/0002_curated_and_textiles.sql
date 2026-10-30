-- Preserve allocations for the six retained compositions. Display numbers are not IDs.
ALTER TABLE shop_inventory ADD COLUMN stock_limit INTEGER NOT NULL DEFAULT 8 CHECK(stock_limit BETWEEN 1 AND 8 AND allocated <= stock_limit);
INSERT INTO shop_inventory(mode,product_id,stock_limit)
VALUES
('test','print10',8),
('test','print11',8),
('test','print12',8),
('test','textile1',1),
('test','textile2',1),
('test','textile3',1),
('live','print10',8),
('live','print11',8),
('live','print12',8),
('live','textile1',1),
('live','textile2',1),
('live','textile3',1);
DROP TRIGGER reserve_signed;
CREATE TRIGGER reserve_signed BEFORE INSERT ON shop_items
WHEN NEW.offer_id = 'signed'
BEGIN
 UPDATE shop_inventory SET allocated = allocated + NEW.quantity
 WHERE mode = (SELECT mode FROM shop_orders WHERE id=NEW.order_id)
 AND product_id=NEW.product_id AND allocated + NEW.quantity <= stock_limit;
 SELECT CASE WHEN changes() != 1 THEN RAISE(ABORT,'SIGNED_EDITION_UNAVAILABLE') END;
END;
