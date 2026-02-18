package customers

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

// Helper rápido para OrgID (Idealmente isso seria um middleware compartilhado)
func (h *Handler) getOrgID(c *fiber.Ctx) (uuid.UUID, error) {
    // Hardcoded para seu MVP atual
	return uuid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
}

func (h *Handler) Create(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization error"})
	}

	var req CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	customer, err := h.service.Create(c.Context(), orgID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(customer)
}

func (h *Handler) List(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization error"})
	}

	customers, err := h.service.List(c.Context(), orgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(customers)
}