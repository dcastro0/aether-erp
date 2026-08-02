package audit

import (
	"strconv"

	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))

	filter := AuditFilter{
		OrganizationID: claims.OrgID,
		UserID:         c.Query("user_id"),
		Entity:         c.Query("entity"),
		Action:         c.Query("action"),
		StartDate:      c.Query("start_date"),
		EndDate:        c.Query("end_date"),
		Search:         c.Query("search"),
		Page:           page,
		Limit:          limit,
	}

	logs, total, err := h.service.List(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"data":  logs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
