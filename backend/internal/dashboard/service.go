package dashboard

import (
	"context"

	"github.com/caio/aether-backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MetricsResponse struct {
	TotalRevenue   float64 `json:"total_revenue"`
	SalesCount     int32   `json:"sales_count"`
	CustomersCount int32   `json:"customers_count"`
	LowStockCount  int32   `json:"low_stock_count"`
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

func (s *Service) GetMetrics(ctx context.Context, orgID uuid.UUID) (MetricsResponse, error) {
	row, err := s.q.GetDashboardMetrics(ctx, pgtype.UUID{Bytes: orgID, Valid: true})
	if err != nil {
		return MetricsResponse{}, err
	}

	return MetricsResponse{
		TotalRevenue:   row.TotalRevenue,
		SalesCount:     row.SalesCount,
		CustomersCount: row.CustomersCount,
		LowStockCount:  row.LowStockCount,
	}, nil
}