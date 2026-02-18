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
		"exp": time.Now().Add(time.Hour * 24).Unix(), // 24 horas
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		log.Error().Err(err).Msg("failed to sign token")
		return LoginResponse{}, errors.New("could not generate token")
	}

	// Opcional: Aqui poderíamos salvar o Refresh Token no banco usando s.q.CreateRefreshToken
	// Vamos manter simples por agora e retornar apenas o Access Token

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