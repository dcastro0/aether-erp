-- name: CreateUser :one
INSERT INTO users (email, password_hash, full_name)
VALUES ($1, $2, $3)
RETURNING id, email, full_name, created_at;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id;

-- name: UpdateUserName :one
UPDATE users SET full_name = $2, updated_at = NOW() WHERE id = $1 RETURNING id, email, full_name, created_at;

-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1;

