package purchases

import (
	"context"
	"fmt"
	"time"

	"github.com/dcastro0/aether-backend/internal/audit"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PurchaseOrderItem struct {
	ID              uuid.UUID `json:"id"`
	PurchaseOrderID uuid.UUID `json:"purchase_order_id"`
	ProductID       uuid.UUID `json:"product_id"`
	ProductName     string    `json:"product_name,omitempty"`
	Quantity        int       `json:"quantity"`
	UnitCost        float64   `json:"unit_cost"`
	TotalCost       float64   `json:"total_cost"`
}

type PurchaseOrder struct {
	ID               uuid.UUID           `json:"id"`
	SupplierID       uuid.UUID           `json:"supplier_id"`
	SupplierName     string              `json:"supplier_name,omitempty"`
	TotalAmount      float64             `json:"total_amount"`
	Status           string              `json:"status"`
	Notes            string              `json:"notes,omitempty"`
	ExpectedDelivery *time.Time          `json:"expected_delivery,omitempty"`
	ReceivedAt       *time.Time          `json:"received_at,omitempty"`
	CreatedAt        time.Time           `json:"created_at"`
	Items            []PurchaseOrderItem `json:"items,omitempty"`
}

type CreateOrderItemDTO struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,gt=0"`
	UnitCost  float64   `json:"unit_cost" validate:"required,gte=0"`
}

type CreatePurchaseOrderDTO struct {
	SupplierID       uuid.UUID            `json:"supplier_id" validate:"required"`
	Notes            string               `json:"notes"`
	ExpectedDelivery *time.Time           `json:"expected_delivery"`
	Items            []CreateOrderItemDTO `json:"items" validate:"required,min=1"`
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

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, dto CreatePurchaseOrderDTO) (PurchaseOrder, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PurchaseOrder{}, err
	}
	defer tx.Rollback(ctx)

	var totalAmount float64
	for _, item := range dto.Items {
		totalAmount += float64(item.Quantity) * item.UnitCost
	}

	queryOrder := `
		INSERT INTO purchase_orders (organization_id, supplier_id, total_amount, status, notes, expected_delivery)
		VALUES ($1, $2, $3, 'pending', $4, $5)
		RETURNING id, supplier_id, total_amount, status, COALESCE(notes, ''), expected_delivery, received_at, created_at
	`
	var order PurchaseOrder
	err = tx.QueryRow(ctx, queryOrder, orgID, dto.SupplierID, totalAmount, dto.Notes, dto.ExpectedDelivery).Scan(
		&order.ID, &order.SupplierID, &order.TotalAmount, &order.Status, &order.Notes, &order.ExpectedDelivery, &order.ReceivedAt, &order.CreatedAt,
	)
	if err != nil {
		return PurchaseOrder{}, err
	}

	queryItem := `
		INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, total_cost)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, purchase_order_id, product_id, quantity, unit_cost, total_cost
	`
	for _, item := range dto.Items {
		itemTotal := float64(item.Quantity) * item.UnitCost
		var itemResult PurchaseOrderItem
		err = tx.QueryRow(ctx, queryItem, order.ID, item.ProductID, item.Quantity, item.UnitCost, itemTotal).Scan(
			&itemResult.ID, &itemResult.PurchaseOrderID, &itemResult.ProductID, &itemResult.Quantity, &itemResult.UnitCost, &itemResult.TotalCost,
		)
		if err != nil {
			return PurchaseOrder{}, err
		}
		order.Items = append(order.Items, itemResult)
	}

	if err := tx.Commit(ctx); err != nil {
		return PurchaseOrder{}, err
	}

	return order, nil
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]PurchaseOrder, error) {
	query := `
		SELECT po.id, po.supplier_id, s.name as supplier_name, po.total_amount, po.status, COALESCE(po.notes, ''), po.expected_delivery, po.received_at, po.created_at
		FROM purchase_orders po
		JOIN suppliers s ON s.id = po.supplier_id
		WHERE po.organization_id = $1
		ORDER BY po.created_at DESC
	`
	rows, err := s.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []PurchaseOrder
	for rows.Next() {
		var po PurchaseOrder
		if err := rows.Scan(&po.ID, &po.SupplierID, &po.SupplierName, &po.TotalAmount, &po.Status, &po.Notes, &po.ExpectedDelivery, &po.ReceivedAt, &po.CreatedAt); err == nil {
			list = append(list, po)
		}
	}
	if list == nil {
		list = []PurchaseOrder{}
	}
	return list, nil
}

func (s *Service) Receive(ctx context.Context, orgID uuid.UUID, orderID uuid.UUID) (PurchaseOrder, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return PurchaseOrder{}, err
	}
	defer tx.Rollback(ctx)

	var po PurchaseOrder
	queryGet := `
		SELECT po.id, po.supplier_id, s.name as supplier_name, po.total_amount, po.status
		FROM purchase_orders po
		JOIN suppliers s ON s.id = po.supplier_id
		WHERE po.id = $1 AND po.organization_id = $2 FOR UPDATE
	`
	err = tx.QueryRow(ctx, queryGet, orderID, orgID).Scan(&po.ID, &po.SupplierID, &po.SupplierName, &po.TotalAmount, &po.Status)
	if err != nil {
		return PurchaseOrder{}, err
	}

	if po.Status == "received" {
		return PurchaseOrder{}, fmt.Errorf("ordem de compra já foi recebida anteriormente")
	}

	now := time.Now()
	queryUpdate := `
		UPDATE purchase_orders
		SET status = 'received', received_at = $1, updated_at = $1
		WHERE id = $2 AND organization_id = $3
		RETURNING id, supplier_id, total_amount, status, COALESCE(notes, ''), expected_delivery, received_at, created_at
	`
	err = tx.QueryRow(ctx, queryUpdate, now, orderID, orgID).Scan(
		&po.ID, &po.SupplierID, &po.TotalAmount, &po.Status, &po.Notes, &po.ExpectedDelivery, &po.ReceivedAt, &po.CreatedAt,
	)
	if err != nil {
		return PurchaseOrder{}, err
	}

	queryItems := `SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1`
	itemRows, err := tx.Query(ctx, queryItems, orderID)
	if err != nil {
		return PurchaseOrder{}, err
	}
	defer itemRows.Close()

	type itemQty struct {
		productID uuid.UUID
		qty       int
	}
	var items []itemQty
	for itemRows.Next() {
		var i itemQty
		if scanErr := itemRows.Scan(&i.productID, &i.qty); scanErr == nil {
			items = append(items, i)
		}
	}
	itemRows.Close()

	for _, item := range items {
		queryStock := `UPDATE products SET stock_quantity = stock_quantity + $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`
		if _, execErr := tx.Exec(ctx, queryStock, item.qty, item.productID, orgID); execErr != nil {
			return PurchaseOrder{}, execErr
		}
	}

	queryExpense := `
		INSERT INTO financial_transactions (organization_id, type, amount, description, status, due_date)
		VALUES ($1, 'expense', $2, $3, 'pending', $4)
	`
	desc := fmt.Sprintf("Compra Fornecedor %s (PO #%s)", po.SupplierName, orderID.String()[:8])
	if _, execErr := tx.Exec(ctx, queryExpense, orgID, po.TotalAmount, desc, now.AddDate(0, 0, 30)); execErr != nil {
		return PurchaseOrder{}, execErr
	}

	if err := tx.Commit(ctx); err != nil {
		return PurchaseOrder{}, err
	}

	return po, nil
}
