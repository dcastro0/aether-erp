import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  History,
  Settings,
  LogOut,
  Wallet,
  Cloud,
  Search,
  Command,
  Bell,
  UserCheck,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  AlertCircle
} from "lucide-react";
import { CommandMenu } from "./ui/CommandMenu";
import { api } from "../lib/api";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);

  // Mandatory password change state & User Info
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined") {
      return JSON.parse(localStorage.getItem("user") || '{"full_name": "Usuário", "role": "owner"}');
    }
    return { full_name: "Usuário", role: "owner" };
  });

  const [mustChangePassword, setMustChangePassword] = useState(Boolean(user?.must_change_password));
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const role = user?.role || "owner";

  // Role-based menu permissions
  const allMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["owner", "admin", "editor", "viewer"] },
    { icon: Wallet, label: "Financeiro", path: "/dashboard/financial", roles: ["owner", "admin", "editor", "viewer"] },
    { icon: Package, label: "Produtos", path: "/dashboard/products", roles: ["owner", "admin", "editor", "viewer"] },
    { icon: Users, label: "Clientes", path: "/dashboard/customers", roles: ["owner", "admin", "editor", "viewer"] },
    { icon: UserCheck, label: "Equipe & Acessos", path: "/dashboard/employees", roles: ["owner", "admin"] },
    { icon: ShieldCheck, label: "Logs de Auditoria", path: "/dashboard/audit-logs", roles: ["owner", "admin"] },
    { icon: ShoppingCart, label: "Ponto de Venda", path: "/dashboard/sales", roles: ["owner", "admin", "editor"] },
    { icon: History, label: "Pedidos", path: "/dashboard/orders", roles: ["owner", "admin", "editor", "viewer"] },
    { icon: Settings, label: "Configurações", path: "/dashboard/settings", roles: ["owner", "admin", "editor", "viewer"] },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "owner":
        return "Proprietário";
      case "admin":
        return "Administrador";
      case "editor":
        return "Operador / Editor";
      case "viewer":
        return "Visualizador";
      default:
        return "Colaborador";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleForceChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");

    if (newPassword.length < 6) {
      setPassError("A nova senha deve possuir pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("A confirmação de senha não confere.");
      return;
    }

    setPassLoading(true);

    try {
      await api.put("/protected/profile/password", {
        current_password: tempPassword,
        new_password: newPassword,
      });

      const updatedUser = { ...user, must_change_password: false };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMustChangePassword(false);
    } catch (err: any) {
      setPassError(err.message || "Erro ao alterar senha. Verifique a senha atual digitada.");
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#090D16] text-[#F8FAFC] font-sans antialiased selection:bg-[#0EA5E9]/20 selection:text-[#38BDF8]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0F172A] border-r border-[#1E293B] flex flex-col z-20 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-[#1E293B] shrink-0 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 text-[#0EA5E9]">
              <Cloud size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#F8FAFC] block">Aether ERP</span>
              <span className="text-[10px] text-[#64748B] tracking-wider uppercase font-semibold">Tactical Suite</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 pb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#64748B]">Navegação</span>
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? "bg-[#0EA5E9]/10 text-[#38BDF8] border border-[#0EA5E9]/30 font-medium"
                    : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? "text-[#0EA5E9]" : "text-[#64748B] group-hover:text-[#F8FAFC]"} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1E293B] shrink-0 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
            <span>API Status</span>
            <span className="flex items-center gap-1 text-[#34D399] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse"></span> OK
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#94A3B8] hover:text-[#F87171] hover:bg-[rgba(127,29,29,0.2)] rounded-lg transition-all duration-150 group border border-transparent hover:border-[#DC2626]/30"
          >
            <LogOut size={16} strokeWidth={1.5} className="group-hover:text-[#F87171]" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between px-8 shrink-0 z-10">
          <button
            onClick={() => setIsCommandMenuOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 bg-[#1E293B] border border-[#334155] rounded-lg text-sm text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#0EA5E9] transition-all w-80 shadow-inner"
          >
            <Search size={16} className="text-[#64748B]" />
            <span className="flex-1 text-left text-xs">Buscar faturas, clientes...</span>
            <kbd className="flex items-center gap-0.5 text-[10px] bg-[#0F172A] px-1.5 py-0.5 rounded border border-[#334155] text-[#94A3B8] font-mono">
              <Command size={10} /> K
            </kbd>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] rounded-lg transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0EA5E9]"></span>
            </button>

            <div className="h-6 w-px bg-[#1E293B]"></div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/15 border border-[#0EA5E9]/40 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-[#F8FAFC]">{user?.full_name}</p>
                <p className="text-[10px] text-[#0EA5E9] font-medium uppercase tracking-wider">{getRoleLabel(role)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative bg-[#090D16]">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mandatory Password Change Modal for First Login */}
      {mustChangePassword && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-amber-400 border-b border-[#1E293B] pb-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#F8FAFC]">Primeiro Acesso ao Sistema</h3>
                <p className="text-xs text-[#94A3B8]">Defina uma nova senha de acesso pessoal.</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Por medida de segurança, contas recém-criadas ou com senha redefinida exigem a criação de uma nova senha pessoal antes do primeiro uso.
            </p>

            <form onSubmit={handleForceChangePassword} className="space-y-4">
              {passError && (
                <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs flex items-center gap-2">
                  <AlertCircle size={16} />
                  {passError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Senha Provisória Recebida
                </label>
                <input
                  type="password"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Ex: Aether@1234"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Sua Nova Senha Definitiva
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-bold text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {passLoading ? <Loader2 className="animate-spin" size={16} /> : <KeyRound size={16} />}
                Cadastrar Senha e Acessar o ERP
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global Cmd + K Menu */}
      <CommandMenu isOpen={isCommandMenuOpen} onClose={() => setIsCommandMenuOpen(false)} />
    </div>
  );
}
