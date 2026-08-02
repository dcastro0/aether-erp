package suppliers

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

	var dto CreateSupplierDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	sup, err := h.service.Create(c.Context(), claims.OrgID, dto)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "SUPPLIER_CREATE", "supplier", sup.ID.String(), map[string]interface{}{
			"name":     dto.Name,
			"document": dto.Document,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(sup)
}

func (h *Handler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	list, err := h.service.List(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(list)
}

func (h *Handler) Update(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	supID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	var dto CreateSupplierDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	sup, err := h.service.Update(c.Context(), claims.OrgID, supID, dto)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "SUPPLIER_UPDATE", "supplier", supID.String(), map[string]interface{}{
			"name": dto.Name,
		})
	}

	return c.JSON(sup)
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	supID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid id"})
	}

	if err := h.service.Delete(c.Context(), claims.OrgID, supID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "SUPPLIER_DELETE", "supplier", supID.String(), nil)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
