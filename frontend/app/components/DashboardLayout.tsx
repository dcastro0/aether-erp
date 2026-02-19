import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShoppingCart, // <--- Adicionado
  FileText, // <--- Adicionado
} from "lucide-react";
import { clsx } from "clsx";

interface User {
  full_name: string;
  email: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { label: "Visão Geral", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Nova Venda (PDV)", icon: ShoppingCart, path: "/dashboard/sales" },
    { label: "Histórico de Vendas", icon: FileText, path: "/dashboard/orders" },
    { label: "Produtos", icon: Package, path: "/dashboard/products" },
    { label: "Clientes", icon: Users, path: "/dashboard/customers" },
    { label: "Configurações", icon: Settings, path: "/dashboard/settings" },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <span className="text-xl font-bold tracking-tight">Aether</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={clsx(
                  "group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </div>
                {isActive && (
                  <ChevronRight size={16} className="text-blue-200" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between bg-white px-6 shadow-sm border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-500"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user.full_name}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
