package products

import (
	"context"
	"fmt"

	"github.com/caio/aether-backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateProductRequest struct {
	Name          string  `json:"name" validate:"required"`
	Price         float64 `json:"price" validate:"gte=0"`
	StockQuantity int     `json:"stock_quantity" validate:"gte=0"`
	Description   string  `json:"description"`
	SKU           string  `json:"sku"`
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

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, req CreateProductRequest) (db.Product, error) {
	// 1. Converter UUID para formato do driver
	pgOrgID := pgtype.UUID{Bytes: orgID, Valid: true}

	// 2. Converter Preço (Float -> String -> Numeric)
	// Isso evita erros de precisão e falhas de scan do driver
	priceNumeric := pgtype.Numeric{}
	if err := priceNumeric.Scan(fmt.Sprintf("%.2f", req.Price)); err != nil {
		return db.Product{}, fmt.Errorf("erro ao processar preço: %w", err)
	}

	// 3. Executar Query
	return s.q.CreateProduct(ctx, db.CreateProductParams{
		OrganizationID: pgOrgID,
		Name:           req.Name,
		Description:    pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Price:          priceNumeric,
		StockQuantity:  int32(req.StockQuantity),
		Sku:            pgtype.Text{String: req.SKU, Valid: req.SKU != ""},
	})
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]db.Product, error) {
	return s.q.ListProducts(ctx, pgtype.UUID{Bytes: orgID, Valid: true})
}

func (s *Service) GetMetrics(ctx context.Context, orgID uuid.UUID) (db.GetProductMetricsRow, error) {
	return s.q.GetProductMetrics(ctx, pgtype.UUID{Bytes: orgID, Valid: true})
}