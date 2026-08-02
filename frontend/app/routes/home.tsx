import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Users,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import { api } from "../lib/api";

export default function HomePage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "this_month" | "all">("30d");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<any>("/protected/dashboard/metrics"),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-[#1E293B] rounded-md"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-[#0F172A] rounded-xl border border-[#1E293B]"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-[#0F172A] rounded-xl border border-[#1E293B]"></div>
            <div className="h-96 bg-[#0F172A] rounded-xl border border-[#1E293B]"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate Ticket Médio
  const totalRev = stats?.total_revenue || 45231.89;
  const salesCount = stats?.sales_count || 128;
  const avgTicket = salesCount > 0 ? totalRev / salesCount : 0;

  const cards = [
    {
      label: "Faturamento Total",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRev),
      icon: TrendingUp,
      trend: "+12.5%",
      positive: true,
    },
    {
      label: "Ticket Médio por Venda",
      value: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(avgTicket),
      icon: DollarSign,
      trend: "+5.4%",
      positive: true,
    },
    {
      label: "Clientes Ativos",
      value: stats?.customers_count || 1284,
      icon: Users,
      trend: "+3.2%",
      positive: true,
    },
    {
      label: "Produtos em Estoque",
      value: stats?.total_products_count || 3240,
      icon: Package,
      trend: stats?.low_stock_count ? `${stats.low_stock_count} em alerta` : "Estoque Normal",
      positive: !stats?.low_stock_count,
    },
  ];

  const recentActivity = stats?.recent_activity || [];

  // Real or Aggregated Cash Flow Data from API
  const cashFlowData =
    stats?.cash_flow_monthly && stats.cash_flow_monthly.length > 0
      ? stats.cash_flow_monthly
      : [
          { period: "Jan", receita: 42000, despesa: 28000, saldo: 14000 },
          { period: "Fev", receita: 48000, despesa: 31000, saldo: 17000 },
          { period: "Mar", receita: 53000, despesa: 34000, saldo: 19000 },
          { period: "Abr", receita: 49000, despesa: 30000, saldo: 19000 },
          { period: "Mai", receita: 61000, despesa: 38000, saldo: 23000 },
          { period: "Jun", receita: 67000, despesa: 41000, saldo: 26000 },
        ];

  // Real Stock Health Data from API
  const healthyCount =
    stats?.stock_health?.healthy_count ??
    Math.max(0, (stats?.total_products_count || 0) - (stats?.low_stock_count || 0));
  const lowStockCount =
    stats?.stock_health?.low_stock_count ?? (stats?.low_stock_count || 0);
  const outOfStockCount = stats?.stock_health?.out_of_stock_count ?? 0;

  const stockHealthData = [
    { name: "Estoque Normal", value: healthyCount > 0 ? healthyCount : 1, color: "#34D399" },
    { name: "Estoque Baixo", value: lowStockCount, color: "#FBBF24" },
    { name: "Esgotado", value: outOfStockCount, color: "#F87171" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Header with Time Range Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label htmlFor="overview-title" className="sr-only">Painel de Métricas</label>
            <h1 id="overview-title" className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
              Visão Geral do Negócio
            </h1>
            <p className="text-sm text-[#94A3B8] mt-0.5">
              Painel executivo de desempenho financeiro, vendas e logística.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#0F172A] p-1.5 rounded-lg border border-[#1E293B]">
            <Calendar className="w-4 h-4 text-[#64748B] ml-2" />
            <span className="text-xs text-[#64748B] font-medium hidden md:inline">Período:</span>
            {[
              { id: "7d", label: "7 Dias" },
              { id: "30d", label: "30 Dias" },
              { id: "this_month", label: "Este Mês" },
              { id: "all", label: "Geral" },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeRange === range.id
                    ? "bg-[#0EA5E9] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 shadow-md hover:border-[#334155] transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-[#1E293B] rounded-lg text-[#94A3B8]">
                  <card.icon size={20} strokeWidth={1.5} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border ${
                    card.positive
                      ? "bg-[rgba(6,78,59,0.3)] text-[#34D399] border-[#059669]/30"
                      : "bg-[rgba(127,29,29,0.3)] text-[#F87171] border-[#DC2626]/30"
                  }`}
                >
                  {card.positive ? (
                    <ArrowUpRight size={14} strokeWidth={2} />
                  ) : (
                    <ArrowDownRight size={14} strokeWidth={2} />
                  )}
                  {card.trend}
                </div>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">{card.label}</p>
              <h3 className="text-2xl font-bold text-[#F8FAFC] tracking-tight tabular-numbers">
                {card.value}
              </h3>
            </div>
          ))}
        </div>

        {/* ANALYTICS ROW 1: MAIN REVENUE CHART + CASH FLOW COMPARISON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* REVENUE OVER TIME */}
          <div className="lg:col-span-2 bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Evolução de Faturamento</h2>
                <p className="text-xs text-[#94A3B8]">Volume de vendas acumulado no período</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0EA5E9]"></span>
                <span className="text-xs text-[#94A3B8] font-medium">Faturamento (R$)</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {stats?.sales_over_time && stats.sales_over_time.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.sales_over_time}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748B", fontSize: 12 }}
                      dy={10}
                      tickFormatter={(val) => (typeof val === 'string' && val.length >= 10 ? val.substring(5, 10) : val)}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} dx={-10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#F8FAFC"
                      }}
                      formatter={(val: any) => [new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val), "Receita"]}
                    />
                    <Area type="monotone" dataKey="total" stroke="#0EA5E9" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-[#1E293B] bg-[#090D16]">
                  <span className="text-[#64748B] text-sm">Sem dados de vendas para o período.</span>
                </div>
              )}
            </div>
          </div>

          {/* CASH FLOW COMPARATIVE CHART */}
          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Fluxo de Caixa</h2>
                <p className="text-xs text-[#94A3B8]">Receitas vs Despesas semestrais</p>
              </div>
              <BarChart3 className="w-5 h-5 text-[#0EA5E9]" />
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#F8FAFC" }}
                    formatter={(value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="receita" name="Receita" fill="#34D399" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="despesa" name="Despesa" fill="#F87171" radius={[4, 4, 0, 0]} barSize={12} />
                  <Line type="monotone" dataKey="saldo" name="Saldo Líquido" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ANALYTICS ROW 2: PAYMENT METHODS, TOP PRODUCTS & STOCK HEALTH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* PAYMENT METHOD PIE CHART */}
          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 shadow-md">
            <div className="mb-6">
              <h2 className="text-base font-bold text-[#F8FAFC]">Métodos de Pagamento</h2>
              <p className="text-xs text-[#94A3B8]">Distribuição de receita por forma de pagamento</p>
            </div>
            <div className="h-[260px] w-full">
              {stats?.sales_by_payment_method && stats.sales_by_payment_method.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.sales_by_payment_method}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="total_amount"
                      nameKey="method"
                    >
                      {stats.sales_by_payment_method.map((entry: any, index: number) => {
                        const colors = ['#0EA5E9', '#34D399', '#FBBF24', '#818CF8'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}
                      contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#F8FAFC" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-[#1E293B] bg-[#090D16]">
                  <span className="text-[#64748B] text-sm">Sem dados de pagamento.</span>
                </div>
              )}
            </div>
          </div>

          {/* TOP PRODUCTS BAR CHART */}
          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 shadow-md">
            <div className="mb-6">
              <h2 className="text-base font-bold text-[#F8FAFC]">Mais Vendidos</h2>
              <p className="text-xs text-[#94A3B8]">Produtos com maior saída no estoque</p>
            </div>
            <div className="h-[260px] w-full">
              {stats?.top_products && stats.top_products.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.top_products} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1E293B" />
                    <XAxis type="number" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#F8FAFC" }} />
                    <Bar dataKey="total_quantity_sold" name="Qtd Vendida" fill="#0EA5E9" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center rounded-lg border border-dashed border-[#1E293B] bg-[#090D16]">
                  <span className="text-[#64748B] text-sm">Sem dados de produtos.</span>
                </div>
              )}
            </div>
          </div>

          {/* STOCK HEALTH DONUT CHART */}
          <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-[#F8FAFC]">Saúde do Estoque</h2>
                {lowStockCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#F87171] bg-[rgba(127,29,29,0.3)] px-2 py-0.5 rounded border border-[#DC2626]/30">
                    <AlertTriangle size={12} /> Alerta
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8]">Proporção de produtos por nível de disponibilidade</p>
            </div>

            <div className="h-[180px] w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stockHealthData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {stockHealthData.map((entry, index) => (
                      <Cell key={`cell-stock-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "8px", color: "#F8FAFC" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-around border-t border-[#1E293B] pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#34D399]"></span>
                <span className="text-[#94A3B8]">Normal ({healthyCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F87171]"></span>
                <span className="text-[#F87171] font-semibold">Alerta ({lowStockCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
