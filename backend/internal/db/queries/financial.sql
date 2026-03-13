-- name: CreateFinancialTransaction :one
INSERT INTO financial_transactions (
    organization_id, type, status, amount, description, due_date, paid_at, reference_type, reference_id
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) RETURNING *;

-- name: GetFinancialTransaction :one
SELECT * FROM financial_transactions
WHERE id = $1 AND organization_id = $2;

-- name: ListFinancialTransactions :many
SELECT * FROM financial_transactions
WHERE organization_id = $1
AND (sqlc.narg('type')::varchar IS NULL OR type = sqlc.narg('type'))
AND (sqlc.narg('status')::varchar IS NULL OR status = sqlc.narg('status'))
ORDER BY due_date ASC, created_at DESC;

-- name: UpdateFinancialTransactionStatus :one
UPDATE financial_transactions
SET
    status = $3,
    paid_at = $4,
    updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: GetFinancialSummary :one
SELECT
    COALESCE(SUM(CASE WHEN type = 'payable' AND status = 'pending' THEN amount ELSE 0 END), 0)::decimal AS total_payable_pending,
    COALESCE(SUM(CASE WHEN type = 'receivable' AND status = 'pending' THEN amount ELSE 0 END), 0)::decimal AS total_receivable_pending
FROM financial_transactions
WHERE organization_id = $1;
