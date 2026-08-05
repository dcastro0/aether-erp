import { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Building2,
  Tag,
  Loader2,
  FileText,
  PieChart
} from "lucide-react";

interface FinancialEntry {
  id: string;
  description: string;
  entity_name: string; // Cliente ou Fornecedor
  type: "income" | "expense";
  category: string;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue";
  payment_date?: string;
}

const initialEntries: FinancialEntry[] = [
  {
    id: "FIN-001",
    description: "Venda ERP Corporate - Fatura 4802",
    entity_name: "Tech Corp Logistics",
    type: "income",
    category: "Vendas de Serviços",
    amount: 14500.0,
    due_date: "2026-08-10",
    status: "pending"
  },
  {
    id: "FIN-002",
    description: "Aluguel Sede Administrativa",
    entity_name: "Imobiliária Empreendimentos",
    type: "expense",
    category: "Infraestrutura",
    amount: 4200.0,
    due_date: "2026-08-05",
    status: "paid",
    payment_date: "2026-08-04"
  },
  {
    id: "FIN-003",
    description: "Lote de Processadores & Placas-Mãe",
    entity_name: "Intel Global Logistics",
    type: "expense",
    category: "Aquisição de Estoque",
    amount: 12800.0,
    due_date: "2026-08-15",
    status: "pending"
  },
  {
    id: "FIN-004",
    description: "Licenciamento de Software Cloud AWS",
    entity_name: "Amazon Web Services",
    type: "expense",
    category: "Serviços Cloud",
    amount: 1250.0,
    due_date: "2026-08-01",
    status: "overdue"
  },
  {
    id: "FIN-005",
    description: "Prestação de Serviços TI & Suporte",
    entity_name: "Mercado Central & Cia",
    type: "income",
    category: "Serviços de Consultoria",
    amount: 8900.0,
    due_date: "2026-08-02",
    status: "paid",
    payment_date: "2026-08-02"
  },
  {
    id: "FIN-006",
    description: "Folha de Pagamento - Equipe Comercial",
    entity_name: "Folha Interna ERP",
    type: "expense",
    category: "Recursos Humanos",
    amount: 15400.0,
    due_date: "2026-08-05",
    status: "paid",
    payment_date: "2026-08-05"
  }
];

export default function FinancialPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>(initialEntries);
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "overdue">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [entityName, setEntityName] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("Vendas de Serviços");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Metric Computations
  const totalIncome = entries
    .filter((e) => e.type === "income" && e.status === "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = entries
    .filter((e) => e.type === "expense" && e.status === "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingIncome = entries
    .filter((e) => e.type === "income" && e.status !== "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingExpense = entries
    .filter((e) => e.type === "expense" && e.status !== "paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const currentBalance = totalIncome - totalExpense + 45000; // Saldo de abertura fictício

  const filteredEntries = entries.filter((e) => {
    const matchesTab = activeTab === "all" || e.type === activeTab;
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesSearch =
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesStatus && matchesSearch;
  });

  const handleToggleStatus = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const newStatus = e.status === "paid" ? "pending" : "paid";
          return {
            ...e,
            status: newStatus,
            payment_date: newStatus === "paid" ? new Date().toISOString().split("T")[0] : undefined
          };
        }
        return e;
      })
    );
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !dueDate) return;

    const newEntry: FinancialEntry = {
      id: `FIN-00${entries.length + 1}`,
      description,
      entity_name: entityName || "Cliente / Fornecedor Diversos",
      type,
      category,
      amount: parseFloat(amount),
      due_date: dueDate,
      status: "pending"
    };

    setEntries([newEntry, ...entries]);
    setIsModalOpen(false);
    // Reset Form
    setDescription("");
    setEntityName("");
    setAmount("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-aether-text flex items-center gap-2.5">
              <Wallet className="w-6 h-6 text-sky-500" />
              Gestão Financeira & Fluxo de Caixa
            </h1>
            <p className="text-sm text-aether-text-muted mt-1">
              Acompanhamento de Contas a Pagar, Contas a Receber e previsão orçamentária do ERP
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento Financeiro
          </button>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-aether-text-muted uppercase font-medium">Saldo Atual em Caixa</p>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-aether-text mt-2">
              R$ {currentBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-emerald-500 flex items-center gap-0.5 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Positivo & Conciliado
            </span>
          </div>

          <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-aether-text-muted uppercase font-medium">A Receber (Pendente)</p>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <ArrowUpCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-500 mt-2">
              R$ {pendingIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-aether-text-muted mt-1 block">
              Receitas Futuras Confirmadas
            </span>
          </div>

          <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-aether-text-muted uppercase font-medium">A Pagar (Pendente)</p>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <ArrowDownCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-500 mt-2">
              R$ {pendingExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-rose-500 flex items-center gap-0.5 mt-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Compromissos Agendados
            </span>
          </div>

          <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-xs text-aether-text-muted uppercase font-medium">Fluxo Projetado</p>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-indigo-400 mt-2">
              R$ {(currentBalance + pendingIncome - pendingExpense).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-aether-text-muted mt-1 block">
              Projeção de Final de Mês
            </span>
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="bg-aether-surface border border-aether-border rounded-2xl p-4 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-aether-bg p-1 rounded-xl border border-aether-border">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "all" ? "bg-aether-surface text-aether-text shadow-sm" : "text-aether-text-muted hover:text-aether-text"
                }`}
              >
                Todos os Títulos
              </button>
              <button
                onClick={() => setActiveTab("income")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "income" ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" : "text-aether-text-muted hover:text-aether-text"
                }`}
              >
                Contas a Receber
              </button>
              <button
                onClick={() => setActiveTab("expense")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "expense" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-aether-text-muted hover:text-aether-text"
                }`}
              >
                Contas a Pagar
              </button>
            </div>

            {/* Status Selector & Search */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-aether-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  aria-label="Buscar Lançamento Financeiro"
                  placeholder="Buscar fornecedor, descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-aether-bg border border-aether-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                aria-label="Filtrar por Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-aether-bg border border-aether-border rounded-xl px-3 py-1.5 text-xs text-aether-text focus:outline-none focus:border-sky-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendentes</option>
                <option value="paid">Liquidados / Pagos</option>
                <option value="overdue">Vencidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-aether-surface border border-aether-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-aether-bg text-aether-text-muted uppercase text-[11px] font-semibold tracking-wider border-b border-aether-border">
                <tr>
                  <th className="px-5 py-3.5">Código / Tipo</th>
                  <th className="px-5 py-3.5">Descrição</th>
                  <th className="px-5 py-3.5">Entidade (Cliente/Fornecedor)</th>
                  <th className="px-5 py-3.5">Categoria</th>
                  <th className="px-5 py-3.5">Vencimento</th>
                  <th className="px-5 py-3.5">Valor (R$)</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aether-border text-aether-text">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-aether-text-muted text-xs">
                      Nenhum lançamento financeiro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-aether-bg transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          {entry.type === "income" ? (
                            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" title="Receita">
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="p-1 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20" title="Despesa">
                              <ArrowDownCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="font-semibold text-aether-text-muted">{entry.id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-aether-text">{entry.description}</td>
                      <td className="px-5 py-3.5 text-aether-text-muted flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-aether-text-muted" />
                        <span>{entry.entity_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-aether-bg border border-aether-border text-aether-text-muted">
                          {entry.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-aether-text-muted">
                        {entry.due_date}
                      </td>
                      <td className={`px-5 py-3.5 font-bold font-mono ${entry.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                        {entry.type === "income" ? "+" : "-"} R$ {entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5">
                        {entry.status === "paid" ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" /> Liquidado
                          </span>
                        ) : entry.status === "overdue" ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" /> Vencido
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleStatus(entry.id)}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer border ${
                            entry.status === "paid"
                              ? "bg-aether-bg hover:bg-aether-surface border-aether-border text-aether-text-muted"
                              : "bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-500"
                          }`}
                        >
                          {entry.status === "paid" ? "Estornar" : "Quitar Título"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal para Novo Lançamento */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-aether-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-aether-surface border border-aether-border rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-aether-border pb-3">
                <h3 className="font-bold text-lg text-aether-text flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-sky-500" />
                  Novo Lançamento Financeiro
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-aether-text-muted hover:text-aether-text cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-aether-text-muted mb-1">Tipo de Operação</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full bg-aether-bg border border-aether-border rounded-xl px-3 py-2 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                    >
                      <option value="income">Contas a Receber (+ Receita)</option>
                      <option value="expense">Contas a Pagar (- Despesa)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-aether-text-muted mb-1">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-aether-bg border border-aether-border rounded-xl px-3 py-2 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                    >
                      <option value="Vendas de Serviços">Vendas de Serviços</option>
                      <option value="Vendas de Produtos">Vendas de Produtos</option>
                      <option value="Aquisição de Estoque">Aquisição de Estoque</option>
                      <option value="Infraestrutura">Infraestrutura / Aluguel</option>
                      <option value="Recursos Humanos">Folha de Pagamento</option>
                      <option value="Serviços Cloud">Serviços Cloud & TI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-aether-text-muted mb-1">Descrição do Título</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fatura de Manutenção Mensal 08/2026"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-aether-bg border border-aether-border rounded-xl px-3 py-2 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-aether-text-muted mb-1">Cliente / Fornecedor (Entidade)</label>
                  <input
                    type="text"
                    placeholder="Ex: Acme Corporation Ltda"
                    value={entityName}
                    onChange={(e) => setEntityName(e.target.value)}
                    className="w-full bg-aether-bg border border-aether-border rounded-xl px-3 py-2 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-aether-text-muted mb-1">Valor Total (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-aether-bg border border-aether-border rounded-xl px-3 py-2 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-aether-text-muted mb-1">Data de Vencimento</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-aether-bg border border-aether-border rounded-xl px-3 py-2 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-aether-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-aether-bg hover:bg-aether-surface border border-aether-border text-aether-text-muted text-xs font-medium rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Salvar Lançamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
