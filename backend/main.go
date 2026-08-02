package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/dcastro0/aether-backend/internal/audit"
	"github.com/dcastro0/aether-backend/internal/auth"
	"github.com/dcastro0/aether-backend/internal/customers"
	"github.com/dcastro0/aether-backend/internal/dashboard"
	"github.com/dcastro0/aether-backend/internal/employees"
	"github.com/dcastro0/aether-backend/internal/financial"
	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/dcastro0/aether-backend/internal/orders"
	"github.com/dcastro0/aether-backend/internal/products"
	"github.com/dcastro0/aether-backend/internal/purchases"
	"github.com/dcastro0/aether-backend/internal/reports"
	"github.com/dcastro0/aether-backend/internal/suppliers"
	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal().Msg("DATABASE_URL is required")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if len(jwtSecret) < 32 {
		log.Fatal().Msg("JWT_SECRET is missing or lacks sufficient cryptographic strength (min 32 chars)")
	}

	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to connect to database")
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatal().Err(err).Msg("Unable to ping database")
	}

	auditService := audit.NewService(dbPool)
	auditHandler := audit.NewHandler(auditService)

	authHandler := auth.NewHandler(auth.NewService(dbPool, jwtSecret, auditService))
	productHandler := products.NewHandler(products.NewService(dbPool, auditService))
	customerHandler := customers.NewHandler(customers.NewService(dbPool, auditService))
	orderHandler := orders.NewHandler(orders.NewService(dbPool, auditService))
	dashboardHandler := dashboard.NewHandler(dashboard.NewService(dbPool))
	financialHandler := financial.NewHandler(financial.NewService(dbPool, auditService))
	employeeHandler := employees.NewHandler(employees.NewService(dbPool, auditService))
	supplierHandler := suppliers.NewHandler(suppliers.NewService(dbPool, auditService))
	purchaseHandler := purchases.NewHandler(purchases.NewService(dbPool, auditService))
	reportsHandler := reports.NewHandler(reports.NewService(dbPool))

	app := fiber.New(fiber.Config{
		AppName:       "Aether ERP",
		CaseSensitive: true,
	})

	app.Use(helmet.New())
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173, http://localhost:5174, http://localhost:5175, http://localhost:3000, http://127.0.0.1:5173, http://127.0.0.1:5174, http://127.0.0.1:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	loginLimiter := limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Muitas tentativas de requisição. Tente novamente em 1 minuto.",
			})
		},
	})

	api := app.Group("/api")
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": time.Now(),
		})
	})

	authGroup := api.Group("/auth")
	authGroup.Post("/register", loginLimiter, authHandler.Register)
	authGroup.Post("/login", loginLimiter, authHandler.Login)

	jwtMiddleware := jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(jwtSecret)},
	})

	protected := api.Group("/protected", jwtMiddleware, middleware.ExtractOrgClaims)

	profileGroup := protected.Group("/profile")
	profileGroup.Put("/", authHandler.UpdateProfile)
	profileGroup.Put("/password", authHandler.UpdatePassword)

	productsGroup := protected.Group("/products")
	productsGroup.Post("/", middleware.RequireRole("admin", "editor"), productHandler.Create)
	productsGroup.Get("/", productHandler.List)
	productsGroup.Put("/:id", middleware.RequireRole("admin", "editor"), productHandler.Update)
	productsGroup.Get("/metrics", productHandler.GetMetrics)

	customersGroup := protected.Group("/customers")
	customersGroup.Post("/", middleware.RequireRole("admin", "editor"), customerHandler.Create)
	customersGroup.Get("/", customerHandler.List)
	customersGroup.Put("/:id", middleware.RequireRole("admin", "editor"), customerHandler.Update)
	customersGroup.Delete("/:id", middleware.RequireRole("admin", "editor"), customerHandler.Delete)

	ordersGroup := protected.Group("/orders")
	ordersGroup.Post("/", middleware.RequireRole("admin", "editor"), orderHandler.Create)
	ordersGroup.Get("/", orderHandler.List)
	ordersGroup.Get("/:id", orderHandler.GetDetails)

	dashboardGroup := protected.Group("/dashboard")
	dashboardGroup.Get("/metrics", dashboardHandler.GetMetrics)

	financialGroup := protected.Group("/financial")
	financialGroup.Post("/", middleware.RequireRole("admin", "editor"), financialHandler.Create)
	financialGroup.Get("/", financialHandler.List)
	financialGroup.Patch("/:id/pay", middleware.RequireRole("admin", "editor"), financialHandler.MarkAsPaid)

	employeesGroup := protected.Group("/employees", middleware.RequireRole("admin"))
	employeesGroup.Get("/", employeeHandler.List)
	employeesGroup.Post("/", employeeHandler.Create)
	employeesGroup.Put("/:id", employeeHandler.UpdateDetails)
	employeesGroup.Put("/:id/role", employeeHandler.UpdateRole)
	employeesGroup.Patch("/:id/toggle-active", employeeHandler.ToggleActive)
	employeesGroup.Delete("/:id", employeeHandler.Delete)
	employeesGroup.Post("/:id/reset-password", employeeHandler.ResetPassword)

	suppliersGroup := protected.Group("/suppliers")
	suppliersGroup.Get("/", supplierHandler.List)
	suppliersGroup.Post("/", middleware.RequireRole("admin", "editor"), supplierHandler.Create)
	suppliersGroup.Put("/:id", middleware.RequireRole("admin", "editor"), supplierHandler.Update)
	suppliersGroup.Delete("/:id", middleware.RequireRole("admin", "editor"), supplierHandler.Delete)

	purchasesGroup := protected.Group("/purchases")
	purchasesGroup.Get("/", purchaseHandler.List)
	purchasesGroup.Post("/", middleware.RequireRole("admin", "editor"), purchaseHandler.Create)
	purchasesGroup.Post("/:id/receive", middleware.RequireRole("admin", "editor"), purchaseHandler.Receive)

	reportsGroup := protected.Group("/reports", middleware.RequireRole("admin"))
	reportsGroup.Get("/dre", reportsHandler.GetDRE)
	reportsGroup.Get("/abc-curve", reportsHandler.GetABC)
	reportsGroup.Get("/sellers", reportsHandler.GetSellers)

	auditGroup := protected.Group("/audit-logs", middleware.RequireRole("admin"))
	auditGroup.Get("/", auditHandler.List)

	go func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "3000"
		}
		if err := app.Listen(":" + port); err != nil {
			log.Panic().Err(err).Msg("Server panic")
		}
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	_ = app.Shutdown()
}