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

-- name: GetRecentActivity :many
SELECT
    id, action, user_name, status, created_at
FROM activity_logs
WHERE organization_id = $1::uuid
ORDER BY created_at DESC
LIMIT 5;

-- name: GetTotalProductsCount :one
SELECT COUNT(*)::INT AS total_products
FROM products
WHERE organization_id = $1::uuid;

-- name: GetSalesByPaymentMethod :many
SELECT
    COALESCE(payment_method, 'unknown')::TEXT AS payment_method,
    COUNT(*)::INT AS total_orders,
    SUM(total_amount)::FLOAT AS total_amount
FROM orders
WHERE organization_id = $1::uuid
  AND status = 'completed'
GROUP BY COALESCE(payment_method, 'unknown')
ORDER BY total_amount DESC;

-- name: GetTopSellingProducts :many
SELECT
    p.name::TEXT AS product_name,
    SUM(oi.quantity)::INT AS total_quantity_sold,
    SUM(oi.total_price)::FLOAT AS total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
WHERE o.organization_id = $1::uuid
  AND o.status = 'completed'
GROUP BY p.id, p.name
ORDER BY total_quantity_sold DESC
LIMIT 5;