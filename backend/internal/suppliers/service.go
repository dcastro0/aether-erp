package suppliers

import (
	"context"
	"time"

	"github.com/dcastro0/aether-backend/internal/audit"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Supplier struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	TradeName string    `json:"trade_name,omitempty"`
	Document  string    `json:"document,omitempty"`
	Email     string    `json:"email,omitempty"`
	Phone     string    `json:"phone,omitempty"`
	Address   string    `json:"address,omitempty"`
	Notes     string    `json:"notes,omitempty"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateSupplierDTO struct {
	Name      string `json:"name" validate:"required,min=2"`
	TradeName string `json:"trade_name"`
	Document  string `json:"document"`
	Email     string `json:"email" validate:"omitempty,email"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	Notes     string `json:"notes"`
}

type Service struct {
	db    *pgxpool.Pool
	audit *audit.Service
}

func NewService(pool *pgxpool.Pool, auditService *audit.Service) *Service {
	return &Service{
		db:    pool,
		audit: auditService,
	}
}

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, dto CreateSupplierDTO) (Supplier, error) {
	query := `
		INSERT INTO suppliers (organization_id, name, trade_name, document, email, phone, address, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, name, COALESCE(trade_name, ''), COALESCE(document, ''), COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''), COALESCE(notes, ''), is_active, created_at
	`
	var sup Supplier
	err := s.db.QueryRow(ctx, query, orgID, dto.Name, dto.TradeName, dto.Document, dto.Email, dto.Phone, dto.Address, dto.Notes).Scan(
		&sup.ID, &sup.Name, &sup.TradeName, &sup.Document, &sup.Email, &sup.Phone, &sup.Address, &sup.Notes, &sup.IsActive, &sup.CreatedAt,
	)
	return sup, err
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]Supplier, error) {
	query := `
		SELECT id, name, COALESCE(trade_name, ''), COALESCE(document, ''), COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''), COALESCE(notes, ''), is_active, created_at
		FROM suppliers
		WHERE organization_id = $1
		ORDER BY name ASC
	`
	rows, err := s.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Supplier
	for rows.Next() {
		var sup Supplier
		if scanErr := rows.Scan(&sup.ID, &sup.Name, &sup.TradeName, &sup.Document, &sup.Email, &sup.Phone, &sup.Address, &sup.Notes, &sup.IsActive, &sup.CreatedAt); scanErr == nil {
			list = append(list, sup)
		}
	}
	if list == nil {
		list = []Supplier{}
	}
	return list, nil
}

func (s *Service) Update(ctx context.Context, orgID uuid.UUID, supplierID uuid.UUID, dto CreateSupplierDTO) (Supplier, error) {
	query := `
		UPDATE suppliers
		SET name = $1, trade_name = $2, document = $3, email = $4, phone = $5, address = $6, notes = $7, updated_at = NOW()
		WHERE id = $8 AND organization_id = $9
		RETURNING id, name, COALESCE(trade_name, ''), COALESCE(document, ''), COALESCE(email, ''), COALESCE(phone, ''), COALESCE(address, ''), COALESCE(notes, ''), is_active, created_at
	`
	var sup Supplier
	err := s.db.QueryRow(ctx, query, dto.Name, dto.TradeName, dto.Document, dto.Email, dto.Phone, dto.Address, dto.Notes, supplierID, orgID).Scan(
		&sup.ID, &sup.Name, &sup.TradeName, &sup.Document, &sup.Email, &sup.Phone, &sup.Address, &sup.Notes, &sup.IsActive, &sup.CreatedAt,
	)
	return sup, err
}

func (s *Service) Delete(ctx context.Context, orgID uuid.UUID, supplierID uuid.UUID) error {
	query := `DELETE FROM suppliers WHERE id = $1 AND organization_id = $2`
	_, err := s.db.Exec(ctx, query, supplierID, orgID)
	return err
}
