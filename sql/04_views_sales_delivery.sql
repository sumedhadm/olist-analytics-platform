-- Revenue per product category (English names)
CREATE OR REPLACE VIEW v_category_revenue AS
SELECT
  COALESCE(t.product_category_name_english, p.product_category_name, 'unknown') AS category,
  ROUND(SUM(oi.price), 2)::float8 AS revenue,
  COUNT(DISTINCT o.order_id)::int AS orders
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p ON p.product_id = oi.product_id
LEFT JOIN category_translation t ON t.product_category_name = p.product_category_name
WHERE o.order_status = 'delivered'
GROUP BY 1
ORDER BY revenue DESC;

-- Revenue per customer state
CREATE OR REPLACE VIEW v_state_revenue AS
SELECT
  c.customer_state AS state,
  ROUND(SUM(oi.price), 2)::float8 AS revenue,
  COUNT(DISTINCT o.order_id)::int AS orders
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.order_status = 'delivered'
GROUP BY 1
ORDER BY revenue DESC;

-- THE HOOK: how much does lateness hurt the review score?
CREATE OR REPLACE VIEW v_delay_impact AS
WITH order_review AS (
  -- one score per order, so orders with 2 reviews are not counted twice
  SELECT order_id, AVG(review_score) AS score
  FROM order_reviews
  GROUP BY order_id
),
delivered AS (
  SELECT order_id,
    EXTRACT(EPOCH FROM (order_delivered_customer_date - order_estimated_delivery_date)) / 86400 AS delay_days
  FROM orders
  WHERE order_status = 'delivered' AND order_delivered_customer_date IS NOT NULL
)
SELECT
  CASE
    WHEN d.delay_days <= 0 THEN 'On time or early'
    WHEN d.delay_days <= 3 THEN 'Up to 3 days late'
    WHEN d.delay_days <= 7 THEN '3 to 7 days late'
    ELSE 'Over 7 days late'
  END AS bucket,
  COUNT(*)::int AS orders,
  ROUND(AVG(r.score), 2)::float8 AS avg_review
FROM delivered d
JOIN order_review r ON r.order_id = d.order_id
GROUP BY 1
ORDER BY MIN(d.delay_days);