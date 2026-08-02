import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "../components/DashboardLayout";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Drawer } from "../components/ui/Drawer";
import { Input } from "../components/ui/Input";
import { Plus, TrendingUp, TrendingDown, Wallet, Search, Filter, ArrowUpDown, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { api } from "../lib/api";

export default function FinancialPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  
  // Date and Amount Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<"description" | "due_date" | "amount">("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Drawer Form State
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [dueDate, setDueDate] = useState("");

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ["financial"],
    queryFn: () => api.get<any[]>("/protected/financial"),
  });

  const markAsPaid = useMutation({
    mutationFn: (id: string) => api.patch<any>(`/protected/financial/${id}/pay`),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["financial"] });
      const previous = queryClient.getQueryData(["financial"]);

      // Optimistic Update
      queryClient.setQueryData(["financial"], (old: any[] = []) =>
        old.map((item) => (item.id === id ? { ...item, status: "paid" } : item))
      );

      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["financial"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
    },
  });

  const createTransaction = useMutation({
    mutationFn: (payload: any) => api.post<any>("/protected/financial", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      setIsDrawerOpen(false);
      setDescription("");
      setAmount("");
      setDueDate("");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !dueDate) return;

    createTransaction.mutate({
      description,
      amount: parseFloat(amount),
      type,
      due_date: dueDate,
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  const totals = transactions.reduce(
    (acc: any, curr: any) => {
      if (curr.type === "income") acc.income += curr.amount;
      if (curr.type === "expense") acc.expense += curr.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  // Multi-dimensional Filtering & Sorting
  const filteredTransactions = transactions
    .filter((tx: any) => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "pending" ? tx.status === "pending" : tx.status === "paid";
      const matchesType =
        typeFilter === "all" ? true : tx.type === typeFilter;
      const matchesStartDate = !startDate || tx.due_date >= startDate;
      const matchesEndDate = !endDate || tx.due_date <= endDate;
      const matchesMinAmount = !minAmount || tx.amount >= parseFloat(minAmount);
      const matchesMaxAmount = !maxAmount || tx.amount <= parseFloat(maxAmount);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesStartDate &&
        matchesEndDate &&
        matchesMinAmount &&
        matchesMaxAmount
      );
    })
    .sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "amount") {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field: "description" | "due_date" | "amount") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <DashboardLayout>
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Gestão Financeira Avançada</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Controle tático de fluxo de caixa, relatórios e conciliação</p>
        </div>
        {(() => {
          const u = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || '{"role": "owner"}') : { role: "owner" };
          return u?.role !== "viewer" ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsDrawerOpen(true)}>
              Novo Lançamento
            </Button>
          ) : null;
        })()}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0F172A] p-6 rounded-xl border border-[#1E293B] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Receitas Totais</span>
            <div className="p-2 bg-[rgba(6,78,59,0.4)] text-[#34D399] border border-[#059669]/30 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC] tabular-numbers">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals.income)}
          </p>
        </div>

        <div className="bg-[#0F172A] p-6 rounded-xl border border-[#1E293B] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Despesas Totais</span>
            <div className="p-2 bg-[rgba(127,29,29,0.4)] text-[#F87171] border border-[#DC2626]/30 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC] tabular-numbers">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals.expense)}
          </p>
        </div>

        <div className="bg-[#0F172A] p-6 rounded-xl border border-[#1E293B] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Saldo Líquido</span>
            <div className="p-2 bg-[rgba(14,165,233,0.15)] text-[#38BDF8] border border-[#0EA5E9]/30 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#F8FAFC] tabular-numbers">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals.income - totals.expense)}
          </p>
        </div>
      </div>

      {/* Table Workstation */}
      <div className="bg-[#0F172A] rounded-xl border border-[#1E293B] shadow-xl overflow-hidden mb-8">
        {/* Filters Bar */}
        <div className="p-4 border-b border-[#1E293B] flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Buscar lançamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === "all" ? "bg-[#0EA5E9] text-white" : "bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                Todos Status
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === "pending"
                    ? "bg-[#D97706] text-white"
                    : "bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setStatusFilter("paid")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === "paid" ? "bg-[#059669] text-white" : "bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                Quitados
              </button>

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all flex items-center gap-1.5 ${
                  showAdvancedFilters || startDate || endDate || minAmount || maxAmount
                    ? "bg-[#0EA5E9]/10 text-[#38BDF8] border-[#0EA5E9]/40"
                    : "bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:text-[#F8FAFC]"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros Avançados
              </button>
            </div>
          </div>

          {/* Expanded Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-[#1E293B] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1 uppercase tracking-wider">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1 uppercase tracking-wider">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1 uppercase tracking-wider">
                  Valor Mínimo (R$)
                </label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1 uppercase tracking-wider">
                  Valor Máximo (R$)
                </label>
                <Input
                  type="number"
                  placeholder="99999,00"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                />
              </div>

              <div className="sm:col-span-2 md:col-span-4 flex items-center justify-between pt-1">
                <span className="text-xs text-[#94A3B8]">
                  Exibindo <strong className="text-[#F8FAFC]">{filteredTransactions.length}</strong> de {transactions.length} lançamentos
                </span>
                <button
                  onClick={resetFilters}
                  className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" /> Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E293B]/50 border-b border-[#1E293B] text-[11px] uppercase tracking-wider text-[#94A3B8] font-semibold">
                <th
                  onClick={() => handleSort("description")}
                  className="px-6 py-3.5 cursor-pointer hover:text-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Descrição</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5">Tipo</th>
                <th
                  onClick={() => handleSort("due_date")}
                  className="px-6 py-3.5 cursor-pointer hover:text-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Vencimento</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="px-6 py-3.5 text-right cursor-pointer hover:text-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Valor</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    Carregando lançamentos táticos...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#F87171]">
                    {(error as Error)?.message || "Erro ao conectar ao servidor backend."}
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-[#1E293B]/40 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-[#F8FAFC]">{tx.description}</td>
                    <td className="px-6 py-4">
                      {tx.type === "income" ? (
                        <Badge status="success" icon={false}>Receita</Badge>
                      ) : (
                        <Badge status="danger" icon={false}>Despesa</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#94A3B8] tabular-numbers">
                      {tx.due_date.split("-").reverse().join("/")}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#F8FAFC] text-right tabular-numbers">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tx.status === "paid" ? (
                        <Badge status="success">PAGO</Badge>
                      ) : (
                        <Badge status="warning">PENDENTE</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(() => {
                        const u = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || '{"role": "owner"}') : { role: "owner" };
                        return u?.role !== "viewer" && tx.status === "pending" ? (
                          <Button
                            variant="success"
                            size="sm"
                            isLoading={markAsPaid.isPending && markAsPaid.variables === tx.id}
                            onClick={() => markAsPaid.mutate(tx.id)}
                          >
                            Quitar
                          </Button>
                        ) : null;
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transaction Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Novo Lançamento Financeiro">
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
              Tipo de Lançamento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("income")}
                className={`py-2.5 rounded-lg font-medium text-sm border transition-all ${
                  type === "income"
                    ? "bg-[#059669]/20 text-[#34D399] border-[#059669]"
                    : "bg-[#1E293B] text-[#94A3B8] border-[#334155]"
                }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`py-2.5 rounded-lg font-medium text-sm border transition-all ${
                  type === "expense"
                    ? "bg-[#DC2626]/20 text-[#F87171] border-[#DC2626]"
                    : "bg-[#1E293B] text-[#94A3B8] border-[#334155]"
                }`}
              >
                Despesa
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
              Descrição
            </label>
            <Input
              placeholder="Ex: Pagamento Fornecedor / Faturamento Servidores"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
              Valor (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
              Data de Vencimento
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="pt-4 border-t border-[#1E293B] flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="w-1/2"
              onClick={() => setIsDrawerOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="w-1/2" isLoading={createTransaction.isPending}>
              Salvar Lançamento
            </Button>
          </div>
        </form>
      </Drawer>
    </DashboardLayout>
  );
}
