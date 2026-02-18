package customers

import (
	"context"

	"github.com/caio/aether-backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateCustomerRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"omitempty,email"`
	Phone    string `json:"phone"`
	Document string `json:"document"`
	Type     string `json:"type" validate:"oneof=individual company"`
}

type Service struct {
	q  *db.Queries
	db *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{
		q:  db.New(pool),
		db: pool,
	}
}

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, req CreateCustomerRequest) (db.Customer, error) {
	return s.q.CreateCustomer(ctx, db.CreateCustomerParams{
		OrganizationID: pgtype.UUID{Bytes: orgID, Valid: true},
		Name:           req.Name,
		Email:          pgtype.Text{String: req.Email, Valid: req.Email != ""},
		Phone:          pgtype.Text{String: req.Phone, Valid: req.Phone != ""},
		Document:       pgtype.Text{String: req.Document, Valid: req.Document != ""},
		Type:           pgtype.Text{String: req.Type, Valid: req.Type != ""},
	})
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]db.Customer, error) {
	return s.q.ListCustomers(ctx, pgtype.UUID{Bytes: orgID, Valid: true})
}