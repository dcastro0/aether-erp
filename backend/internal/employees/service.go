package employees

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/dcastro0/aether-backend/internal/audit"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Employee struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	JoinedAt  time.Time `json:"joined_at"`
}

type CreateEmployeeDTO struct {
	Email    string `json:"email"`
	FullName string `json:"full_name" validate:"required,min=3"`
	Password string `json:"password"`
	Role     string `json:"role" validate:"required,oneof=admin editor viewer"`
}

type UpdateEmployeeRoleDTO struct {
	Role string `json:"role" validate:"required,oneof=owner admin editor viewer"`
}

type UpdateEmployeeDTO struct {
	FullName string `json:"full_name" validate:"required,min=3"`
	Email    string `json:"email" validate:"required,email"`
	Role     string `json:"role" validate:"required,oneof=admin editor viewer"`
}

type Service struct {
	db    *pgxpool.Pool
	audit *audit.Service
}

func NewService(db *pgxpool.Pool, auditService *audit.Service) *Service {
	return &Service{
		db:    db,
		audit: auditService,
	}
}

func (s *Service) List(ctx context.Context, orgID uuid.UUID) ([]Employee, error) {
	query := `
		SELECT u.id, u.email, u.full_name, om.role, u.is_active, om.joined_at
		FROM users u
		JOIN organization_members om ON u.id = om.user_id
		WHERE om.organization_id = $1
		ORDER BY om.joined_at DESC
	`

	rows, err := s.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Employee
	for rows.Next() {
		var emp Employee
		if err := rows.Scan(&emp.ID, &emp.Email, &emp.FullName, &emp.Role, &emp.IsActive, &emp.JoinedAt); err != nil {
			return nil, err
		}
		list = append(list, emp)
	}

	return list, nil
}

type CreateEmployeeResult struct {
	Employee          Employee `json:"employee"`
	GeneratedPassword string   `json:"generated_password"`
}

type ResetPasswordResult struct {
	NewPassword string `json:"new_password"`
}

func generateSimplePassword() string {
	seed := time.Now().UnixNano()
	digits := (seed % 8999) + 1000
	if digits < 0 {
		digits = -digits
	}
	return fmt.Sprintf("Aether@%d", digits)
}

func generateEmailFromName(fullName string) string {
	parts := strings.Fields(strings.ToLower(fullName))
	if len(parts) == 0 {
		return fmt.Sprintf("colaborador%d@aether.local", time.Now().Unix()%10000)
	}
	cleanParts := make([]string, 0, len(parts))
	for _, p := range parts {
		clean := strings.Map(func(r rune) rune {
			if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
				return r
			}
			return -1
		}, p)
		if clean != "" {
			cleanParts = append(cleanParts, clean)
		}
	}
	if len(cleanParts) == 0 {
		return fmt.Sprintf("colaborador%d@aether.local", time.Now().Unix()%10000)
	}
	if len(cleanParts) == 1 {
		return fmt.Sprintf("%s@aether.local", cleanParts[0])
	}
	return fmt.Sprintf("%s.%s@aether.local", cleanParts[0], cleanParts[len(cleanParts)-1])
}

func (s *Service) Create(ctx context.Context, orgID uuid.UUID, dto CreateEmployeeDTO) (*CreateEmployeeResult, error) {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	email := strings.TrimSpace(dto.Email)
	if email == "" {
		email = generateEmailFromName(dto.FullName)
	}

	password := strings.TrimSpace(dto.Password)
	if password == "" {
		password = generateSimplePassword()
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var userID uuid.UUID
	userQuery := `
		INSERT INTO users (email, password_hash, full_name, must_change_password)
		VALUES ($1, $2, $3, true)
		RETURNING id
	`
	err = tx.QueryRow(ctx, userQuery, email, string(hash), dto.FullName).Scan(&userID)
	if err != nil {
		return nil, errors.New("e-mail já cadastrado ou inválido")
	}

	memberQuery := `
		INSERT INTO organization_members (organization_id, user_id, role)
		VALUES ($1, $2, $3::user_role)
	`
	_, err = tx.Exec(ctx, memberQuery, orgID, userID, dto.Role)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &CreateEmployeeResult{
		Employee: Employee{
			ID:        userID,
			Email:     email,
			FullName:  dto.FullName,
			Role:      dto.Role,
			IsActive:  true,
			JoinedAt:  time.Now(),
		},
		GeneratedPassword: password,
	}, nil
}

func (s *Service) UpdateRole(ctx context.Context, orgID uuid.UUID, userID uuid.UUID, dto UpdateEmployeeRoleDTO) error {
	query := `
		UPDATE organization_members
		SET role = $1::user_role
		WHERE organization_id = $2 AND user_id = $3
	`
	res, err := s.db.Exec(ctx, query, dto.Role, orgID, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("colaborador não encontrado nesta empresa")
	}
	return nil
}

func (s *Service) ToggleActive(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) (bool, error) {
	query := `
		UPDATE users
		SET is_active = NOT is_active, updated_at = NOW()
		FROM organization_members om
		WHERE users.id = om.user_id AND om.organization_id = $1 AND users.id = $2
		RETURNING users.is_active
	`
	var newStatus bool
	err := s.db.QueryRow(ctx, query, orgID, userID).Scan(&newStatus)
	if err != nil {
		return false, errors.New("não foi possível alterar status do colaborador")
	}
	return newStatus, nil
}

func (s *Service) UpdateDetails(ctx context.Context, orgID uuid.UUID, userID uuid.UUID, dto UpdateEmployeeDTO) error {
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Update user info (name, email)
	userQuery := `
		UPDATE users
		SET full_name = $1, email = $2, updated_at = NOW()
		FROM organization_members om
		WHERE users.id = om.user_id AND om.organization_id = $3 AND users.id = $4
	`
	res, err := tx.Exec(ctx, userQuery, dto.FullName, dto.Email, orgID, userID)
	if err != nil {
		return errors.New("erro ao atualizar dados do usuário ou email já em uso")
	}
	if res.RowsAffected() == 0 {
		return errors.New("colaborador não encontrado")
	}

	// Update organization member role
	roleQuery := `
		UPDATE organization_members
		SET role = $1::user_role
		WHERE organization_id = $2 AND user_id = $3 AND role != 'owner'
	`
	_, err = tx.Exec(ctx, roleQuery, dto.Role, orgID, userID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Service) Delete(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) error {
	// Prevent deleting the owner of the organization
	var currentRole string
	roleCheck := `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`
	err := s.db.QueryRow(ctx, roleCheck, orgID, userID).Scan(&currentRole)
	if err != nil {
		return errors.New("colaborador não encontrado")
	}
	if currentRole == "owner" {
		return errors.New("não é possível remover o proprietário da organização")
	}

	query := `DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2`
	res, err := s.db.Exec(ctx, query, orgID, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return errors.New("membro não encontrado na organização")
	}

	return nil
}

func (s *Service) ResetPassword(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) (string, error) {
	var currentRole string
	roleCheck := `SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2`
	err := s.db.QueryRow(ctx, roleCheck, orgID, userID).Scan(&currentRole)
	if err != nil {
		return "", errors.New("colaborador não encontrado nesta organização")
	}

	newPassword := generateSimplePassword()
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	updateQuery := `
		UPDATE users
		SET password_hash = $1, must_change_password = true, updated_at = NOW()
		FROM organization_members om
		WHERE users.id = om.user_id AND om.organization_id = $2 AND users.id = $3
	`
	res, err := s.db.Exec(ctx, updateQuery, string(hash), orgID, userID)
	if err != nil {
		return "", err
	}
	if res.RowsAffected() == 0 {
		return "", errors.New("não foi possível redefinir a senha do colaborador")
	}

	return newPassword, nil
}
