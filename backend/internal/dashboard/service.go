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

type ActivityLog struct {
	ID        string `json:"id"`
	Action    string `json:"action"`
	UserName  string `json:"user_name"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type PaymentMethodSales struct {
	Method      string  `json:"method"`
	TotalOrders int32   `json:"total_orders"`
	TotalAmount float64 `json:"total_amount"`
}

type TopSellingProduct struct {
	Name              string  `json:"name"`
	TotalQuantitySold int32   `json:"total_quantity_sold"`
	TotalRevenue      float64 `json:"total_revenue"`
}

type CashFlowPoint struct {
	Period  string  `json:"period"`
	Receita float64 `json:"receita"`
	Despesa float64 `json:"despesa"`
	Saldo   float64 `json:"saldo"`
}

type StockHealth struct {
	HealthyCount    int32 `json:"healthy_count"`
	LowStockCount   int32 `json:"low_stock_count"`
	OutOfStockCount int32 `json:"out_of_stock_count"`
}

type MetricsResponse struct {
	TotalRevenue         float64              `json:"total_revenue"`
	SalesCount           int32                `json:"sales_count"`
	CustomersCount       int32                `json:"customers_count"`
	LowStockCount        int32                `json:"low_stock_count"`
	TotalProductsCount   int32                `json:"total_products_count"`
	SalesOverTime        []DailySales         `json:"sales_over_time"`
	RecentActivity       []ActivityLog        `json:"recent_activity"`
	SalesByPaymentMethod []PaymentMethodSales `json:"sales_by_payment_method"`
	TopProducts          []TopSellingProduct  `json:"top_products"`
	CashFlowMonthly      []CashFlowPoint      `json:"cash_flow_monthly"`
	StockHealth          StockHealth          `json:"stock_health"`
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

	totalProducts, err := s.q.GetTotalProductsCount(ctx, pgOrgID)
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

	activityRows, err := s.q.GetRecentActivity(ctx, pgOrgID)
	if err != nil {
		return MetricsResponse{}, err
	}

	var recentActivity []ActivityLog
	for _, r := range activityRows {
		timeStr := ""
		if r.CreatedAt.Valid {
			timeStr = r.CreatedAt.Time.Format("2006-01-02 15:04:05")
		}
		
		idStr := ""
		if r.ID.Valid {
			idBytes := [16]byte(r.ID.Bytes)
			idStr = uuid.UUID(idBytes).String()
		}

		recentActivity = append(recentActivity, ActivityLog{
			ID:        idStr,
			Action:    r.Action,
			UserName:  r.UserName,
			Status:    r.Status,
			CreatedAt: timeStr,
		})
	}

	paymentMethodRows, err := s.q.GetSalesByPaymentMethod(ctx, pgOrgID)
	if err != nil {
		return MetricsResponse{}, err
	}

	var paymentMethodSales []PaymentMethodSales
	for _, r := range paymentMethodRows {
		paymentMethodSales = append(paymentMethodSales, PaymentMethodSales{
			Method:      r.PaymentMethod,
			TotalOrders: r.TotalOrders,
			TotalAmount: r.TotalAmount,
		})
	}

	topProductRows, err := s.q.GetTopSellingProducts(ctx, pgOrgID)
	if err != nil {
		return MetricsResponse{}, err
	}

	var topProducts []TopSellingProduct
	for _, r := range topProductRows {
		topProducts = append(topProducts, TopSellingProduct{
			Name:              r.ProductName,
			TotalQuantitySold: r.TotalQuantitySold,
			TotalRevenue:      r.TotalRevenue,
		})
	}

	// 1. Fetch Real Cash Flow Monthly Data from financial_transactions
	var cashFlowMonthly []CashFlowPoint
	cfQuery := `
		SELECT 
			TO_CHAR(due_date, 'Mon') AS period,
			COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS receita,
			COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS despesa
		FROM financial_transactions
		WHERE organization_id = $1
		GROUP BY TO_CHAR(due_date, 'Mon'), DATE_TRUNC('month', due_date)
		ORDER BY DATE_TRUNC('month', due_date) ASC
		LIMIT 6
	`
	cfRows, err := s.db.Query(ctx, cfQuery, orgID)
	if err == nil {
		defer cfRows.Close()
		for cfRows.Next() {
			var pt CashFlowPoint
			if scanErr := cfRows.Scan(&pt.Period, &pt.Receita, &pt.Despesa); scanErr == nil {
				pt.Saldo = pt.Receita - pt.Despesa
				cashFlowMonthly = append(cashFlowMonthly, pt)
			}
		}
	}

	// 2. Fetch Real Stock Health Counts from products table
	var stockHealth StockHealth
	shQuery := `
		SELECT
			COALESCE(COUNT(*) FILTER (WHERE stock_quantity >= 5), 0) AS healthy,
			COALESCE(COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity < 5), 0) AS low_stock,
			COALESCE(COUNT(*) FILTER (WHERE stock_quantity = 0), 0) AS out_of_stock
		FROM products
		WHERE organization_id = $1
	`
	err = s.db.QueryRow(ctx, shQuery, orgID).Scan(
		&stockHealth.HealthyCount,
		&stockHealth.LowStockCount,
		&stockHealth.OutOfStockCount,
	)

	return MetricsResponse{
		TotalRevenue:         row.TotalRevenue,
		SalesCount:           row.SalesCount,
		CustomersCount:       row.CustomersCount,
		LowStockCount:        row.LowStockCount,
		TotalProductsCount:   totalProducts,
		SalesOverTime:        salesOverTime,
		RecentActivity:       recentActivity,
		SalesByPaymentMethod: paymentMethodSales,
		TopProducts:          topProducts,
		CashFlowMonthly:      cashFlowMonthly,
		StockHealth:          stockHealth,
	}, nil
}