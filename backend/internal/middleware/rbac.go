package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// RequireRole checks if the authenticated user's role is included in allowedRoles.
func RequireRole(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil || claims.Role == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Autenticação requerida para acessar este recurso",
			})
		}

		// Owner has universal access to all routes
		if claims.Role == "owner" {
			return c.Next()
		}

		for _, allowed := range allowedRoles {
			if claims.Role == allowed {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Acesso negado. Seu nível de permissão (" + claims.Role + ") não possui autorização para esta ação.",
		})
	}
}
