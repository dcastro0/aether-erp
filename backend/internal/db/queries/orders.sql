-- name: CreateOrder :one
INSERT INTO orders (
  organization_id, customer_id, total_amount, status, payment_method
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING id;

-- name: ListOrders :many
SELECT 
    o.id, 
    o.total_amount, 
    o.status, 
    o.created_at,
    o.payment_method,
    c.name as customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.organization_id = $1
ORDER BY o.created_at DESC;

-- name: CreateOrderItem :one
INSERT INTO order_items (
  order_id, product_id, quantity, unit_price, total_price
) VALUES (
  $1, $2, $3, $4, $5
) RETURNING id, order_id, product_id, quantity, unit_price, total_price;

-- name: GetOrderItems :many
SELECT 
    oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price, 
    p.name as product_name 
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = $1;

-- name: UpdateProductStock :exec
UPDATE products
SET stock_quantity = stock_quantity - $2
WHERE id = $1 AND stock_quantity >= $2;

-- name: AddProductStock :exec
UPDATE products
SET stock_quantity = stock_quantity + $2
WHERE id = $1;