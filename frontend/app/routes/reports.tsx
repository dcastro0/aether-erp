import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type DREReport, type ABCItem, type SellerPerformance } from "../lib/api";
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
  PieChart,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"dre" | "abc" | "sellers">("dre");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data States
  const [dre, setDre] = useState<DREReport | null>(null);
  const [abcItems, setAbcItems] = useState<ABCItem[]>([]);
  const [sellers, setSellers] = useState<SellerPerformance[]>([]);

  // Filter Dates
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      if (activeTab === "dre") {
        const data = await api.get<DREReport>(`/protected/reports/dre?start_date=${startDate}&end_date=${endDate}`);
        setDre(data);
      } else if (activeTab === "abc") {
        const data = await api.get<ABCItem[]>("/protected/reports/abc-curve");
        setAbcItems(data);
      } else if (activeTab === "sellers") {
        const data = await api.get<SellerPerformance[]>("/protected/reports/sellers");
        setSellers(data);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, startDate, endDate]);

  const handleExportCSV = () => {
    let csvContent = "";
    let fileName = "";

    if (activeTab === "dre" && dre) {
      fileName = `DRE_${startDate}_a_${endDate}.csv`;
      csvContent = "Indicador;Valor (R$)\n";
      csvContent += `Receita Bruta;${dre.gross_revenue.toFixed(2)}\n`;
      csvContent += `Deducoes / Devolucoes;${dre.deductions.toFixed(2)}\n`;
      csvContent += `Receita Liquida;${dre.net_revenue.toFixed(2)}\n`;
      csvContent += `Custo das Mercadorias (CMV);${dre.cost_of_goods_sold.toFixed(2)}\n`;
      csvContent += `Lucro Bruto;${dre.gross_profit.toFixed(2)}\n`;
      csvContent += `Despesas Operacionais;${dre.operating_expenses.toFixed(2)}\n`;
      csvContent += `Lucro / Prejuizo Liquido;${dre.net_profit.toFixed(2)}\n`;
      csvContent += `Margem Bruta (%);${dre.gross_margin_percent.toFixed(2)}%\n`;
      csvContent += `Margem Liquida (%);${dre.net_margin_percent.toFixed(2)}%\n`;
    } else if (activeTab === "abc") {
      fileName = "Curva_ABC_Produtos.csv";
      csvContent = "Produto;Quantidade Vendida;Faturamento (R$);Participacao (%);Acumulado (%);Classe\n";
      abcItems.forEach((item) => {
        csvContent += `"${item.product_name}";${item.total_quantity};${item.total_revenue.toFixed(2)};${item.share_percent.toFixed(2)}%;${item.cumulated_share.toFixed(2)}%;${item.class}\n`;
      });
    } else if (activeTab === "sellers") {
      fileName = "Desempenho_Vendedores.csv";
      csvContent = "Vendedor;Vendas Realizadas;Faturamento Total (R$);Ticket Medio (R$)\n";
      sellers.forEach((seller) => {
        csvContent += `"${seller.seller_name}";${seller.total_sales};${seller.total_revenue.toFixed(2)};${seller.avg_ticket.toFixed(2)}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-aether-text flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
              Relatórios & Business Intelligence (BI)
            </h1>
            <p className="text-sm text-aether-text-muted mt-1">
              Demonstrativo do Resultado do Exercício (DRE), Curva ABC de produtos e ranking de vendas da equipe
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 bg-aether-surface hover:bg-aether-bg text-emerald-500 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exportar CSV / Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-aether-surface hover:bg-aether-bg text-aether-text border border-aether-border text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-aether-border pb-1">
          <button
            onClick={() => setActiveTab("dre")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 -mb-1 cursor-pointer ${
              activeTab === "dre"
                ? "border-emerald-500 text-emerald-500 bg-aether-surface"
                : "border-transparent text-aether-text-muted hover:text-aether-text"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            DRE Simplificado
          </button>
          <button
            onClick={() => setActiveTab("abc")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 -mb-1 cursor-pointer ${
              activeTab === "abc"
                ? "border-sky-500 text-sky-500 bg-aether-surface"
                : "border-transparent text-aether-text-muted hover:text-aether-text"
            }`}
          >
            <PieChart className="w-4 h-4" />
            Curva ABC de Produtos
          </button>
          <button
            onClick={() => setActiveTab("sellers")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 -mb-1 cursor-pointer ${
              activeTab === "sellers"
                ? "border-indigo-500 text-indigo-500 bg-aether-surface"
                : "border-transparent text-aether-text-muted hover:text-aether-text"
            }`}
          >
            <Award className="w-4 h-4" />
            Desempenho da Equipe
          </button>
        </div>

        {/* Filter Controls (for DRE) */}
        {activeTab === "dre" && (
          <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-aether-text uppercase tracking-wider">Período de Análise:</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <input
                type="date"
                aria-label="Data Inicial"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-aether-bg border border-aether-border rounded-xl px-3 py-1.5 text-aether-text focus:outline-none focus:border-emerald-500"
              />
              <span className="text-aether-text-muted">até</span>
              <input
                type="date"
                aria-label="Data Final"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-aether-bg border border-aether-border rounded-xl px-3 py-1.5 text-aether-text focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-aether-text-muted gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span>Gerando relatório estatístico...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-rose-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div>
            {/* TAB 1: DRE SIMPLIFICADO */}
            {activeTab === "dre" && dre && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-aether-text-muted uppercase font-medium">Receita Bruta</p>
                    <p className="text-2xl font-bold text-aether-text mt-1">
                      R$ {dre.gross_revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] text-emerald-500 flex items-center gap-0.5 mt-1 font-medium">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Total Vendas no Período
                    </span>
                  </div>

                  <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-aether-text-muted uppercase font-medium">Lucro Bruto</p>
                    <p className="text-2xl font-bold text-emerald-500 mt-1">
                      R$ {dre.gross_profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] text-aether-text-muted mt-1 block">
                      Margem Bruta: <strong className="text-aether-text">{dre.gross_margin_percent.toFixed(1)}%</strong>
                    </span>
                  </div>

                  <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-aether-text-muted uppercase font-medium">Despesas Operacionais</p>
                    <p className="text-2xl font-bold text-amber-500 mt-1">
                      R$ {dre.operating_expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] text-rose-500 flex items-center gap-0.5 mt-1 font-medium">
                      <ArrowDownRight className="w-3.5 h-3.5" /> Custos de Infraestrutura/Folha
                    </span>
                  </div>

                  <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
                    <p className="text-xs text-aether-text-muted uppercase font-medium">Resultado Líquido</p>
                    <p className={`text-2xl font-bold mt-1 ${dre.net_profit >= 0 ? "text-sky-500" : "text-rose-500"}`}>
                      R$ {dre.net_profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[11px] text-aether-text-muted mt-1 block">
                      Margem Líquida: <strong className={dre.net_profit >= 0 ? "text-sky-500 font-bold" : "text-rose-500 font-bold"}>{dre.net_margin_percent.toFixed(1)}%</strong>
                    </span>
                  </div>
                </div>

                {/* Estrutura DRE Demonstrativo em Tabela Contábil */}
                <div className="bg-aether-surface border border-aether-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-aether-border bg-aether-bg">
                    <h3 className="font-semibold text-aether-text text-sm uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Demonstrativo de Resultado do Exercício (DRE Sintético)
                    </h3>
                  </div>
                  <div className="p-6 divide-y divide-aether-border space-y-3">
                    <div className="flex justify-between items-center text-sm font-semibold text-aether-text">
                      <span>(+) RECEITA BRUTA DE VENDAS</span>
                      <span className="font-mono text-emerald-500">R$ {dre.gross_revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-aether-text-muted pt-3 pl-4">
                      <span>(-) Deduções da Receita & Devoluções</span>
                      <span className="font-mono text-rose-500">R$ {dre.deductions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold text-aether-text pt-3">
                      <span>(=) RECEITA OPERACIONAL LÍQUIDA</span>
                      <span className="font-mono text-aether-text">R$ {dre.net_revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-aether-text-muted pt-3 pl-4">
                      <span>(-) Custo das Mercadorias Vendidas (CMV)</span>
                      <span className="font-mono text-rose-500">R$ {dre.cost_of_goods_sold.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-emerald-500 pt-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                      <span>(=) LUCRO BRUTO (MARGEM BRUTA: {dre.gross_margin_percent.toFixed(1)}%)</span>
                      <span className="font-mono text-base">R$ {dre.gross_profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-aether-text-muted pt-3 pl-4">
                      <span>(-) Despesas Operacionais (Administrativas, Vendas & Fixas)</span>
                      <span className="font-mono text-amber-500">R$ {dre.operating_expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className={`flex justify-between items-center text-base font-bold pt-3 p-3 rounded-xl border ${
                      dre.net_profit >= 0 ? "bg-sky-500/10 border-sky-500/30 text-sky-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                    }`}>
                      <span>(=) LUCRO / PREJUÍZO LÍQUIDO DO PERÍODO</span>
                      <span className="font-mono text-lg">R$ {dre.net_profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CURVA ABC DE PRODUTOS */}
            {activeTab === "abc" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 border-l-4 border-l-emerald-500 shadow-sm">
                    <p className="text-xs text-emerald-500 font-semibold uppercase">Classe A (Vitais)</p>
                    <p className="text-sm text-aether-text mt-1">Representam <strong>80% do faturamento</strong>. Alto valor estratégico.</p>
                  </div>
                  <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 border-l-4 border-l-amber-500 shadow-sm">
                    <p className="text-xs text-amber-500 font-semibold uppercase">Classe B (Intermediários)</p>
                    <p className="text-sm text-aether-text mt-1">Representam <strong>15% do faturamento</strong>. Giro moderado.</p>
                  </div>
                  <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 border-l-4 border-l-slate-400 shadow-sm">
                    <p className="text-xs text-aether-text-muted font-semibold uppercase">Classe C (Cauda Longa)</p>
                    <p className="text-sm text-aether-text mt-1">Representam os <strong>5% finais do faturamento</strong>. Baixo valor acumulado.</p>
                  </div>
                </div>

                <div className="bg-aether-surface border border-aether-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-aether-bg text-aether-text-muted uppercase text-[11px] font-semibold tracking-wider border-b border-aether-border">
                        <tr>
                          <th className="px-5 py-3.5">Classe</th>
                          <th className="px-5 py-3.5">Produto</th>
                          <th className="px-5 py-3.5">Qtd Vendida</th>
                          <th className="px-5 py-3.5">Faturamento Total</th>
                          <th className="px-5 py-3.5">% Participação</th>
                          <th className="px-5 py-3.5">% Acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-aether-border text-aether-text">
                        {abcItems.map((item) => (
                          <tr key={item.product_id} className="hover:bg-aether-bg transition-colors">
                            <td className="px-5 py-3.5">
                              {item.class === "A" ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                  Classe A
                                </span>
                              ) : item.class === "B" ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                                  Classe B
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-aether-bg text-aether-text-muted border border-aether-border">
                                  Classe C
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-aether-text">{item.product_name}</td>
                            <td className="px-5 py-3.5 font-mono text-aether-text-muted">{item.total_quantity} un</td>
                            <td className="px-5 py-3.5 font-bold text-aether-text">
                              R$ {item.total_revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs text-sky-500">
                              {item.share_percent.toFixed(2)}%
                            </td>
                            <td className="px-5 py-3.5 font-mono text-xs text-aether-text-muted">
                              {item.cumulated_share.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DESEMPENHO DA EQUIPE DE VENDAS */}
            {activeTab === "sellers" && (
              <div className="space-y-6">
                <div className="bg-aether-surface border border-aether-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-aether-border bg-aether-bg">
                    <h3 className="font-semibold text-aether-text text-sm uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-500" />
                      Ranking Geral de Vendedores & Colaboradores
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-aether-bg text-aether-text-muted uppercase text-[11px] font-semibold tracking-wider border-b border-aether-border">
                        <tr>
                          <th className="px-5 py-3.5">Posição</th>
                          <th className="px-5 py-3.5">Vendedor / Colaborador</th>
                          <th className="px-5 py-3.5">Vendas Realizadas</th>
                          <th className="px-5 py-3.5">Ticket Médio</th>
                          <th className="px-5 py-3.5 text-right">Faturamento Acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-aether-border text-aether-text">
                        {sellers.map((seller, idx) => (
                          <tr key={seller.seller_id} className="hover:bg-aether-bg transition-colors">
                            <td className="px-5 py-3.5 font-bold text-aether-text-muted">
                              {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-aether-text flex items-center gap-2">
                              <Users className="w-4 h-4 text-aether-text-muted" />
                              <span>{seller.seller_name}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-aether-text-muted">{seller.total_sales} pedidos</td>
                            <td className="px-5 py-3.5 font-mono text-xs text-indigo-500">
                              R$ {seller.avg_ticket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-emerald-500 text-base">
                              R$ {seller.total_revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
