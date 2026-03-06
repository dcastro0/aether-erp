package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type OrgClaims struct {
	UserID uuid.UUID
	OrgID  uuid.UUID
	Role   string
}

func ExtractOrgClaims(c *fiber.Ctx) error {
	token := c.Locals("user").(*jwt.Token)
	claims := token.Claims.(jwt.MapClaims)

	userID, err := uuid.Parse(claims["sub"].(string))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
	}

	orgIDStr, ok := claims["org_id"].(string)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "org not found in token"})
	}

	orgID, err := uuid.Parse(orgIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid org in token"})
	}

	role, _ := claims["role"].(string)

	c.Locals("claims", &OrgClaims{
		UserID: userID,
		OrgID:  orgID,
		Role:   role,
	})

	return c.Next()
}

func GetClaims(c *fiber.Ctx) *OrgClaims {
	claims, _ := c.Locals("claims").(*OrgClaims)
	return claims
}