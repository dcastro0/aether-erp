package notifications

import (
	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetAlerts(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	summary, err := h.service.GetAlerts(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(summary)
}
