package employees

import (
	"github.com/dcastro0/aether-backend/internal/middleware"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	service   *Service
	validator *validator.Validate
}

func NewHandler(service *Service) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

func (h *Handler) List(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	list, err := h.service.List(c.Context(), claims.OrgID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(list)
}

func (h *Handler) Create(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)

	var dto CreateEmployeeDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "corpo da requisição inválido"})
	}

	if err := h.validator.Struct(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	emp, err := h.service.Create(c.Context(), claims.OrgID, dto)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "EMPLOYEE_CREATE", "employee", emp.Employee.ID.String(), map[string]interface{}{
			"email":     emp.Employee.Email,
			"full_name": emp.Employee.FullName,
			"role":      emp.Employee.Role,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(emp)
}

func (h *Handler) UpdateRole(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	targetIDStr := c.Params("id")

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID do colaborador inválido"})
	}

	var dto UpdateEmployeeRoleDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "corpo da requisição inválido"})
	}

	if err := h.validator.Struct(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.UpdateRole(c.Context(), claims.OrgID, targetID, dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "EMPLOYEE_ROLE_CHANGE", "employee", targetID.String(), map[string]interface{}{
			"new_role": dto.Role,
		})
	}

	return c.JSON(fiber.Map{"message": "Cargo atualizado com sucesso"})
}

func (h *Handler) ToggleActive(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	targetIDStr := c.Params("id")

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID do colaborador inválido"})
	}

	newStatus, err := h.service.ToggleActive(c.Context(), claims.OrgID, targetID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "EMPLOYEE_TOGGLE_ACTIVE", "employee", targetID.String(), map[string]interface{}{
			"is_active": newStatus,
		})
	}

	return c.JSON(fiber.Map{"is_active": newStatus})
}

func (h *Handler) UpdateDetails(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	targetIDStr := c.Params("id")

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID do colaborador inválido"})
	}

	var dto UpdateEmployeeDTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "corpo da requisição inválido"})
	}

	if err := h.validator.Struct(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.UpdateDetails(c.Context(), claims.OrgID, targetID, dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "EMPLOYEE_UPDATE", "employee", targetID.String(), map[string]interface{}{
			"full_name": dto.FullName,
			"email":     dto.Email,
			"role":      dto.Role,
		})
	}

	return c.JSON(fiber.Map{"message": "Dados do colaborador atualizados com sucesso"})
}

func (h *Handler) Delete(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	targetIDStr := c.Params("id")

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID do colaborador inválido"})
	}

	if err := h.service.Delete(c.Context(), claims.OrgID, targetID); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "EMPLOYEE_DELETE", "employee", targetID.String(), nil)
	}

	return c.JSON(fiber.Map{"message": "Colaborador removido da organização com sucesso"})
}

func (h *Handler) ResetPassword(c *fiber.Ctx) error {
	claims := middleware.GetClaims(c)
	targetIDStr := c.Params("id")

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ID do colaborador inválido"})
	}

	newPassword, err := h.service.ResetPassword(c.Context(), claims.OrgID, targetID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if h.service.audit != nil {
		h.service.audit.LogFromCtx(c, "EMPLOYEE_RESET_PASSWORD", "employee", targetID.String(), nil)
	}

	return c.JSON(ResetPasswordResult{NewPassword: newPassword})
}
