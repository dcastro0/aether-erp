import React from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  History,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Package, label: "Produtos", path: "/dashboard/products" },
    { icon: Users, label: "Clientes", path: "/dashboard/customers" },
    { icon: ShoppingCart, label: "Nova Venda", path: "/dashboard/sales" },
    { icon: History, label: "Pedidos", path: "/dashboard/orders" },
    { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-black text-xl">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">
              Aether<span className="text-blue-600">ERP</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={20}
                    className={
                      isActive ? "text-blue-600" : "group-hover:text-slate-700"
                    }
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {isActive && (
                  <ChevronRight size={14} className="text-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Sair da Conta
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
