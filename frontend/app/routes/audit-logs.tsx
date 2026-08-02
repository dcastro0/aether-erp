import React, { useState, useEffect } from "react";
import { DashboardLayout } from "~/components/DashboardLayout";
import { api } from "~/lib/api";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  FileJson,
  Lock,
  RefreshCw,
  Eye,
  X,
  Clock,
  Shield,
  Layers,
  Globe,
} from "lucide-react";

export interface AuditLogItem {
  id: string;
  organization_id: string;
  user_id?: string;
  user_email?: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id?: string;
  status: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const [userRole, setUserRole] = useState<string>("owner");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filters
  const [search, setSearch] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Selected Log Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUserRole(parsed.role || "owner");
        } catch {}
      }
    }
    fetchAuditLogs();
  }, [entityFilter, actionFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (entityFilter !== "all") params.append("entity", entityFilter);
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (search) params.append("search", search);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("limit", "100");

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const data = await api.get<{ data: AuditLogItem[]; total: number }>(
        `/protected/audit-logs${queryStr}`
      );
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar logs de auditoria");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = [
      "ID",
      "Data/Hora",
      "Usuário",
      "Email",
      "Ação",
      "Entidade",
      "ID Recurso",
      "IP",
      "Detalhes",
    ];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.created_at).toLocaleString("pt-BR"),
      l.user_name,
      l.user_email || "",
      l.action,
      l.entity,
      l.entity_id || "",
      l.ip_address || "",
      JSON.stringify(l.details || {}).replace(/"/g, '""'),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join(
        "\n"
      );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `audit-logs-aether-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadge = (action: string) => {
    if (action.includes("LOGIN")) {
      return {
        bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        label: "LOGIN",
      };
    }
    if (action.includes("CREATE")) {
      return {
        bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        label: "CRIAÇÃO",
      };
    }
    if (action.includes("UPDATE") || action.includes("CHANGE") || action.includes("ROLE")) {
      return {
        bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        label: "EDIÇÃO",
      };
    }
    if (action.includes("DELETE") || action.includes("TOGGLE")) {
      return {
        bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        label: "EXCLUSÃO / STATUS",
      };
    }
    return {
      bg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      label: action,
    };
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case "auth":
        return "Autenticação";
      case "product":
        return "Produtos & Estoque";
      case "customer":
        return "Clientes / CRM";
      case "order":
        return "Vendas / PDV";
      case "employee":
        return "Gestão de Equipe";
      case "financial":
        return "Financeiro";
      default:
        return entity;
    }
  };

  if (userRole !== "owner" && userRole !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <Lock size={40} />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Acesso Restrito</h2>
          <p className="text-sm text-[#94A3B8] max-w-md">
            Você não possui permissão para visualizar os logs de auditoria e segurança da empresa. Entre em contato com o proprietário ou administrador.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 text-[#0EA5E9]">
                <ShieldCheck size={20} />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
                Logs de Auditoria & Rastreabilidade
              </h1>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Registro histórico e imutável de acessos, modificações e operações no sistema
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAuditLogs}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0F172A] border border-[#1E293B] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Atualizar
            </button>

            <button
              onClick={handleExportCSV}
              disabled={!logs.length}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-xs font-medium text-white transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Metrics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/20">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                Total de Eventos
              </p>
              <p className="text-xl font-bold text-[#F8FAFC]">{total}</p>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                Acessos & Logins
              </p>
              <p className="text-xl font-bold text-[#F8FAFC]">
                {logs.filter((l) => l.action.includes("LOGIN")).length}
              </p>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                Operações de Dados
              </p>
              <p className="text-xl font-bold text-[#F8FAFC]">
                {logs.filter((l) => !l.action.includes("LOGIN")).length}
              </p>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#94A3B8]">
                IPs Distintos
              </p>
              <p className="text-xl font-bold text-[#F8FAFC]">
                {new Set(logs.map((l) => l.ip_address).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search Controls */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                type="text"
                placeholder="Buscar por usuário, email, ação ou endereço IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#090D16] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#0EA5E9] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="bg-[#090D16] border border-[#1E293B] text-xs text-[#F8FAFC] rounded-xl px-3 py-2 focus:border-[#0EA5E9] focus:outline-none"
              >
                <option value="all">Todas Entidades</option>
                <option value="auth">Autenticação</option>
                <option value="product">Produtos & Estoque</option>
                <option value="customer">Clientes / CRM</option>
                <option value="order">Vendas / PDV</option>
                <option value="employee">Equipe & Permissões</option>
                <option value="financial">Financeiro</option>
              </select>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-[#090D16] border border-[#1E293B] text-xs text-[#F8FAFC] rounded-xl px-3 py-2 focus:border-[#0EA5E9] focus:outline-none"
              >
                <option value="all">Todas Ações</option>
                <option value="LOGIN_SUCCESS">Logins Efetuados</option>
                <option value="PRODUCT_CREATE">Criação de Produtos</option>
                <option value="CUSTOMER_CREATE">Criação de Clientes</option>
                <option value="ORDER_CREATE">Vendas Realizadas</option>
                <option value="EMPLOYEE_CREATE">Novos Colaboradores</option>
                <option value="EMPLOYEE_ROLE_CHANGE">Alteração de Cargos</option>
                <option value="PASSWORD_CHANGE">Alteração de Senha</option>
                <option value="FINANCIAL_CREATE">Lançamento Financeiro</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-xs font-medium text-[#F8FAFC] rounded-xl transition-colors"
              >
                Filtrar
              </button>
            </div>
          </form>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#94A3B8] space-y-3">
              <RefreshCw size={24} className="animate-spin mx-auto text-[#0EA5E9]" />
              <p>Carregando registros de auditoria...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-xs text-rose-400">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#94A3B8] space-y-2">
              <ShieldCheck size={32} className="mx-auto text-[#64748B]" />
              <p className="font-semibold text-[#F8FAFC]">Nenhum registro encontrado</p>
              <p>Não há eventos de auditoria correspondentes aos filtros selecionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] bg-[#090D16]/50 text-[#94A3B8]">
                    <th className="py-3.5 px-4 font-semibold">Data / Hora</th>
                    <th className="py-3.5 px-4 font-semibold">Usuário Responsável</th>
                    <th className="py-3.5 px-4 font-semibold">Ação Registrada</th>
                    <th className="py-3.5 px-4 font-semibold">Categoria</th>
                    <th className="py-3.5 px-4 font-semibold">Endereço IP</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {logs.map((log) => {
                    const badge = getActionBadge(log.action);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-[#1E293B]/40 transition-colors group"
                      >
                        <td className="py-3.5 px-4 text-[#94A3B8] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} className="text-[#64748B]" />
                            <span>
                              {new Date(log.created_at).toLocaleString("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "medium",
                              })}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9] font-bold text-[10px]">
                              {log.user_name ? log.user_name.slice(0, 2).toUpperCase() : "US"}
                            </div>
                            <div>
                              <p className="font-medium text-[#F8FAFC]">{log.user_name || "Sistema"}</p>
                              {log.user_email && (
                                <p className="text-[10px] text-[#64748B]">{log.user_email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-semibold tracking-wide uppercase ${badge.bg}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#94A3B8] whitespace-nowrap font-medium">
                          {getEntityLabel(log.entity)}
                        </td>

                        <td className="py-3.5 px-4 text-[#64748B] font-mono text-[11px] whitespace-nowrap">
                          {log.ip_address || "127.0.0.1"}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                            title="Ver detalhes em JSON"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal JSON Details */}
        {selectedLog && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9]">
                    <FileJson size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F8FAFC]">
                      Detalhes do Evento de Auditoria
                    </h3>
                    <p className="text-[10px] text-[#94A3B8] font-mono">{selectedLog.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#090D16] p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-medium">
                    Ação
                  </span>
                  <span className="font-bold text-[#F8FAFC]">{selectedLog.action}</span>
                </div>
                <div className="bg-[#090D16] p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-medium">
                    Entidade Afetada
                  </span>
                  <span className="font-bold text-[#F8FAFC]">
                    {getEntityLabel(selectedLog.entity)}
                  </span>
                </div>
                <div className="bg-[#090D16] p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-medium">
                    Usuário
                  </span>
                  <span className="font-bold text-[#F8FAFC]">
                    {selectedLog.user_name} ({selectedLog.user_email || "N/A"})
                  </span>
                </div>
                <div className="bg-[#090D16] p-3 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-[#64748B] block uppercase font-medium">
                    Endereço IP
                  </span>
                  <span className="font-mono text-[#F8FAFC]">
                    {selectedLog.ip_address || "127.0.0.1"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#94A3B8] mb-2 block">
                  Metadados e Carga Util (JSON Payload)
                </span>
                <pre className="bg-[#090D16] border border-[#1E293B] p-4 rounded-xl text-[11px] font-mono text-[#38BDF8] overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-xs font-medium text-[#F8FAFC] transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
