package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/caio/aether-backend/internal/auth"
	"github.com/caio/aether-backend/internal/customers"
	"github.com/caio/aether-backend/internal/dashboard"
	"github.com/caio/aether-backend/internal/orders"
	"github.com/caio/aether-backend/internal/products"
	jwtware "github.com/gofiber/contrib/jwt"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

	ctx := context.Background()
	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal().Err(err).Msg("Unable to connect to database")
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatal().Err(err).Msg("Unable to ping database")
	}
	log.Info().Msg("Connected to PostgreSQL")

	authService := auth.NewService(dbPool)
	authHandler := auth.NewHandler(authService)

	productService := products.NewService(dbPool)
	productHandler := products.NewHandler(productService)

	customerService := customers.NewService(dbPool)
  customerHandler := customers.NewHandler(customerService)

	orderService := orders.NewService(dbPool)
  orderHandler := orders.NewHandler(orderService)

	dashboardService := dashboard.NewService(dbPool)
	dashboardHandler := dashboard.NewHandler(dashboardService)



	app := fiber.New(fiber.Config{
		AppName:       "Aether ERP",
		CaseSensitive: true,
		// StrictRouting: true,
	})

	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	api := app.Group("/api")

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": time.Now(),
		})
	})

	authGroup := api.Group("/auth")
	authGroup.Post("/register", authHandler.Register)
	authGroup.Post("/login", authHandler.Login)

	app.Use("/api/protected", jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(os.Getenv("JWT_SECRET"))},
	}))

	protected := api.Group("/protected")

	profileGroup := protected.Group("/profile")
	profileGroup.Put("/", authHandler.UpdateProfile)
	profileGroup.Put("/password", authHandler.UpdatePassword)

	productsGroup := protected.Group("/products")
	productsGroup.Post("/", productHandler.Create)
	productsGroup.Get("/", productHandler.List)
	productsGroup.Get("/metrics", productHandler.GetMetrics)

	
	customersGroup := protected.Group("/customers")
  customersGroup.Post("/", customerHandler.Create)
  customersGroup.Get("/", customerHandler.List)

	ordersGroup := protected.Group("/orders")
  ordersGroup.Post("/", orderHandler.Create)
  ordersGroup.Get("/", orderHandler.List)
	ordersGroup.Get("/:id", orderHandler.GetDetails)

	dashboardGroup := protected.Group("/dashboard")
	dashboardGroup.Get("/metrics", dashboardHandler.GetMetrics)

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

	log.Info().Msg("Shutting down server...")
	_ = app.Shutdown()
	log.Info().Msg("Server shutdown complete")
}