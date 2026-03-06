package auth

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/dcastro0/aether-backend/internal/db"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	q  *db.Queries
	db *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{
		q:  db.New(pool),
		db: pool,
	}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (UserResponse, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return UserResponse{}, err
	}

	tx, err := s.db.Begin(ctx)
	if err != nil {
		return UserResponse{}, err
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	user, err := qtx.CreateUser(ctx, db.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hashedBytes),
		FullName:     req.FullName,
	})
	if err != nil {
		log.Error().Err(err).Str("email", req.Email).Msg("failed to create user")
		return UserResponse{}, errors.New("could not create user, email may already be in use")
	}

	slug := slugify(req.FullName)
	org, err := qtx.CreateOrganization(ctx, db.CreateOrganizationParams{
		Name: req.FullName + "'s Organization",
		Slug: fmt.Sprintf("%s-%s", slug, uuid.New().String()[:8]),
	})
	if err != nil {
		log.Error().Err(err).Msg("failed to create organization")
		return UserResponse{}, errors.New("could not create organization")
	}

	_, err = qtx.AddUserToOrganization(ctx, db.AddUserToOrganizationParams{
		OrganizationID: org.ID,
		UserID:         user.ID,
		Role:           db.UserRoleOwner,
	})
	if err != nil {
		log.Error().Err(err).Msg("failed to link user to organization")
		return UserResponse{}, errors.New("could not link user to organization")
	}

	if err := tx.Commit(ctx); err != nil {
		return UserResponse{}, err
	}

	return UserResponse{
		ID:        uuid.UUID(user.ID.Bytes),
		Email:     user.Email,
		FullName:  user.FullName,
		CreatedAt: user.CreatedAt.Time,
	}, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (LoginResponse, error) {
	user, err := s.q.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LoginResponse{}, errors.New("invalid credentials")
		}
		log.Error().Err(err).Msg("database error during login")
		return LoginResponse{}, errors.New("internal error")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return LoginResponse{}, errors.New("invalid credentials")
	}

	orgs, err := s.q.GetUserOrganizations(ctx, user.ID)
	if err != nil || len(orgs) == 0 {
		log.Error().Err(err).Msg("user has no organization")
		return LoginResponse{}, errors.New("user has no organization")
	}

	org := orgs[0]

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":    uuid.UUID(user.ID.Bytes).String(),
		"org_id": uuid.UUID(org.ID.Bytes).String(),
		"role":   string(org.Role),
		"exp":    time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		log.Error().Err(err).Msg("failed to sign token")
		return LoginResponse{}, errors.New("could not generate token")
	}

	return LoginResponse{
		AccessToken: tokenString,
		User: UserResponse{
			ID:        uuid.UUID(user.ID.Bytes),
			Email:     user.Email,
			FullName:  user.FullName,
			CreatedAt: user.CreatedAt.Time,
		},
	}, nil
}

func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, req UpdateProfileRequest) (db.UpdateUserNameRow, error) {
	return s.q.UpdateUserName(ctx, db.UpdateUserNameParams{
		ID:       pgtype.UUID{Bytes: userID, Valid: true},
		FullName: req.FullName,
	})
}

func (s *Service) UpdatePassword(ctx context.Context, userID uuid.UUID, req UpdatePasswordRequest) error {
	user, err := s.q.GetUserByID(ctx, pgtype.UUID{Bytes: userID, Valid: true})
	if err != nil {
		return errors.New("user not found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		return errors.New("current password is incorrect")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	return s.q.UpdateUserPassword(ctx, db.UpdateUserPasswordParams{
		ID:           pgtype.UUID{Bytes: userID, Valid: true},
		PasswordHash: string(hashedPassword),
	})
}

func slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "-")
	return s
}