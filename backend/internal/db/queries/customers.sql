-- name: CreateCustomer :one
INSERT INTO customers (
  organization_id, name, email, phone, document, type
) VALUES (
  $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: ListCustomers :many
SELECT * FROM customers
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateCustomer :one
UPDATE customers
SET name = $3, email = $4, phone = $5, document = $6, type = $7, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: DeleteCustomer :exec
DELETE FROM customers
WHERE id = $1 AND organization_id = $2;