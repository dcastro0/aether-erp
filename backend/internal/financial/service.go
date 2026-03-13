package financial

import (
	"context"
	"fmt"
	"time"

	"github.com/dcastro0/aether-backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateTransactionRequest struct {
	Type          string    `json:"type" validate:"required,oneof=payable receivable"`
	Status        string    `json:"status" validate:"required,oneof=pending paid overdue canceled"`
	Amount        float64   `json:"amount" validate:"gt=0"`
	Description   string    `json:"description" validate:"required"`
	DueDate       time.Time `json:"due_date" validate:"required"`
	ReferenceType string    `json:"reference_type"`
	ReferenceID   uuid.UUID `json:"reference_id"`
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

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, req CreateTransactionRequest) (db.FinancialTransaction, error) {
	pgOrgID := pgtype.UUID{Bytes: orgID, Valid: true}

	amountNumeric := pgtype.Numeric{}
	if err := amountNumeric.Scan(fmt.Sprintf("%.2f", req.Amount)); err != nil {
		return db.FinancialTransaction{}, fmt.Errorf("erro ao processar valor: %w", err)
	}

	pgDueDate := pgtype.Date{Time: req.DueDate, Valid: true}
	var pgReferenceID pgtype.UUID
	if req.ReferenceID != uuid.Nil {
		pgReferenceID = pgtype.UUID{Bytes: req.ReferenceID, Valid: true}
	}

	return s.q.CreateFinancialTransaction(ctx, db.CreateFinancialTransactionParams{
		OrganizationID: pgOrgID,
		Type:           req.Type,
		Status:         req.Status,
		Amount:         amountNumeric,
		Description:    req.Description,
		DueDate:        pgDueDate,
		ReferenceType:  pgtype.Text{String: req.ReferenceType, Valid: req.ReferenceType != ""},
		ReferenceID:    pgReferenceID,
	})
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID, filterType string, filterStatus string) ([]db.FinancialTransaction, error) {
	pgOrgID := pgtype.UUID{Bytes: orgID, Valid: true}
	
	pgType := pgtype.Text{}
	if filterType != "" {
		pgType = pgtype.Text{String: filterType, Valid: true}
	}
	
	pgStatus := pgtype.Text{}
	if filterStatus != "" {
		pgStatus = pgtype.Text{String: filterStatus, Valid: true}
	}

	return s.q.ListFinancialTransactions(ctx, db.ListFinancialTransactionsParams{
		OrganizationID: pgOrgID,
		Type:           pgType,
		Status:         pgStatus,
	})
}

func (s *Service) Pay(ctx context.Context, orgID uuid.UUID, id uuid.UUID) (db.FinancialTransaction, error) {
	pgOrgID := pgtype.UUID{Bytes: orgID, Valid: true}
	pgID := pgtype.UUID{Bytes: id, Valid: true}

	return s.q.UpdateFinancialTransactionStatus(ctx, db.UpdateFinancialTransactionStatusParams{
		ID:             pgID,
		OrganizationID: pgOrgID,
		Status:         "paid",
		PaidAt:         pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
}

func (s *Service) GetSummary(ctx context.Context, orgID uuid.UUID) (db.GetFinancialSummaryRow, error) {
	return s.q.GetFinancialSummary(ctx, pgtype.UUID{Bytes: orgID, Valid: true})
}
