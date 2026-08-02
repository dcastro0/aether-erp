package purchases

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

	var dto CreatePurchaseOrderDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	order, err := h.service.Create(c.Context(), claims.OrgID, dto)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "PURCHASE_CREATE", "purchase_order", order.ID.String(), map[string]interface{}{
			"supplier_id":  dto.SupplierID,
			"total_amount": order.TotalAmount,
			"items_count":  len(dto.Items),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(order)
}

func (h *Handler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	list, err := h.service.List(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(list)
}

func (h *Handler) Receive(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	orderID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	order, err := h.service.Receive(c.Context(), claims.OrgID, orderID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "PURCHASE_RECEIVE", "purchase_order", orderID.String(), map[string]interface{}{
			"supplier_name": order.SupplierName,
			"total_amount":  order.TotalAmount,
			"status":        order.Status,
		})
	}

	return c.JSON(order)
}
