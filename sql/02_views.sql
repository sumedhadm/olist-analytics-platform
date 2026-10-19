-- Overall numbers (delivered orders only)
CREATE OR REPLACE VIEW v_kpis AS
SELECT
  COUNT(DISTINCT o.order_id)::int AS total_orders,
  ROUND(SUM(oi.price), 2)::float8 AS revenue,
  ROUND(SUM(oi.price) / COUNT(DISTINCT o.order_id), 2)::float8 AS avg_order_value
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.order_status = 'delivered';

-- Revenue for each month
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  TO_CHAR(DATE_TRUNC('month', o.order_purchase_timestamp), 'YYYY-MM') AS month,
  ROUND(SUM(oi.price), 2)::float8 AS revenue,
  COUNT(DISTINCT o.order_id)::int AS orders
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.order_status = 'delivered'
GROUP BY 1
ORDER BY 1;

-- How many deliveries were late
CREATE OR REPLACE VIEW v_delivery_summary AS
SELECT
  COUNT(*)::int AS delivered_orders,
  (COUNT(*) FILTER (WHERE order_delivered_customer_date > order_estimated_delivery_date))::int AS late_orders,
  ROUND(100.0 * COUNT(*) FILTER (WHERE order_delivered_customer_date > order_estimated_delivery_date) / COUNT(*), 2)::float8 AS late_pct
FROM orders
WHERE order_status = 'delivered'
  AND order_delivered_customer_date IS NOT NULL;