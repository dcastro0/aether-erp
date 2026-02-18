package orders

import (
	"context"
	"errors"
	"fmt"

	"github.com/caio/aether-backend/internal/db"
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
	CustomerID uuid.UUID          `json:"customer_id" validate:"required"`
	Items      []CreateOrderItemDTO `json:"items" validate:"required,min=1"`
}

type OrderResponse struct {
	ID           uuid.UUID `json:"id"`
	CustomerName string    `json:"customer_name"`
	TotalAmount  string    `json:"total_amount"`
	Status       string    `json:"status"`
	CreatedAt    string    `json:"created_at"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{
		db: pool,
	}
}

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, req CreateOrderRequest) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	qtx := db.New(s.db).WithTx(tx)

	// 1. Calcular total
	var totalAmount float64
	for _, item := range req.Items {
		totalAmount += item.UnitPrice * float64(item.Quantity)
	}

	totalNumeric := pgtype.Numeric{}
	totalNumeric.Scan(fmt.Sprintf("%.2f", totalAmount))

	// 2. Criar Header do Pedido
	order, err := qtx.CreateOrder(ctx, db.CreateOrderParams{
		OrganizationID: pgtype.UUID{Bytes: orgID, Valid: true},
		CustomerID:     pgtype.UUID{Bytes: req.CustomerID, Valid: true},
		TotalAmount:    totalNumeric,
		Status:         "completed",
	})
	if err != nil {
		return err
	}

	// 3. Processar Itens e Baixar Estoque
	for _, item := range req.Items {
		// Baixar Estoque
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

		// Criar Item
		_, err = qtx.CreateOrderItem(ctx, db.CreateOrderItemParams{
			OrderID:    order.ID,
			ProductID:  pgtype.UUID{Bytes: item.ProductID, Valid: true},
			Quantity:   int32(item.Quantity),
			UnitPrice:  unitPriceNumeric,
			TotalPrice: itemTotalNumeric,
		})
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]OrderResponse, error) {
	q := db.New(s.db)
	rows, err := q.ListOrders(ctx, pgtype.UUID{Bytes: orgID, Valid: true})
	if err != nil {
		return nil, err
	}

	var orders []OrderResponse
	for _, r := range rows {
		val, _ := r.TotalAmount.Float64Value()
		orders = append(orders, OrderResponse{
			ID:           uuid.UUID(r.ID.Bytes),
			CustomerName: r.CustomerName,
			TotalAmount:  fmt.Sprintf("%.2f", val.Float64),
			Status:       r.Status,
			CreatedAt:    r.CreatedAt.Time.Format("2006-01-02"),
		})
	}

	return orders, nil
}
// ... (outros structs)

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

// ... (métodos Create e List existentes)

// Adicione este método novo:
func (s *Service) GetDetails(ctx context.Context, orderID uuid.UUID) (OrderDetailsResponse, error) {
	q := db.New(s.db)

	// 1. Buscar os itens do pedido
	rows, err := q.GetOrderItems(ctx, pgtype.UUID{Bytes: orderID, Valid: true})
	if err != nil {
		return OrderDetailsResponse{}, err
	}
    
    // Se não tiver itens, pode ser que o pedido não exista ou esteja vazio (raro)
    if len(rows) == 0 {
        return OrderDetailsResponse{}, errors.New("pedido não encontrado ou sem itens")
    }

	// 2. Montar a resposta
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

    // Nota: Para simplificar, não busquei o Header do pedido de novo (Customer Name, etc) 
    // porque geralmente o frontend já tem isso na lista, mas num sistema real fariamos um JOIN ou outra query.
    // Vamos retornar os itens e o frontend compõe o visual.
	
	return OrderDetailsResponse{
		Items: items,
	}, nil
}