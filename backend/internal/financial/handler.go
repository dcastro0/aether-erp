package financial

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

	var req CreateTransactionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	transaction, err := h.service.Create(c.Context(), claims.OrgID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(transaction)
}

func (h *Handler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	filterType := c.Query("type")
	filterStatus := c.Query("status")

	transactions, err := h.service.List(c.Context(), claims.OrgID, filterType, filterStatus)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(transactions)
}

func (h *Handler) Pay(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid transaction ID"})
	}

	transaction, err := h.service.Pay(c.Context(), claims.OrgID, id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(transaction)
}

func (h *Handler) GetSummary(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	summary, err := h.service.GetSummary(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(summary)
}
