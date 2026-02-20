import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api } from "../lib/api";

export default function HomePage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<any>("/protected/dashboard/stats"),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-10 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-white rounded-3xl border border-slate-100"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-80 bg-white rounded-3xl border border-slate-100"></div>
            <div className="h-80 bg-white rounded-3xl border border-slate-100"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const cards = [
    {
      label: "Faturamento Total",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(stats?.total_revenue || 0),
      icon: TrendingUp,
      color: "blue",
      trend: "+12.5%",
      positive: true,
    },
    {
      label: "Total de Clientes",
      value: stats?.total_customers || 0,
      icon: Users,
      color: "indigo",
      trend: "+3.2%",
      positive: true,
    },
    {
      label: "Produtos em Estoque",
      value: stats?.total_products || 0,
      icon: Package,
      color: "emerald",
      trend: "-2.1%",
      positive: false,
    },
    {
      label: "Alertas de Estoque",
      value: stats?.low_stock_count || 0,
      icon: AlertTriangle,
      color: "amber",
      trend: "Crítico",
      positive: false,
    },
  ];

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Bem-vindo, {user.full_name}
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <Clock size={16} /> Aqui está o que aconteceu na sua empresa hoje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <card.icon size={24} />
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${
                    card.positive
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {card.positive ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {card.trend}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-900">
                Vendas Recentes
              </h2>
              <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Ver relatório completo
              </button>
            </div>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
              <span className="text-slate-400 font-medium italic">
                Gráfico de desempenho em breve...
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Ações Rápidas
            </h2>
            <div className="space-y-3 flex-1">
              <button
                onClick={() => navigate("/dashboard/sales")}
                className="w-full py-4 px-6 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-between group"
              >
                Realizar Venda
                <ArrowUpRight
                  size={18}
                  className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                />
              </button>
              <button
                onClick={() => navigate("/dashboard/products")}
                className="w-full py-4 px-6 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all text-left"
              >
                Adicionar Produto
              </button>
              <button
                onClick={() => navigate("/dashboard/customers")}
                className="w-full py-4 px-6 bg-white border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all text-left"
              >
                Novo Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
