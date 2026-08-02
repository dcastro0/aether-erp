import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Eye,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  UserCheck,
  UserX,
  Trash2,
  Edit3,
  KeyRound,
  Copy,
  Sparkles,
  Check,
  ShieldAlert
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type Employee, type UpdateEmployeeDTO } from "../lib/api";
import { exportToCSV } from "../lib/export";

const createSchema = z.object({
  full_name: z.string().min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  email: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(["admin", "editor", "viewer"], {
    required_error: "Selecione o nível de acesso",
  }),
});

const editSchema = z.object({
  full_name: z.string().min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  email: z.string().email("Endereço de e-mail inválido"),
  role: z.enum(["admin", "editor", "viewer"], {
    required_error: "Selecione o nível de acesso",
  }),
});

type CreateEmployeeForm = z.infer<typeof createSchema>;
type EditEmployeeForm = z.infer<typeof editSchema>;

interface CreatedCredentials {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export default function EmployeesPage() {
  const user = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || '{"role": "owner"}')
    : { role: "owner" };
  const role = user?.role || "owner";
  const isAdminOrOwner = role === "owner" || role === "admin";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  // Created credentials modal state (For export/download)
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null);
  const [resetCredentials, setResetCredentials] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => api.get<Employee[]>("/protected/employees"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeForm) =>
      api.post<{ employee: Employee; generated_password: string }>("/protected/employees", data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      closeCreateModal();

      // Open credentials export modal
      setCreatedCredentials({
        full_name: res.employee.fullName || res.employee.full_name || variables.full_name,
        email: res.employee.email,
        password: res.generated_password,
        role: res.employee.role,
      });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeDTO }) =>
      api.put(`/protected/employees/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditingEmployee(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (emp: Employee) =>
      api.post<{ new_password: string }>(`/protected/employees/${emp.id}/reset-password`, {}).then(res => ({
        emp,
        new_password: res.new_password
      })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setResetCredentials({
        name: data.emp.full_name,
        email: data.emp.email,
        password: data.new_password,
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/protected/employees/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/protected/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setDeletingEmployeeId(null);
    },
  });

  // Form for Creating Employee
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    setValue: setCreateValue,
    watch: watchCreate,
    formState: { errors: errorsCreate },
  } = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createSchema) as any,
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "editor",
    },
  });

  // Form for Editing Employee
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: errorsEdit },
  } = useForm<EditEmployeeForm>({
    resolver: zodResolver(editSchema) as any,
  });

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditValue("full_name", emp.full_name);
    setEditValue("email", emp.email);
    setEditValue("role", emp.role === "owner" ? "admin" : (emp.role as any));
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreate();
  };

  const handleAutoGenerateCredentials = () => {
    const fullName = watchCreate("full_name");
    if (!fullName || fullName.trim().length < 3) {
      alert("Por favor, preencha o Nome Completo primeiro para gerar o e-mail.");
      return;
    }

    const parts = fullName.trim().toLowerCase().split(/\s+/);
    let autoEmail = "";
    if (parts.length === 1) {
      autoEmail = `${parts[0]}@aether.local`;
    } else {
      autoEmail = `${parts[0]}.${parts[parts.length - 1]}@aether.local`;
    }

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const autoPassword = `Aether@${randomDigits}`;

    setCreateValue("email", autoEmail);
    setCreateValue("password", autoPassword);
  };

  const onSubmitCreate = (data: CreateEmployeeForm) => {
    createMutation.mutate(data);
  };

  const onSubmitEdit = (data: EditEmployeeForm) => {
    if (!editingEmployee) return;
    updateDetailsMutation.mutate({ id: editingEmployee.id, data });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCredentialsTxt = (name: string, email: string, password: string, role?: string) => {
    const content = `===========================================
   AETHER ERP - CREDENCIAIS DO COLABORADOR
===========================================

Nome: ${name}
E-mail: ${email}
Senha Provisória: ${password}
${role ? `Cargo / Acesso: ${role.toUpperCase()}` : ''}

Nota: No primeiro acesso à sua conta, o sistema
exigirá a alteração desta senha para uma senha definitiva.

Acesse o sistema em: http://localhost:5173
===========================================`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credenciais_${name.toLowerCase().replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!employees) return;
    exportToCSV(
      employees,
      [
        { header: "Nome Completo", accessor: (e) => e.full_name },
        { header: "Email", accessor: (e) => e.email },
        { header: "Cargo / Permissão", accessor: (e) => e.role.toUpperCase() },
        { header: "Status", accessor: (e) => (e.is_active ? "Ativo" : "Inativo") },
        {
          header: "Data de Entrada",
          accessor: (e) => new Date(e.joined_at).toLocaleDateString(),
        },
      ],
      "relatorio_equipe",
    );
  };

  const metrics = useMemo(() => {
    if (!employees) return { total: 0, admins: 0, editors: 0, viewers: 0 };
    return {
      total: employees.length,
      admins: employees.filter((e) => e.role === "owner" || e.role === "admin").length,
      editors: employees.filter((e) => e.role === "editor").length,
      viewers: employees.filter((e) => e.role === "viewer").length,
    };
  }, [employees]);

  const filteredEmployees = employees?.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === "all"
        ? true
        : roleFilter === "admin"
        ? emp.role === "owner" || emp.role === "admin"
        : emp.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return {
          label: "Proprietário",
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: ShieldCheck,
        };
      case "admin":
        return {
          label: "Administrador",
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-400",
          icon: Shield,
        };
      case "editor":
        return {
          label: "Operador / Editor",
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          icon: Edit,
        };
      case "viewer":
      default:
        return {
          label: "Visualizador",
          bg: "bg-slate-500/10 border-slate-500/30 text-slate-400",
          icon: Eye,
        };
    }
  };

  if (!isAdminOrOwner) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Acesso Restrito</h2>
          <p className="text-sm text-[#94A3B8] max-w-md leading-relaxed">
            Esta área de gestão de equipe e controle de acessos é exclusiva para Administradores da empresa.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
              Equipe & Controle de Acessos (RBAC)
            </h1>
            <p className="text-sm text-[#94A3B8]">
              Gerencie colaboradores, crie logins automáticos com senhas aleatórias e redefina acessos.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl border border-[#1E293B] bg-[#0F172A] px-4 py-2.5 text-sm font-medium text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] shadow-sm transition-all"
            >
              <Download size={16} />
              Exportar CSV
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0284C7] shadow-lg shadow-sky-500/20 transition-all"
            >
              <UserPlus size={16} />
              Novo Funcionário
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  Total de Colaboradores
                </p>
                <p className="mt-1 text-2xl font-bold text-[#F8FAFC]">
                  {metrics.total}
                </p>
              </div>
              <div className="rounded-xl bg-[#0EA5E9]/10 p-3 text-[#0EA5E9]">
                <Users size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  Administradores
                </p>
                <p className="mt-1 text-2xl font-bold text-sky-400">
                  {metrics.admins}
                </p>
              </div>
              <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
                <ShieldCheck size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  Operadores / Editores
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">
                  {metrics.editors}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                <Edit size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                  Visualizadores
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-300">
                  {metrics.viewers}
                </p>
              </div>
              <div className="rounded-xl bg-slate-500/10 p-3 text-slate-400">
                <Eye size={22} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-[#0F172A] p-3 rounded-2xl border border-[#1E293B] shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] py-2 pl-9 pr-4 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#64748B] font-medium hidden sm:inline">Nível:</span>
            {[
              { id: "all", label: "Todos" },
              { id: "admin", label: "Admins" },
              { id: "editor", label: "Operadores" },
              { id: "viewer", label: "Visualizadores" },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => setRoleFilter(role.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  roleFilter === role.id
                    ? "bg-[#0EA5E9] text-white shadow-sm"
                    : "bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-[#0EA5E9]" size={32} />
            </div>
          ) : filteredEmployees?.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-[#64748B] gap-2">
              <Users size={32} />
              <p className="text-sm font-medium">Nenhum colaborador encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#090D16] border-b border-[#1E293B]">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-[#94A3B8]">Colaborador</th>
                    <th className="px-6 py-4 font-semibold text-[#94A3B8]">Nível de Acesso</th>
                    <th className="px-6 py-4 font-semibold text-[#94A3B8]">Data de Admissão</th>
                    <th className="px-6 py-4 font-semibold text-[#94A3B8]">Status</th>
                    <th className="px-6 py-4 text-right font-semibold text-[#94A3B8]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {filteredEmployees?.map((emp) => {
                    const badge = getRoleBadge(emp.role);
                    const BadgeIcon = badge.icon;
                    const initials = emp.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr key={emp.id} className="hover:bg-[#1E293B]/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 text-[#0EA5E9] flex items-center justify-center font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-[#F8FAFC]">{emp.full_name}</p>
                              <p className="text-xs text-[#64748B]">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                            <BadgeIcon size={13} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#94A3B8]">
                          {new Date(emp.joined_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              emp.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {emp.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {emp.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {emp.role !== "owner" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-2 rounded-lg border border-[#1E293B] text-[#94A3B8] hover:text-[#0EA5E9] hover:bg-[#1E293B] transition-all"
                                title="Editar Colaborador"
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Reset Senha Button */}
                              <button
                                onClick={() => resetPasswordMutation.mutate(emp)}
                                disabled={resetPasswordMutation.isPending}
                                className="p-2 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
                                title="Resetar Senha do Colaborador"
                              >
                                {resetPasswordMutation.isPending ? (
                                  <Loader2 className="animate-spin" size={15} />
                                ) : (
                                  <KeyRound size={15} />
                                )}
                              </button>

                              <button
                                onClick={() => toggleActiveMutation.mutate(emp.id)}
                                className={`p-2 rounded-lg border transition-all text-xs font-medium ${
                                  emp.is_active
                                    ? "border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                                    : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                                }`}
                                title={emp.is_active ? "Desativar Acesso" : "Ativar Acesso"}
                              >
                                {emp.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                              </button>

                              <button
                                onClick={() => setDeletingEmployeeId(emp.id)}
                                className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                                title="Remover Colaborador"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Funcionário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] p-6 shadow-2xl border border-[#1E293B]">
            <div className="flex items-center justify-between mb-5 border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#F8FAFC]">Cadastrar Novo Colaborador</h2>
                  <p className="text-xs text-[#94A3B8]">Gere e-mail e senha aleatórios automaticamente.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#94A3B8]">
                    Nome Completo
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateCredentials}
                    className="text-[11px] font-semibold text-[#0EA5E9] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Auto-Gerar Dados
                  </button>
                </div>
                <input
                  {...registerCreate("full_name")}
                  placeholder="Ex: Carlos Eduardo Silva"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all placeholder:text-[#64748B]"
                />
                {errorsCreate.full_name && (
                  <p className="text-xs text-[#F87171] mt-1">{errorsCreate.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  E-mail (Deixe em branco para auto-gerar baseado no nome)
                </label>
                <input
                  type="text"
                  {...registerCreate("email")}
                  placeholder="carlos.silva@aether.local ou seu e-mail"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all placeholder:text-[#64748B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Senha Provisória (Deixe em branco para gerar aleatória)
                </label>
                <input
                  type="text"
                  {...registerCreate("password")}
                  placeholder="Ex: Aether@4928"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Nível de Acesso (Cargo RBAC)
                </label>
                <select
                  {...registerCreate("role")}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                >
                  <option value="admin">Administrador (Acesso completo)</option>
                  <option value="editor">Operador / Editor (Vendas, Estoque e Financeiro)</option>
                  <option value="viewer">Visualizador (Leitura e Relatórios)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#1E293B] mt-6">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 rounded-xl border border-[#1E293B] bg-[#090D16] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0284C7] disabled:opacity-70 shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Criando...
                    </>
                  ) : (
                    "Cadastrar Colaborador"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Credenciais Geradas (Novo Funcionário) */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] p-6 shadow-2xl border border-[#0EA5E9]/40 space-y-5">
            <div className="flex items-center gap-3 text-[#0EA5E9] border-b border-[#1E293B] pb-4">
              <div className="p-3 bg-[#0EA5E9]/10 rounded-xl border border-[#0EA5E9]/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F8FAFC]">Colaborador Criado com Sucesso!</h3>
                <p className="text-xs text-[#94A3B8]">Copie ou baixe o arquivo com as credenciais abaixo.</p>
              </div>
            </div>

            <div className="bg-[#090D16] p-4 rounded-xl border border-[#1E293B] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Nome:</span>
                <span className="text-[#F8FAFC] font-semibold">{createdCredentials.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">E-mail:</span>
                <span className="text-[#38BDF8] font-bold">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Senha Provisória:</span>
                <span className="text-amber-400 font-black">{createdCredentials.password}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] italic">
              * O colaborador precisará alterar a senha no primeiro acesso à sua conta.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => copyToClipboard(`Nome: ${createdCredentials.full_name}\nE-mail: ${createdCredentials.email}\nSenha: ${createdCredentials.password}`)}
                className="w-full rounded-xl bg-[#1E293B] hover:bg-[#334155] py-2.5 text-xs font-semibold text-[#F8FAFC] transition-all flex items-center justify-center gap-2 border border-[#334155]"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Credenciais Copiadas!" : "Copiar Credenciais"}
              </button>

              <button
                onClick={() => downloadCredentialsTxt(createdCredentials.full_name, createdCredentials.email, createdCredentials.password, createdCredentials.role)}
                className="w-full rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] py-2.5 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
              >
                <Download size={14} />
                Baixar TXT de Credenciais
              </button>

              <button
                onClick={() => setCreatedCredentials(null)}
                className="w-full rounded-xl border border-[#1E293B] py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] mt-1"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Senha Resetada pelo Admin */}
      {resetCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] p-6 shadow-2xl border border-amber-500/40 space-y-5">
            <div className="flex items-center gap-3 text-amber-400 border-b border-[#1E293B] pb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <KeyRound size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#F8FAFC]">Senha Resetada com Sucesso!</h3>
                <p className="text-xs text-[#94A3B8]">Nova senha provisória gerada para {resetCredentials.name}.</p>
              </div>
            </div>

            <div className="bg-[#090D16] p-4 rounded-xl border border-[#1E293B] space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Colaborador:</span>
                <span className="text-[#F8FAFC] font-semibold">{resetCredentials.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">E-mail:</span>
                <span className="text-[#38BDF8] font-bold">{resetCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Nova Senha Provisória:</span>
                <span className="text-amber-400 font-black">{resetCredentials.password}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] italic">
              * O colaborador será obrigado a cadastrar uma nova senha ao fazer login.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => copyToClipboard(`Nome: ${resetCredentials.name}\nE-mail: ${resetCredentials.email}\nNova Senha: ${resetCredentials.password}`)}
                className="w-full rounded-xl bg-[#1E293B] hover:bg-[#334155] py-2.5 text-xs font-semibold text-[#F8FAFC] transition-all flex items-center justify-center gap-2 border border-[#334155]"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? "Senha Copiada!" : "Copiar Nova Senha"}
              </button>

              <button
                onClick={() => downloadCredentialsTxt(resetCredentials.name, resetCredentials.email, resetCredentials.password)}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Download size={14} />
                Baixar TXT com Nova Senha
              </button>

              <button
                onClick={() => setResetCredentials(null)}
                className="w-full rounded-xl border border-[#1E293B] py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] mt-1"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Funcionário */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#0F172A] p-6 shadow-2xl border border-[#1E293B]">
            <div className="flex items-center justify-between mb-5 border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-[#F8FAFC]">Editar Colaborador</h2>
                  <p className="text-xs text-[#94A3B8]">Atualize nome, e-mail ou cargo de acesso.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Nome Completo
                </label>
                <input
                  {...registerEdit("full_name")}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                />
                {errorsEdit.full_name && (
                  <p className="text-xs text-[#F87171] mt-1">{errorsEdit.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  {...registerEdit("email")}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                />
                {errorsEdit.email && (
                  <p className="text-xs text-[#F87171] mt-1">{errorsEdit.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Nível de Acesso (Cargo RBAC)
                </label>
                <select
                  {...registerEdit("role")}
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                >
                  <option value="admin">Administrador (Acesso completo)</option>
                  <option value="editor">Operador / Editor (Vendas, Estoque e Financeiro)</option>
                  <option value="viewer">Visualizador (Leitura e Relatórios)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#1E293B] mt-6">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 rounded-xl border border-[#1E293B] bg-[#090D16] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateDetailsMutation.isPending}
                  className="flex-1 rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0284C7] disabled:opacity-70 shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {updateDetailsMutation.isPending ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {deletingEmployeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-[#0F172A] p-6 shadow-2xl border border-[#1E293B] text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-bold text-[#F8FAFC]">Remover Colaborador?</h3>
            <p className="mt-2 text-xs text-[#94A3B8]">
              Esta ação removerá o funcionário da empresa. O acesso será revogado imediatamente.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletingEmployeeId(null)}
                className="flex-1 rounded-xl border border-[#1E293B] bg-[#090D16] px-4 py-2.5 text-xs font-semibold text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingEmployeeId)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl bg-[#F87171] px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-70 shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  "Remover"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
