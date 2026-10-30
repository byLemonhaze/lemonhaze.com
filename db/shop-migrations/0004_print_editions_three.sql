-- Keep all existing reservations and sales. This fails rather than reducing an oversubscribed edition.
UPDATE shop_inventory SET stock_limit=3 WHERE product_id LIKE 'print%';
