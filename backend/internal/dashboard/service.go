package dashboard

import (
	"context"

	"github.com/dcastro0/aether-backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DailySales struct {
	Date  string  `json:"date"`
	Total float64 `json:"total"`
}

type MetricsResponse struct {
	TotalRevenue   float64      `json:"total_revenue"`
	SalesCount     int32        `json:"sales_count"`
	CustomersCount int32        `json:"customers_count"`
	LowStockCount  int32        `json:"low_stock_count"`
	SalesOverTime  []DailySales `json:"sales_over_time"`
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
	pgOrgID := pgtype.UUID{Bytes: orgID, Valid: true}

	row, err := s.q.GetDashboardMetrics(ctx, pgOrgID)
	if err != nil {
		return MetricsResponse{}, err
	}

	salesRows, err := s.q.GetSalesOverTime(ctx, pgOrgID)
	if err != nil {
		return MetricsResponse{}, err
	}

	var salesOverTime []DailySales
	for _, r := range salesRows {
		salesOverTime = append(salesOverTime, DailySales{
			Date:  r.SaleDate,
			Total: r.TotalSales,
		})
	}

	return MetricsResponse{
		TotalRevenue:   row.TotalRevenue,
		SalesCount:     row.SalesCount,
		CustomersCount: row.CustomersCount,
		LowStockCount:  row.LowStockCount,
		SalesOverTime:  salesOverTime,
	}, nil
}