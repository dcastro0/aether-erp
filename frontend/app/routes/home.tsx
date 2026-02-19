import { DashboardLayout } from "../components/DashboardLayout";

export default function DashboardHome() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500">
            Métricas principais da sua operação hoje.
          </p>
        </div>

        {/* Cards de Exemplo (Stat Cards) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { label: "Receita Total", value: "R$ 124.500", trend: "+12%" },
            { label: "Pedidos Ativos", value: "45", trend: "+5%" },
            {
              label: "Produtos Baixo Estoque",
              value: "8",
              trend: "-2%",
              bad: true,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl bg-white p-6 shadow-sm border border-slate-100"
            >
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {stat.value}
                </span>
                <span
                  className={`text-sm font-medium ${stat.bad ? "text-red-600" : "text-green-600"}`}
                >
                  {stat.trend}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Área Vazia para Conteúdo Futuro */}
        <div className="h-96 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
          Gráficos de desempenho virão aqui
        </div>
      </div>
    </DashboardLayout>
  );
}
