-- name: CreateOrganization :one
INSERT INTO organizations (name, slug, document_number)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetOrganizationBySlug :one
SELECT * FROM organizations
WHERE slug = $1 LIMIT 1;

-- name: AddUserToOrganization :one
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserOrganizations :many
SELECT o.id, o.name, o.slug, om.role
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = $1;