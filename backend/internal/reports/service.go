package reports

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DREReport struct {
	GrossRevenue       float64   `json:"gross_revenue"`
	Deductions         float64   `json:"deductions"`
	NetRevenue         float64   `json:"net_revenue"`
	CostOfGoodsSold    float64   `json:"cost_of_goods_sold"`
	GrossProfit        float64   `json:"gross_profit"`
	OperatingExpenses  float64   `json:"operating_expenses"`
	NetProfit          float64   `json:"net_profit"`
	GrossMarginPercent float64   `json:"gross_margin_percent"`
	NetMarginPercent   float64   `json:"net_margin_percent"`
	StartDate          time.Time `json:"start_date"`
	EndDate            time.Time `json:"end_date"`
}

type ABCItem struct {
	ProductID      uuid.UUID `json:"product_id"`
	ProductName    string    `json:"product_name"`
	TotalQuantity  int       `json:"total_quantity"`
	TotalRevenue   float64   `json:"total_revenue"`
	SharePercent   float64   `json:"share_percent"`
	CumulatedShare float64   `json:"cumulated_share"`
	Class          string    `json:"class"`
}

type SellerPerformance struct {
	SellerID     uuid.UUID `json:"seller_id"`
	SellerName   string    `json:"seller_name"`
	TotalSales   int       `json:"total_sales"`
	TotalRevenue float64   `json:"total_revenue"`
	AvgTicket    float64   `json:"avg_ticket"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{db: pool}
}

func (s *Service) GetDRE(ctx context.Context, orgID uuid.UUID, startDate, endDate time.Time) (DREReport, error) {
	var report DREReport
	report.StartDate = startDate
	report.EndDate = endDate

	querySales := `
		SELECT COALESCE(SUM(total_amount), 0)
		FROM orders
		WHERE organization_id = $1 AND status = 'completed' AND created_at >= $2 AND created_at <= $3
	`
	err := s.db.QueryRow(ctx, querySales, orgID, startDate, endDate).Scan(&report.GrossRevenue)
	if err != nil {
		return report, err
	}

	report.Deductions = 0
	report.NetRevenue = report.GrossRevenue - report.Deductions

	queryCMV := `
		SELECT COALESCE(SUM(oi.quantity * COALESCE(p.price * 0.6, 0)), 0)
		FROM order_items oi
		JOIN orders o ON o.id = oi.order_id
		JOIN products p ON p.id = oi.product_id
		WHERE o.organization_id = $1 AND o.status = 'completed' AND o.created_at >= $2 AND o.created_at <= $3
	`
	_ = s.db.QueryRow(ctx, queryCMV, orgID, startDate, endDate).Scan(&report.CostOfGoodsSold)

	report.GrossProfit = report.NetRevenue - report.CostOfGoodsSold
	if report.NetRevenue > 0 {
		report.GrossMarginPercent = (report.GrossProfit / report.NetRevenue) * 100
	}

	queryExpenses := `
		SELECT COALESCE(SUM(amount), 0)
		FROM financial_transactions
		WHERE organization_id = $1 AND type = 'expense' AND created_at >= $2 AND created_at <= $3
	`
	_ = s.db.QueryRow(ctx, queryExpenses, orgID, startDate, endDate).Scan(&report.OperatingExpenses)

	report.NetProfit = report.GrossProfit - report.OperatingExpenses
	if report.NetRevenue > 0 {
		report.NetMarginPercent = (report.NetProfit / report.NetRevenue) * 100
	}

	return report, nil
}

func (s *Service) GetABC(ctx context.Context, orgID uuid.UUID) ([]ABCItem, error) {
	query := `
		SELECT p.id, p.name, COALESCE(SUM(oi.quantity), 0) as total_qty, COALESCE(SUM(oi.total_price), 0) as total_rev
		FROM products p
		LEFT JOIN order_items oi ON oi.product_id = p.id
		LEFT JOIN orders o ON o.id = oi.order_id AND o.status = 'completed'
		WHERE p.organization_id = $1
		GROUP BY p.id, p.name
		ORDER BY total_rev DESC
	`
	rows, err := s.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []ABCItem
	var grandTotal float64

	for rows.Next() {
		var item ABCItem
		if err := rows.Scan(&item.ProductID, &item.ProductName, &item.TotalQuantity, &item.TotalRevenue); err == nil {
			grandTotal += item.TotalRevenue
			items = append(items, item)
		}
	}

	var cumulated float64
	for i := range items {
		if grandTotal > 0 {
			items[i].SharePercent = (items[i].TotalRevenue / grandTotal) * 100
		} else {
			items[i].SharePercent = 0
		}
		cumulated += items[i].SharePercent
		items[i].CumulatedShare = cumulated

		if items[i].CumulatedShare <= 80 {
			items[i].Class = "A"
		} else if items[i].CumulatedShare <= 95 {
			items[i].Class = "B"
		} else {
			items[i].Class = "C"
		}
	}

	if items == nil {
		items = []ABCItem{}
	}

	return items, nil
}

func (s *Service) GetSellers(ctx context.Context, orgID uuid.UUID) ([]SellerPerformance, error) {
	query := `
		SELECT u.id, u.full_name, COUNT(o.id) as total_sales, COALESCE(SUM(o.total_amount), 0) as total_revenue
		FROM users u
		LEFT JOIN orders o ON o.seller_id = u.id AND o.status = 'completed'
		WHERE u.organization_id = $1
		GROUP BY u.id, u.full_name
		ORDER BY total_revenue DESC
	`
	rows, err := s.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []SellerPerformance
	for rows.Next() {
		var sp SellerPerformance
		if err := rows.Scan(&sp.SellerID, &sp.SellerName, &sp.TotalSales, &sp.TotalRevenue); err == nil {
			if sp.TotalSales > 0 {
				sp.AvgTicket = sp.TotalRevenue / float64(sp.TotalSales)
			}
			list = append(list, sp)
		}
	}
	if list == nil {
		list = []SellerPerformance{}
	}
	return list, nil
}
