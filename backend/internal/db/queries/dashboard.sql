-- name: GetDashboardMetrics :one
SELECT
    COALESCE((SELECT SUM(total_amount) FROM orders o WHERE o.organization_id = $1::uuid AND o.status = 'completed'), 0)::FLOAT AS total_revenue,
    (SELECT COUNT(*) FROM orders o2 WHERE o2.organization_id = $1::uuid AND o2.status = 'completed')::INT AS sales_count,
    (SELECT COUNT(*) FROM customers c WHERE c.organization_id = $1::uuid)::INT AS customers_count,
    (SELECT COUNT(*) FROM products p WHERE p.organization_id = $1::uuid AND p.stock_quantity < 5)::INT AS low_stock_count;