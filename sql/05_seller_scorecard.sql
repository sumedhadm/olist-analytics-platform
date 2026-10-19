CREATE OR REPLACE VIEW v_seller_scorecard AS
WITH seller_orders AS (
  -- one row per seller per order, so multi-item orders are not double counted
  SELECT oi.seller_id, o.order_id, o.order_status,
         o.order_delivered_customer_date, o.order_estimated_delivery_date,
         SUM(oi.price) AS revenue
  FROM order_items oi
  JOIN orders o ON o.order_id = oi.order_id
  GROUP BY oi.seller_id, o.order_id, o.order_status,
           o.order_delivered_customer_date, o.order_estimated_delivery_date
),
reviews AS (
  SELECT order_id, AVG(review_score) AS score
  FROM order_reviews
  GROUP BY order_id
),
agg AS (
  SELECT so.seller_id,
    COUNT(*)::int AS total_orders,
    COUNT(*) FILTER (WHERE so.order_status = 'delivered')::int AS delivered_orders,
    COALESCE(SUM(so.revenue) FILTER (WHERE so.order_status = 'delivered'), 0) AS revenue,
    COUNT(*) FILTER (WHERE so.order_status = 'delivered'
                       AND so.order_delivered_customer_date IS NOT NULL) AS dated_orders,
    COUNT(*) FILTER (WHERE so.order_status = 'delivered'
                       AND so.order_delivered_customer_date > so.order_estimated_delivery_date) AS late_orders,
    COUNT(*) FILTER (WHERE so.order_status = 'canceled') AS canceled_orders,
    AVG(r.score) FILTER (WHERE so.order_status = 'delivered') AS avg_review
  FROM seller_orders so
  LEFT JOIN reviews r ON r.order_id = so.order_id
  GROUP BY so.seller_id
),
scored AS (
  SELECT a.seller_id,
         s.seller_state AS state,
         s.seller_city AS city,
         a.delivered_orders,
         ROUND(a.revenue, 2)::float8 AS revenue,
         ROUND(100.0 * a.late_orders / NULLIF(a.dated_orders, 0), 2)::float8 AS late_pct,
         ROUND(100.0 * a.canceled_orders / a.total_orders, 2)::float8 AS cancel_pct,
         ROUND(a.avg_review, 2)::float8 AS avg_review
  FROM agg a
  JOIN sellers s ON s.seller_id = a.seller_id
  WHERE a.delivered_orders >= 30   -- ignore sellers with too few orders to judge
)
SELECT *,
  CASE
    WHEN late_pct > 15 OR avg_review < 3.5 THEN 'red'
    WHEN late_pct <= 5 AND avg_review >= 4.2 THEN 'green'
    ELSE 'amber'
  END AS status
FROM scored
ORDER BY revenue DESC;