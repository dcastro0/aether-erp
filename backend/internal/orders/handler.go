package orders

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

func (h *Handler) Create(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization error"})
	}

	var req CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	if err := h.service.Create(c.Context(), orgID, req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "order created"})
}

func (h *Handler) List(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization error"})
	}

	orders, err := h.service.List(c.Context(), orgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(orders)
}

// ... (imports e outros métodos)

func (h *Handler) GetDetails(c *fiber.Ctx) error {
    // Pegar ID da URL
	idParam := c.Params("id")
	orderID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id inválido"})
	}

	details, err := h.service.GetDetails(c.Context(), orderID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "pedido não encontrado"})
	}

	return c.JSON(details)
}