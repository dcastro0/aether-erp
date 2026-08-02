package financial

import (
	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

var validate = validator.New()

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Create(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgID := claims.OrgID

	var req CreateFinancialRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := validate.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	res, err := h.service.Create(c.Context(), orgID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "FINANCIAL_CREATE", "financial", res.ID.String(), map[string]interface{}{
			"type":        req.Type,
			"amount":      req.Amount,
			"description": req.Description,
			"status":      req.Status,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(res)
}

func (h *Handler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgID := claims.OrgID

	res, err := h.service.List(c.Context(), orgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(res)
}

func (h *Handler) MarkAsPaid(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	orgID := claims.OrgID

	txID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid transaction ID"})
	}

	if err := h.service.MarkAsPaid(c.Context(), orgID, txID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "FINANCIAL_PAY", "financial", txID.String(), nil)
	}

	return c.JSON(fiber.Map{"message": "transaction marked as paid"})
}
