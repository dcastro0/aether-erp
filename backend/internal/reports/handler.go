package reports

import (
	"time"

	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GetDRE(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	startStr := c.Query("start_date")
	endStr := c.Query("end_date")

	startDate := time.Now().AddDate(0, -1, 0)
	endDate := time.Now()

	if startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			startDate = t
		}
	}
	if endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			endDate = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		}
	}

	dre, err := h.service.GetDRE(c.Context(), claims.OrgID, startDate, endDate)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(dre)
}

func (h *Handler) GetABC(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	list, err := h.service.GetABC(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(list)
}

func (h *Handler) GetSellers(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	list, err := h.service.GetSellers(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(list)
}
