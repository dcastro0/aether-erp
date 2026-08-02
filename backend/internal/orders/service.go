package orders

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/dcastro0/aether-backend/internal/audit"
	"github.com/dcastro0/aether-backend/internal/db"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CreateOrderItemDTO struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,min=1"`
	UnitPrice float64   `json:"unit_price" validate:"required,min=0"`
}

type CreateOrderRequest struct {
	CustomerID    uuid.UUID            `json:"customer_id" validate:"required"`
	PaymentMethod string               `json:"payment_method" validate:"required"`
	Items         []CreateOrderItemDTO `json:"items" validate:"required,min=1"`
}

type OrderResponse struct {
	ID            uuid.UUID `json:"id"`
	CustomerName  string    `json:"customer_name"`
	SellerName    string    `json:"seller_name"`
	TotalAmount   string    `json:"total_amount"`
	Status        string    `json:"status"`
	PaymentMethod string    `json:"payment_method"`
	CreatedAt     string    `json:"created_at"`
}

type OrderItemResponse struct {
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	TotalPrice  float64 `json:"total_price"`
}

type OrderDetailsResponse struct {
	OrderResponse
	Items []OrderItemResponse `json:"items"`
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

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, userID uuid.UUID, req CreateOrderRequest) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := db.New(s.db).WithTx(tx)

	var totalAmount float64
	for _, item := range req.Items {
		totalAmount += item.UnitPrice * float64(item.Quantity)
	}

	totalNumeric := pgtype.Numeric{}
	totalNumeric.Scan(fmt.Sprintf("%.2f", totalAmount))

	orderID, err := qtx.CreateOrder(ctx, db.CreateOrderParams{
		OrganizationID: pgtype.UUID{Bytes: orgID, Valid: true},
		CustomerID:     pgtype.UUID{Bytes: req.CustomerID, Valid: true},
		TotalAmount:    totalNumeric,
		Status:         "completed",
		PaymentMethod:  req.PaymentMethod,
	})
	if err != nil {
		return err
	}

	// Update order with seller user_id
	updateUserQuery := `UPDATE orders SET user_id = $1 WHERE id = $2`
	_, err = tx.Exec(ctx, updateUserQuery, userID, orderID.Bytes)
	if err != nil {
		return err
	}

	for _, item := range req.Items {
		err := qtx.UpdateProductStock(ctx, db.UpdateProductStockParams{
			ID:            pgtype.UUID{Bytes: item.ProductID, Valid: true},
			StockQuantity: int32(item.Quantity),
		})
		if err != nil {
			return errors.New("estoque insuficiente ou produto não encontrado")
		}

		itemTotal := item.UnitPrice * float64(item.Quantity)
		itemTotalNumeric := pgtype.Numeric{}
		itemTotalNumeric.Scan(fmt.Sprintf("%.2f", itemTotal))

		unitPriceNumeric := pgtype.Numeric{}
		unitPriceNumeric.Scan(fmt.Sprintf("%.2f", item.UnitPrice))

		_, err = qtx.CreateOrderItem(ctx, db.CreateOrderItemParams{
			OrderID:    orderID,
			ProductID:  pgtype.UUID{Bytes: item.ProductID, Valid: true},
			Quantity:   int32(item.Quantity),
			UnitPrice:  unitPriceNumeric,
			TotalPrice: itemTotalNumeric,
		})
		if err != nil {
			return err
		}
	}

	status := "pending"
	var paidAt pgtype.Timestamptz
	if req.PaymentMethod == "dinheiro" || req.PaymentMethod == "pix" || req.PaymentMethod == "debito" {
		status = "paid"
		paidAt = pgtype.Timestamptz{Time: time.Now(), Valid: true}
	}

	orderUUID := uuid.UUID(orderID.Bytes)
	_, err = qtx.CreateFinancialTransaction(ctx, db.CreateFinancialTransactionParams{
		OrganizationID: pgtype.UUID{Bytes: orgID, Valid: true},
		Type:           "income",
		Amount:         totalNumeric,
		Description:    fmt.Sprintf("Venda PDV - Pedido %s", orderUUID.String()),
		Status:         status,
		PaymentMethod:  pgtype.Text{String: req.PaymentMethod, Valid: req.PaymentMethod != ""},
		OrderID:        pgtype.UUID{Bytes: orderID.Bytes, Valid: true},
		DueDate:        pgtype.Date{Time: time.Now(), Valid: true},
		PaidAt:         paidAt,
	})
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]OrderResponse, error) {
	query := `
		SELECT 
			o.id, 
			c.name as customer_name, 
			COALESCE(u.full_name, 'Sistema / Não informado') as seller_name,
			o.total_amount, 
			o.status, 
			o.payment_method, 
			o.created_at
		FROM orders o
		JOIN customers c ON o.customer_id = c.id
		LEFT JOIN users u ON o.user_id = u.id
		WHERE o.organization_id = $1
		ORDER BY o.created_at DESC
	`

	rows, err := s.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []OrderResponse
	for rows.Next() {
		var o OrderResponse
		var totalNum pgtype.Numeric
		var createdAt time.Time
		if scanErr := rows.Scan(&o.ID, &o.CustomerName, &o.SellerName, &totalNum, &o.Status, &o.PaymentMethod, &createdAt); scanErr == nil {
			val, _ := totalNum.Float64Value()
			o.TotalAmount = fmt.Sprintf("%.2f", val.Float64)
			o.CreatedAt = createdAt.Format("2006-01-02 15:04")
			orders = append(orders, o)
		}
	}

	return orders, nil
}

func (s *Service) GetDetails(ctx context.Context, orderID uuid.UUID) (OrderDetailsResponse, error) {
	q := db.New(s.db)

	rows, err := q.GetOrderItems(ctx, pgtype.UUID{Bytes: orderID, Valid: true})
	if err != nil {
		return OrderDetailsResponse{}, err
	}

	if len(rows) == 0 {
		return OrderDetailsResponse{}, errors.New("pedido não encontrado ou sem itens")
	}

	var items []OrderItemResponse
	for _, r := range rows {
		unitPrice, _ := r.UnitPrice.Float64Value()
		totalPrice, _ := r.TotalPrice.Float64Value()

		items = append(items, OrderItemResponse{
			ProductName: r.ProductName,
			Quantity:    int(r.Quantity),
			UnitPrice:   unitPrice.Float64,
			TotalPrice:  totalPrice.Float64,
		})
	}

	return OrderDetailsResponse{
		Items: items,
	}, nil
}