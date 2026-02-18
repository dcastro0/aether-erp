package products

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Helper para pegar UserID do Token JWT
func getUserID(c *fiber.Ctx) (uuid.UUID, error) {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	sub := claims["sub"].(string)
	return uuid.Parse(sub)
}

// Middleware fake para pegar OrgID (Em produção viria do Header ou Token)
func (h *Handler) getOrgID(c *fiber.Ctx) (uuid.UUID, error) {
	// TODO: Implementar lógica real de seleção de organização
	// Por enquanto, hardcoded para a ID que criamos no Passo 3
	return uuid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")
}

func (h *Handler) Create(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization not found"})
	}

	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid body"})
	}

	product, err := h.service.Create(c.Context(), orgID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusCreated).JSON(product)
}

func (h *Handler) List(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization not found"})
	}

	products, err := h.service.List(c.Context(), orgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(products)
}

func (h *Handler) GetMetrics(c *fiber.Ctx) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "organization not found"})
	}

	metrics, err := h.service.GetMetrics(c.Context(), orgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(metrics)
}