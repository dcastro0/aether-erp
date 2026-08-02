package financial

import (
	"context"
	"fmt"
	"time"

	"github.com/dcastro0/aether-backend/internal/audit"
	"github.com/dcastro0/aether-backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateFinancialRequest struct {
	Type          string  `json:"type" validate:"required"` // income or expense
	Amount        float64 `json:"amount" validate:"required,min=0"`
	Description   string  `json:"description" validate:"required"`
	Status        string  `json:"status" validate:"required"` // pending or paid
	PaymentMethod string  `json:"payment_method"`
	DueDate       string  `json:"due_date" validate:"required"` // YYYY-MM-DD
}

type FinancialResponse struct {
	ID            uuid.UUID `json:"id"`
	Type          string    `json:"type"`
	Amount        float64   `json:"amount"`
	Description   string    `json:"description"`
	Status        string    `json:"status"`
	PaymentMethod string    `json:"payment_method"`
	DueDate       string    `json:"due_date"`
	PaidAt        string    `json:"paid_at,omitempty"`
	OrderID       string    `json:"order_id,omitempty"`
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

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, req CreateFinancialRequest) (FinancialResponse, error) {
	q := db.New(s.db)

	amountNum := pgtype.Numeric{}
	amountNum.Scan(fmt.Sprintf("%.2f", req.Amount))

	parsedDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return FinancialResponse{}, err
	}

	var paidAt pgtype.Timestamptz
	if req.Status == "paid" {
		paidAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
	}

	tx, err := q.CreateFinancialTransaction(ctx, db.CreateFinancialTransactionParams{
		OrganizationID: pgtype.UUID{Bytes: orgID, Valid: true},
		Type:           req.Type,
		Amount:         amountNum,
		Description:    req.Description,
		Status:         req.Status,
		PaymentMethod:  pgtype.Text{String: req.PaymentMethod, Valid: req.PaymentMethod != ""},
		DueDate:        pgtype.Date{Time: parsedDate, Valid: true},
		PaidAt:         paidAt,
	})
	if err != nil {
		return FinancialResponse{}, err
	}

	val, _ := tx.Amount.Float64Value()
	
	res := FinancialResponse{
		ID:            uuid.UUID(tx.ID.Bytes),
		Type:          tx.Type,
		Amount:        val.Float64,
		Description:   tx.Description,
		Status:        tx.Status,
		PaymentMethod: tx.PaymentMethod.String,
		DueDate:       tx.DueDate.Time.Format("2006-01-02"),
	}

	if tx.PaidAt.Valid {
		res.PaidAt = tx.PaidAt.Time.Format(time.RFC3339)
	}

	return res, nil
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]FinancialResponse, error) {
	q := db.New(s.db)
	
	rows, err := q.ListFinancialTransactions(ctx, pgtype.UUID{Bytes: orgID, Valid: true})
	if err != nil {
		return nil, err
	}

	var res []FinancialResponse
	for _, r := range rows {
		val, _ := r.Amount.Float64Value()
		
		item := FinancialResponse{
			ID:            uuid.UUID(r.ID.Bytes),
			Type:          r.Type,
			Amount:        val.Float64,
			Description:   r.Description,
			Status:        r.Status,
			PaymentMethod: r.PaymentMethod.String,
			DueDate:       r.DueDate.Time.Format("2006-01-02"),
		}

		if r.PaidAt.Valid {
			item.PaidAt = r.PaidAt.Time.Format(time.RFC3339)
		}
		if r.OrderID.Valid {
			item.OrderID = uuid.UUID(r.OrderID.Bytes).String()
		}

		res = append(res, item)
	}

	if res == nil {
		res = []FinancialResponse{}
	}

	return res, nil
}

func (s *Service) MarkAsPaid(ctx context.Context, orgID uuid.UUID, transactionID uuid.UUID) error {
	q := db.New(s.db)
	
	err := q.UpdateFinancialTransactionStatus(ctx, db.UpdateFinancialTransactionStatusParams{
		ID:             pgtype.UUID{Bytes: transactionID, Valid: true},
		OrganizationID: pgtype.UUID{Bytes: orgID, Valid: true},
		Status:         "paid",
		PaidAt:         pgtype.Timestamptz{Time: time.Now(), Valid: true},
	})
	
	return err
}
