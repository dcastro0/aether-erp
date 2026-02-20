package auth

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func GetUserAndOrgID(c *fiber.Ctx) (uuid.UUID, uuid.UUID, error) {
	userToken, ok := c.Locals("user").(*jwt.Token)
	if !ok {
		return uuid.Nil, uuid.Nil, errors.New("missing jwt token")
	}

	claims, ok := userToken.Claims.(jwt.MapClaims)
	if !ok {
		return uuid.Nil, uuid.Nil, errors.New("invalid claims")
	}

	userIDStr, ok := claims["sub"].(string)
	if !ok {
		return uuid.Nil, uuid.Nil, errors.New("missing sub in token")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, uuid.Nil, err
	}

	orgID, _ := uuid.Parse("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11")

	return userID, orgID, nil
}