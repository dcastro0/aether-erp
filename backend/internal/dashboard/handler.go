package dashboard

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) getOrgID(c *fiber.Ctx) (uuid.UUID, error) {
	return uuid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
}

func (h *Handler) GetMetrics(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization error"})
	}

	metrics, err := h.service.GetMetrics(c.Context(), orgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(metrics)
}