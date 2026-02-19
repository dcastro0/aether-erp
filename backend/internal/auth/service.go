package auth

import (
	"context"
	"errors"
	"os"
	"time"

	"github.com/caio/aether-backend/internal/db"
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
		log.Error().Err(err).Msg("failed to hash password")
		return UserResponse{}, err
	}

	params := db.CreateUserParams{
		Email:        req.Email,
		PasswordHash: string(hashedBytes),
		FullName:     req.FullName,
	}

	user, err := s.q.CreateUser(ctx, params)
	if err != nil {
		log.Error().Err(err).Str("email", req.Email).Msg("failed to create user")
		return UserResponse{}, errors.New("could not create user")
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

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return LoginResponse{}, errors.New("invalid credentials")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": uuid.UUID(user.ID.Bytes).String(),
		"exp": time.Now().Add(time.Hour * 24).Unix(),
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
		return errors.New("utilizador não encontrado")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword))
	if err != nil {
		return errors.New("palavra-passe atual incorreta")
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