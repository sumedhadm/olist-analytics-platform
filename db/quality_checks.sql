-- 1. Delivered orders that have no delivery date
SELECT COUNT(*) AS delivered_but_no_date
FROM orders
WHERE order_status = 'delivered' AND order_delivered_customer_date IS NULL;

-- 2. Orders that have more than one review
SELECT COUNT(*) AS orders_with_many_reviews
FROM (
  SELECT order_id FROM order_reviews GROUP BY order_id HAVING COUNT(*) > 1
) x;

-- 3. Products with no category
SELECT COUNT(*) AS products_without_category
FROM products WHERE product_category_name IS NULL;

-- 4. Orders by status
SELECT order_status, COUNT(*) AS n
FROM orders GROUP BY order_status ORDER BY n DESC;

-- 5. Date range of the data
SELECT MIN(order_purchase_timestamp) AS first_order,
       MAX(order_purchase_timestamp) AS last_order
FROM orders;