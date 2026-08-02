package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}
	defer dbPool.Close()

	// Get first organization
	var orgID string
	err = dbPool.QueryRow(ctx, "SELECT id FROM organizations LIMIT 1").Scan(&orgID)
	if err != nil {
		log.Fatal("Could not find any organization. Please register a user first.", err)
	}

	fmt.Println("Seeding data for organization:", orgID)

	// Clean up existing data to avoid duplicates or messy charts
	_, _ = dbPool.Exec(ctx, "DELETE FROM activity_logs WHERE organization_id = $1", orgID)
	_, _ = dbPool.Exec(ctx, "DELETE FROM orders WHERE organization_id = $1", orgID)
	_, _ = dbPool.Exec(ctx, "DELETE FROM products WHERE organization_id = $1", orgID)
	_, _ = dbPool.Exec(ctx, "DELETE FROM customers WHERE organization_id = $1", orgID)

	rand.Seed(time.Now().UnixNano())

	// Insert Products
	productIDs := make([]string, 5)
	for i := 0; i < 5; i++ {
		stock := rand.Intn(50)
		if i == 0 {
			stock = 3 // Force a low stock product
		}
		err = dbPool.QueryRow(ctx, 
			"INSERT INTO products (organization_id, name, description, price, sku, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
			orgID, fmt.Sprintf("Aether Product %d", i+1), "Premium enterprise software component", float64(100+rand.Intn(900)), fmt.Sprintf("ATH-%04d", i+1), stock,
		).Scan(&productIDs[i])
		if err != nil {
			log.Fatal("Error inserting product:", err)
		}
	}

	// Insert Customers
	customerIDs := make([]string, 10)
	for i := 0; i < 10; i++ {
		err = dbPool.QueryRow(ctx,
			"INSERT INTO customers (organization_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING id",
			orgID, fmt.Sprintf("Enterprise Corp %d", i+1), fmt.Sprintf("contact%d@enterprise.com", i+1), "555-0199",
		).Scan(&customerIDs[i])
		if err != nil {
			log.Fatal("Error inserting customer:", err)
		}
	}

	// Insert Orders and Activity Logs
	now := time.Now()
	paymentMethods := []string{"dinheiro", "pix", "credito", "debito"}
	
	for i := 0; i < 20; i++ {
		daysAgo := rand.Intn(7) // Distribute over last 7 days
		orderDate := now.AddDate(0, 0, -daysAgo)
		
		customerID := customerIDs[rand.Intn(len(customerIDs))]
		paymentMethod := paymentMethods[rand.Intn(len(paymentMethods))]

		var orderID string
		// We initially insert with 0 total amount, then update it based on items
		err = dbPool.QueryRow(ctx,
			"INSERT INTO orders (organization_id, customer_id, total_amount, status, created_at, payment_method) VALUES ($1, $2, 0, 'completed', $3, $4) RETURNING id",
			orgID, customerID, orderDate, paymentMethod,
		).Scan(&orderID)
		if err != nil {
			log.Fatal("Error inserting order:", err)
		}

		// Insert 1 to 3 items per order
		numItems := 1 + rand.Intn(3)
		var orderTotal float64 = 0

		for j := 0; j < numItems; j++ {
			productID := productIDs[rand.Intn(len(productIDs))]
			
			// Get product price
			var price float64
			err = dbPool.QueryRow(ctx, "SELECT price FROM products WHERE id = $1", productID).Scan(&price)
			if err != nil {
				log.Fatal("Error getting product price:", err)
			}
			
			quantity := 1 + rand.Intn(3)
			totalPrice := float64(quantity) * price
			orderTotal += totalPrice
			
			_, err = dbPool.Exec(ctx,
				"INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)",
				orderID, productID, quantity, price, totalPrice,
			)
			if err != nil {
				log.Fatal("Error inserting order item:", err)
			}
		}

		// Update order total amount
		_, err = dbPool.Exec(ctx, "UPDATE orders SET total_amount = $1 WHERE id = $2", orderTotal, orderID)
		if err != nil {
			log.Fatal("Error updating order total:", err)
		}

		// Insert corresponding activity log
		_, err = dbPool.Exec(ctx,
			"INSERT INTO activity_logs (organization_id, action, user_name, status, created_at) VALUES ($1, $2, $3, $4, $5)",
			orgID, fmt.Sprintf("Invoice paid for order %s", orderID[:8]), "System Auto", "completed", orderDate,
		)
		if err != nil {
			log.Fatal("Error inserting activity log:", err)
		}
	}

	// Insert a few manual activity logs for variety
	activities := []struct {
		Action string
		User   string
		Status string
	}{
		{"New user registration", "Sarah Jenkins", "completed"},
		{"Database optimization", "System", "completed"},
		{"Server backup failed", "System", "failed"},
		{"Inventory restock", "Warehouse A", "completed"},
	}

	for i, act := range activities {
		actDate := now.Add(-time.Duration(i*2) * time.Hour)
		_, err = dbPool.Exec(ctx,
			"INSERT INTO activity_logs (organization_id, action, user_name, status, created_at) VALUES ($1, $2, $3, $4, $5)",
			orgID, act.Action, act.User, act.Status, actDate,
		)
	}

	fmt.Println("Database successfully seeded with realistic metrics!")
}
