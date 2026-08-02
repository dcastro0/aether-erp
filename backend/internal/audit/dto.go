package audit

import (
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID             uuid.UUID              `json:"id"`
	OrganizationID uuid.UUID              `json:"organization_id"`
	UserID         *uuid.UUID             `json:"user_id,omitempty"`
	UserEmail      string                 `json:"user_email,omitempty"`
	UserName       string                 `json:"user_name"`
	Action         string                 `json:"action"`
	Entity         string                 `json:"entity"`
	EntityID       string                 `json:"entity_id,omitempty"`
	Status         string                 `json:"status"`
	Details        map[string]interface{} `json:"details,omitempty"`
	IPAddress      string                 `json:"ip_address,omitempty"`
	CreatedAt      time.Time              `json:"created_at"`
}

type CreateAuditLogParams struct {
	OrganizationID uuid.UUID
	UserID         *uuid.UUID
	UserEmail      string
	UserName       string
	Action         string
	Entity         string
	EntityID       string
	Status         string
	Details        map[string]interface{}
	IPAddress      string
}

type AuditFilter struct {
	OrganizationID uuid.UUID
	UserID         string
	Entity         string
	Action         string
	StartDate      string
	EndDate        string
	Search         string
	Page           int
	Limit          int
}
