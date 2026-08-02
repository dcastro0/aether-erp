package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) LogFromCtx(c *fiber.Ctx, action, entity, entityID string, details map[string]interface{}) {
	claims, _ := c.Locals("claims").(*middleware.OrgClaims)
	if claims == nil {
		return
	}

	ip := c.IP()
	if xfp := c.Get("X-Forwarded-For"); xfp != "" {
		ip = xfp
	}

	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var userName, userEmail string
		_ = s.db.QueryRow(bgCtx, "SELECT full_name, email FROM users WHERE id = $1", claims.UserID).Scan(&userName, &userEmail)

		if userName == "" {
			userName = "Usuário " + claims.Role
		}

		s.Log(CreateAuditLogParams{
			OrganizationID: claims.OrgID,
			UserID:         &claims.UserID,
			UserEmail:      userEmail,
			UserName:       userName,
			Action:         action,
			Entity:         entity,
			EntityID:       entityID,
			Status:         "SUCCESS",
			Details:        details,
			IPAddress:      ip,
		})
	}()
}

func (s *Service) Log(params CreateAuditLogParams) {
	// Async / Non-blocking audit logging
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		detailsJSON, _ := json.Marshal(params.Details)
		if detailsJSON == nil {
			detailsJSON = []byte("{}")
		}

		status := params.Status
		if status == "" {
			status = "SUCCESS"
		}

		query := `
			INSERT INTO activity_logs (
				organization_id, user_id, user_email, user_name,
				action, entity, entity_id, status, details, ip_address, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
		`

		var userIDVal *uuid.UUID
		if params.UserID != nil && *params.UserID != uuid.Nil {
			userIDVal = params.UserID
		}

		_, _ = s.db.Exec(bgCtx, query,
			params.OrganizationID,
			userIDVal,
			params.UserEmail,
			params.UserName,
			params.Action,
			params.Entity,
			params.EntityID,
			status,
			detailsJSON,
			params.IPAddress,
		)
	}()
}

func (s *Service) List(ctx context.Context, filter AuditFilter) ([]AuditLog, int, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 50
	}
	offset := (filter.Page - 1) * filter.Limit

	whereClause := []string{"organization_id = $1"}
	args := []interface{}{filter.OrganizationID}
	argIdx := 2

	if filter.Entity != "" && filter.Entity != "all" {
		whereClause = append(whereClause, fmt.Sprintf("entity = $%d", argIdx))
		args = append(args, filter.Entity)
		argIdx++
	}

	if filter.Action != "" && filter.Action != "all" {
		whereClause = append(whereClause, fmt.Sprintf("action = $%d", argIdx))
		args = append(args, filter.Action)
		argIdx++
	}

	if filter.UserID != "" {
		if uID, err := uuid.Parse(filter.UserID); err == nil {
			whereClause = append(whereClause, fmt.Sprintf("user_id = $%d", argIdx))
			args = append(args, uID)
			argIdx++
		}
	}

	if filter.StartDate != "" {
		whereClause = append(whereClause, fmt.Sprintf("created_at >= $%d::timestamptz", argIdx))
		args = append(args, filter.StartDate)
		argIdx++
	}

	if filter.EndDate != "" {
		whereClause = append(whereClause, fmt.Sprintf("created_at <= $%d::timestamptz", argIdx))
		args = append(args, filter.EndDate)
		argIdx++
	}

	if filter.Search != "" {
		searchPattern := "%" + strings.ToLower(filter.Search) + "%"
		whereClause = append(whereClause, fmt.Sprintf("(LOWER(action) LIKE $%d OR LOWER(user_name) LIKE $%d OR LOWER(user_email) LIKE $%d OR LOWER(ip_address) LIKE $%d)", argIdx, argIdx, argIdx, argIdx))
		args = append(args, searchPattern)
		argIdx++
	}

	whereStmt := strings.Join(whereClause, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM activity_logs WHERE %s", whereStmt)
	var total int
	err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT id, organization_id, user_id, COALESCE(user_email, ''), user_name,
		       action, COALESCE(entity, 'system'), COALESCE(entity_id, ''), status,
		       COALESCE(details, '{}'::jsonb), COALESCE(ip_address, ''), created_at
		FROM activity_logs
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereStmt, argIdx, argIdx+1)

	args = append(args, filter.Limit, offset)

	rows, err := s.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	logs := []AuditLog{}
	for rows.Next() {
		var l AuditLog
		var detailsRaw []byte
		err := rows.Scan(
			&l.ID, &l.OrganizationID, &l.UserID, &l.UserEmail, &l.UserName,
			&l.Action, &l.Entity, &l.EntityID, &l.Status,
			&detailsRaw, &l.IPAddress, &l.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}

		if len(detailsRaw) > 0 {
			_ = json.Unmarshal(detailsRaw, &l.Details)
		}
		logs = append(logs, l)
	}

	return logs, total, nil
}
