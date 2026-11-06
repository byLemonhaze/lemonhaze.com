-- New compositions only; preserve every existing allocation.
INSERT INTO shop_inventory(mode,product_id,stock_limit) VALUES
('test','print13',3),('test','print14',3),('test','print15',3),
('live','print13',3),('live','print14',3),('live','print15',3);
