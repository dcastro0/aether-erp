-- name: CreateProduct :one
INSERT INTO products (
  organization_id, name, description, price, stock_quantity, sku
) VALUES (
  $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: ListProducts :many
SELECT * FROM products
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: GetProductMetrics :one
SELECT
  COUNT(*) as total_products,
  SUM(CASE WHEN stock_quantity < 5 THEN 1 ELSE 0 END)::BIGINT as low_stock_count
FROM products
WHERE organization_id = $1;