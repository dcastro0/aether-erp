import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type DashboardMetrics } from "../lib/api";

export default function DashboardHome() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => api.get<DashboardMetrics>("/protected/dashboard/metrics"),
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500">
            Métricas principais da sua operação hoje.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-green-50 p-3 text-green-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Receita Total
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(metrics?.total_revenue || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Vendas Concluídas
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {metrics?.sales_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total de Clientes
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {metrics?.customers_count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-xl p-3 ${(metrics?.low_stock_count || 0) > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"}`}
                >
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Alerta de Estoque
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {metrics?.low_stock_count || 0} produtos
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-96 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-400">
          Área reservada para o gráfico de faturamento mensal
        </div>
      </div>
    </DashboardLayout>
  );
}
