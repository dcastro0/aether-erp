-- name: GetDashboardMetrics :one
SELECT
    COALESCE((SELECT SUM(total_amount) FROM orders o WHERE o.organization_id = $1::uuid AND o.status = 'completed'), 0)::FLOAT AS total_revenue,
    (SELECT COUNT(*) FROM orders o2 WHERE o2.organization_id = $1::uuid AND o2.status = 'completed')::INT AS sales_count,
    (SELECT COUNT(*) FROM customers c WHERE c.organization_id = $1::uuid)::INT AS customers_count,
    (SELECT COUNT(*) FROM products p WHERE p.organization_id = $1::uuid AND p.stock_quantity < 5)::INT AS low_stock_count;

-- name: GetSalesOverTime :many
SELECT
    DATE(created_at)::TEXT AS sale_date,
    COALESCE(SUM(total_amount), 0)::FLOAT AS total_sales
FROM orders
WHERE organization_id = $1::uuid
  AND status = 'completed'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) ASC;