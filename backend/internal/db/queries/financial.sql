-- name: CreateFinancialTransaction :one
INSERT INTO financial_transactions (
    organization_id, type, amount, description, status, payment_method, order_id, due_date, paid_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: ListFinancialTransactions :many
SELECT * FROM financial_transactions
WHERE organization_id = $1
ORDER BY due_date DESC;

-- name: UpdateFinancialTransactionStatus :exec
UPDATE financial_transactions
SET status = $2, paid_at = $3
WHERE id = $1 AND organization_id = $4;
