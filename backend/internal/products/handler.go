package products

import (
	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Create(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	product, err := h.service.Create(c.Context(), claims.OrgID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		pID := ""
		if product.ID.Valid {
			pID = product.ID.String()
		}
		h.service.audit.LogFromCtx(c, "PRODUCT_CREATE", "product", pID, map[string]interface{}{
			"name":           req.Name,
			"price":          req.Price,
			"stock_quantity": req.StockQuantity,
			"sku":            req.SKU,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(product)
}

func (h *Handler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	products, err := h.service.List(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(products)
}

func (h *Handler) Update(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	productID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	var req UpdateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	product, err := h.service.Update(c.Context(), productID, claims.OrgID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "PRODUCT_UPDATE", "product", productID.String(), map[string]interface{}{
			"name":           req.Name,
			"price":          req.Price,
			"stock_quantity": req.StockQuantity,
			"sku":            req.SKU,
			"is_active":      req.IsActive,
		})
	}

	return c.JSON(product)
}

func (h *Handler) GetMetrics(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	metrics, err := h.service.GetMetrics(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(metrics)
}