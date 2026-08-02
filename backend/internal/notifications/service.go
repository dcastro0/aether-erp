package notifications

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NotificationItem struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`     // "stock", "financial", "security"
	Severity  string    `json:"severity"` // "warning", "error", "info"
	Link      string    `json:"link"`
	CreatedAt time.Time `json:"created_at"`
}

type NotificationSummary struct {
	TotalUnread int                `json:"total_unread"`
	Items       []NotificationItem `json:"items"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{db: pool}
}

func (s *Service) GetAlerts(ctx context.Context, orgID uuid.UUID) (NotificationSummary, error) {
	var summary NotificationSummary
	summary.Items = []NotificationItem{}

	// 1. Alertas de Estoque Baixo (stock_quantity <= min_stock_quantity)
	stockQuery := `
		SELECT id, name, stock_quantity, min_stock_quantity
		FROM products
		WHERE organization_id = $1 AND stock_quantity <= min_stock_quantity
		ORDER BY stock_quantity ASC
		LIMIT 10
	`
	rows, err := s.db.Query(ctx, stockQuery, orgID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id uuid.UUID
			var name string
			var stockQty, minQty int
			if err := rows.Scan(&id, &name, &stockQty, &minQty); err == nil {
				severity := "warning"
				if stockQty == 0 {
					severity = "error"
				}
				summary.Items = append(summary.Items, NotificationItem{
					ID:        "stock-" + id.String(),
					Title:     "Estoque Crítico: " + name,
					Message:   fmt.Sprintf("Apenas %d unidades em estoque (Estoque mínimo: %d).", stockQty, minQty),
					Type:      "stock",
					Severity:  severity,
					Link:      "/dashboard/products",
					CreatedAt: time.Now(),
				})
			}
		}
	}

	// 2. Alertas Financeiros (Contas a Pagar/Receber vencidas ou vencendo hoje)
	finQuery := `
		SELECT id, description, type, amount, due_date
		FROM financial_transactions
		WHERE organization_id = $1 AND status = 'pending' AND due_date <= CURRENT_DATE + INTERVAL '1 day'
		ORDER BY due_date ASC
		LIMIT 10
	`
	finRows, err := s.db.Query(ctx, finQuery, orgID)
	if err == nil {
		defer finRows.Close()
		for finRows.Next() {
			var id uuid.UUID
			var desc, txType string
			var amount float64
			var dueDate time.Time
			if err := finRows.Scan(&id, &desc, &txType, &amount, &dueDate); err == nil {
				label := "Conta a Pagar"
				if txType == "income" {
					label = "Conta a Receber"
				}
				summary.Items = append(summary.Items, NotificationItem{
					ID:        "fin-" + id.String(),
					Title:     fmt.Sprintf("%s Vencendo: %s", label, desc),
					Message:   fmt.Sprintf("Valor: R$ %.2f - Vencimento em %s", amount, dueDate.Format("02/01/2006")),
					Type:      "financial",
					Severity:  "warning",
					Link:      "/dashboard/financial",
					CreatedAt: dueDate,
				})
			}
		}
	}

	summary.TotalUnread = len(summary.Items)
	return summary, nil
}
