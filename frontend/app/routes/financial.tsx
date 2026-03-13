import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  FileText,
  Filter,
  CheckCircle2,
  Receipt,
  WalletCards,
  Clock,
  Banknote,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type FinancialTransaction, type FinancialSummary, type CreateFinancialTransactionDTO } from "../lib/api";
import { FinancialTransactionModal } from "../components/FinancialTransactionModal";

export default function FinancialPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "payable" | "receivable">("all");
  const queryClient = useQueryClient();

  const {
    data: summary,
    isLoading: isLoadingSummary,
  } = useQuery({
    queryKey: ["financial-summary"],
    queryFn: () => api.get<FinancialSummary>("/protected/financial/summary"),
  });

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    isError,
  } = useQuery({
    queryKey: ["financial-transactions", activeTab],
    queryFn: () => {
      let url = "/protected/financial/transactions";
      if (activeTab !== "all") {
        url += `?type=${activeTab}`;
      }
      return api.get<FinancialTransaction[]>(url);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFinancialTransactionDTO) =>
      api.post("/protected/financial/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      setIsModalOpen(false);
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => api.put(`/protected/financial/transactions/${id}/pay`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
    },
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num);
  };

  const totalReceivable = parseFloat(summary?.total_receivable_pending || "0") + parseFloat(summary?.total_receivable_paid || "0");
  const totalPayable = parseFloat(summary?.total_payable_pending || "0") + parseFloat(summary?.total_payable_paid || "0");
  const balance = totalReceivable - totalPayable;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestão Financeira
            </h1>
            <p className="text-sm text-slate-500">
              Controle de contas a pagar, a receber e fluxo de caixa.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus size={16} />
              Nova Transação
            </button>
          </div>
        </div>

        {/* Dashboard Summary Cards */}
        {isLoadingSummary ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Saldo Atual (Líquido)</p>
                <p className={`mt-2 text-3xl font-bold tracking-tight ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                <WalletCards size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">Receitas Previstas</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-900">
                  {formatCurrency(totalReceivable)}
                </p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                <ArrowUpRight size={24} />
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
              <Clock size={12}/> Pendente: {formatCurrency(summary?.total_receivable_pending || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50/50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Despesas Previstas</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-red-900">
                  {formatCurrency(totalPayable)}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                 <ArrowDownRight size={24} />
              </div>
            </div>
             <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
               <Clock size={12}/> Pendente: {formatCurrency(summary?.total_payable_pending || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-800">Vendas do PDV</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-900">
                   {formatCurrency(summary?.total_receivable_paid || 0)}
                </p>
              </div>
              <div className="rounded-full bg-indigo-100 p-3 text-indigo-600">
                <Banknote size={24} />
              </div>
            </div>
             <p className="mt-2 text-xs font-medium text-indigo-600">
               Receitas efetivadas já baixadas.
            </p>
          </div>
        </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTab("receivable")}
                className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === "receivable"
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-500/10"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Receitas
              </button>
              <button
                onClick={() => setActiveTab("payable")}
                className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === "payable"
                    ? "bg-white text-red-700 shadow-sm ring-1 ring-red-500/10"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Despesas
              </button>
            </div>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <Filter size={16} />
            Filtrar
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoadingTransactions ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
              <AlertCircle size={32} />
              <p>Erro ao carregar transações.</p>
            </div>
          ) : transactions?.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400 gap-4">
              <Receipt size={48} className="opacity-20" />
              <p>Nenhuma transação financeira encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">Descrição / Tipo</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Valor</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Vencimento</th>
                    <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions?.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="group hover:bg-slate-50/80 transition-all text-slate-700"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                              transaction.type === "receivable"
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {transaction.type === "receivable" ? (
                              <ArrowUpRight size={18} />
                            ) : (
                              <ArrowDownRight size={18} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                                {transaction.reference_type === 'order' && (
                                     <span className="inline-flex py-0.5 px-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold">PDV</span>
                                )}
                                <p className="text-xs text-slate-500">
                                  Registrado em {new Date(transaction.created_at).toLocaleDateString()}
                                </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold font-mono">
                         <span className={transaction.type === "receivable" ? "text-emerald-600" : "text-red-600"}>
                            {transaction.type === "receivable" ? "+" : "-"}{" "}
                            {formatCurrency(transaction.amount)}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                             <CalendarDays size={14} className="text-slate-400" />
                             {new Date(transaction.due_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex flex-col gap-1 items-start justify-center`}
                        >
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              transaction.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : transaction.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}>
                              {transaction.status === "paid" ? "Pago" : transaction.status === "pending" ? "Pendente" : "Cancelado"}
                          </span>
                          {transaction.paid_at && (
                               <span className="text-[10px] font-medium text-slate-400">{new Date(transaction.paid_at).toLocaleDateString()}</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {transaction.status === "pending" ? (
                             <button
                             onClick={() => payMutation.mutate(transaction.id)}
                             disabled={payMutation.isPending}
                             className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                               ${transaction.type === "receivable" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" : "bg-slate-900 hover:bg-slate-800 text-white"} 
                             transition-all disabled:opacity-50`}
                           >
                              <CheckCircle2 size={14} />
                             {payMutation.isPending ? "Baixando..." : "Dar Baixa"}
                           </button>
                        ) : (
                             <button disabled className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 opacity-60">
                                Liquidado
                             </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FinancialTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </DashboardLayout>
  );
}
