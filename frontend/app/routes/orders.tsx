import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Receipt,
  ShoppingBag,
  X,
  Download,
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  User,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type Order, type OrderDetails } from "../lib/api";
import { exportToCSV } from "../lib/export";

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<Order[]>("/protected/orders"),
  });

  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ["order-details", selectedOrder?.id],
    queryFn: () =>
      api.get<OrderDetails>(`/protected/orders/${selectedOrder?.id}`),
    enabled: !!selectedOrder,
  });

  const getPaymentInfo = (method: string) => {
    switch (method) {
      case "pix":
        return { label: "PIX", icon: QrCode };
      case "credito":
        return { label: "Cartão de Crédito", icon: CreditCard };
      case "debito":
        return { label: "Cartão de Débito", icon: Wallet };
      case "dinheiro":
      default:
        return { label: "Dinheiro", icon: Banknote };
    }
  };

  const filteredOrders = orders?.filter((o) => {
    const matchesSearch =
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.seller_name && o.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment =
      paymentFilter === "all" ? true : o.payment_method === paymentFilter;
    const matchesStatus =
      statusFilter === "all" ? true : o.status === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });

  const totalFilteredSales = filteredOrders?.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0,
  ) || 0;

  const handleExport = () => {
    if (!orders) return;

    exportToCSV(
      orders,
      [
        { header: "ID do Pedido", accessor: (o) => o.id },
        { header: "Cliente", accessor: (o) => o.customer_name },
        { header: "Vendedor / Responsável", accessor: (o) => o.seller_name || "Sistema" },
        {
          header: "Data",
          accessor: (o) => new Date(o.created_at).toLocaleDateString(),
        },
        {
          header: "Hora",
          accessor: (o) => new Date(o.created_at).toLocaleTimeString(),
        },
        {
          header: "Pagamento",
          accessor: (o) => getPaymentInfo(o.payment_method).label,
        },
        { header: "Total", accessor: (o) => o.total_amount },
        {
          header: "Status",
          accessor: (o) => (o.status === "completed" ? "Concluído" : o.status),
        },
      ],
      "historico_vendas",
    );
  };

  const handlePrintReceipt = () => {
    if (!selectedOrder || !details) return;

    const paymentLabel = getPaymentInfo(selectedOrder.payment_method).label;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo #${selectedOrder.id.slice(0, 8)}</title>
          <meta name="description" content="Recibo de Venda Aether ERP" />
          <meta property="og:title" content="Recibo Aether ERP" />
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 300px; 
              margin: 0 auto; 
              padding: 20px; 
              color: #000; 
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-sm { font-size: 12px; }
            .text-xs { font-size: 10px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-4 { margin-top: 16px; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .flex { display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { text-align: left; font-size: 12px; padding: 2px 0; }
            th.right, td.right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="text-center mb-4">
            <h2 class="font-bold" style="margin:0;">AETHER ERP</h2>
            <p class="text-sm" style="margin:0;">Cupom Não Fiscal</p>
          </div>
          
          <div class="border-b text-sm">
            <p style="margin:2px 0;"><strong>Data:</strong> ${new Date(selectedOrder.created_at).toLocaleString()}</p>
            <p style="margin:2px 0;"><strong>Pedido:</strong> #${selectedOrder.id.slice(0, 8)}</p>
            <p style="margin:2px 0;"><strong>Cliente:</strong> ${selectedOrder.customer_name}</p>
            <p style="margin:2px 0;"><strong>Pagamento:</strong> ${paymentLabel}</p>
          </div>

          <table>
            <thead>
              <tr class="border-b">
                <th>Qtd</th>
                <th>Item</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${details.items
                .map(
                  (item) => `
                <tr>
                  <td>${item.quantity}x</td>
                  <td>${item.product_name}</td>
                  <td class="right">${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.total_price)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="border-b flex font-bold text-sm">
            <span>TOTAL</span>
            <span>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(selectedOrder.total_amount))}</span>
          </div>

          <div class="text-center text-xs mt-4">
            <p style="margin:2px 0;">Obrigado pela preferência!</p>
            <p style="margin:2px 0;">Volte sempre.</p>
          </div>
        </body>
      </html>
    `;

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    }

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/30";
      case "canceled":
        return "bg-rose-500/10 text-rose-500 border-rose-500/30";
      default:
        return "bg-aether-bg text-aether-text-muted border-aether-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={14} />;
      case "pending":
        return <Clock size={14} />;
      case "canceled":
        return <XCircle size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-6rem)] gap-6 relative">
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col gap-4 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-aether-text">
                  Histórico de Vendas
                </h1>
                <p className="text-sm text-aether-text-muted">
                  Consulte e filtre todas as transações da empresa.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-[var(--bg-canvas)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs flex items-center gap-2">
                  <span className="text-[var(--text-muted)]">Total Filtrado:</span>
                  <span className="font-bold text-emerald-500 tabular-numbers text-sm">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalFilteredSales)}
                  </span>
                </div>

                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 rounded-xl border border-aether-border bg-aether-surface px-4 py-2.5 text-sm font-medium text-aether-text-muted hover:bg-aether-bg shadow-sm transition-all shrink-0"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-canvas)] p-3 rounded-xl border border-[var(--border-subtle)]">
              <div className="relative w-full sm:w-72">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-aether-text-muted/70"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Buscar por cliente ou ID..."
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-[var(--text-muted)] font-medium hidden md:inline">Pagamento:</span>
                {[
                  { id: "all", label: "Todos" },
                  { id: "pix", label: "PIX" },
                  { id: "credito", label: "Crédito" },
                  { id: "debito", label: "Débito" },
                  { id: "dinheiro", label: "Dinheiro" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setPaymentFilter(item.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      paymentFilter === item.id
                        ? "bg-[var(--accent)] text-white shadow-sm"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <div className="h-4 w-px bg-[var(--border-subtle)] mx-1 hidden sm:block"></div>

                {[
                  { id: "all", label: "Status" },
                  { id: "completed", label: "Concluído" },
                  { id: "pending", label: "Pendente" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      statusFilter === item.id
                        ? "bg-emerald-500 text-white shadow-sm font-bold"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-2xl border border-aether-border bg-aether-surface shadow-sm flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-aether-bg border-b border-aether-border sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      ID / Data
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Cliente
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Vendedor / Operador
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Pagamento
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted text-right">
                      Total
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-aether-text-muted"
                      >
                        Carregando...
                      </td>
                    </tr>
                  ) : filteredOrders?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-12 text-center text-aether-text-muted/70"
                      >
                        Nenhuma venda encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders?.map((order) => {
                      const paymentMethod = getPaymentInfo(
                        order.payment_method,
                      );
                      const PaymentIcon = paymentMethod.icon;

                      return (
                        <tr
                          key={order.id}
                          className={`group transition-all hover:bg-aether-accent-muted/50 cursor-pointer ${selectedOrder?.id === order.id ? "bg-aether-accent-muted" : ""}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs text-aether-text-muted/70">
                                #{order.id.slice(0, 8)}
                              </span>
                              <div className="flex items-center gap-1 text-aether-text-muted mt-1">
                                <Calendar
                                  size={12}
                                  className="text-aether-text-muted/70"
                                />
                                <span>
                                  {new Date(
                                    order.created_at,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="text-slate-300">|</span>
                                <span>
                                  {new Date(
                                    order.created_at,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-aether-text">
                              {order.customer_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0EA5E9] bg-[#0EA5E9]/10 px-2.5 py-1 rounded-full border border-[#0EA5E9]/20">
                              <User size={12} />
                              {order.seller_name || "Sistema"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-aether-text-muted">
                              <PaymentIcon
                                size={16}
                                className="text-aether-text-muted/70"
                              />
                              <span>{paymentMethod.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusColor(order.status)}`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status === "completed"
                                ? "Concluído"
                                : order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-aether-text text-base">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(Number(order.total_amount))}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ChevronRight
                              className={`text-slate-300 transition-transform ${selectedOrder?.id === order.id ? "text-aether-accent translate-x-1" : "group-hover:text-aether-accent-hover"}`}
                              size={20}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedOrder && (
          <div className="w-96 bg-aether-surface border-l border-aether-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0 z-20 lg:relative lg:shadow-none lg:border lg:rounded-2xl lg:h-full">
            <div className="p-5 border-b border-aether-border flex items-center justify-between bg-aether-bg/50">
              <div>
                <h2 className="font-bold text-aether-text">Detalhes do Pedido</h2>
                <p className="text-xs text-aether-text-muted font-mono">
                  #{selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-aether-bg rounded-full text-aether-text-muted/70 hover:text-aether-text-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-aether-accent-muted rounded-xl border border-blue-100">
                  <div className="h-10 w-10 bg-aether-surface rounded-full flex items-center justify-center text-aether-accent shadow-sm">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-aether-accent font-bold uppercase tracking-wider">
                      Valor Total
                    </p>
                    <p className="text-xl font-black text-aether-text">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(selectedOrder.total_amount))}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 border border-aether-border rounded-lg">
                    <p className="text-xs text-aether-text-muted mb-1">Cliente</p>
                    <p
                      className="font-medium text-aether-text truncate"
                      title={selectedOrder.customer_name}
                    >
                      {selectedOrder.customer_name}
                    </p>
                  </div>
                  <div className="p-3 border border-aether-border rounded-lg">
                    <p className="text-xs text-aether-text-muted mb-1">Vendedor</p>
                    <p
                      className="font-medium text-[#0EA5E9] truncate"
                      title={selectedOrder.seller_name || "Sistema"}
                    >
                      {selectedOrder.seller_name || "Sistema"}
                    </p>
                  </div>
                  <div className="p-3 border border-aether-border rounded-lg">
                    <p className="text-xs text-aether-text-muted mb-1">Data</p>
                    <p className="font-medium text-aether-text">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-3 border border-aether-border rounded-lg col-span-2 flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-aether-bg flex items-center justify-center text-aether-text-muted shrink-0">
                      {(() => {
                        const Icon = getPaymentInfo(
                          selectedOrder.payment_method,
                        ).icon;
                        return <Icon size={16} />;
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-aether-text-muted mb-0.5">
                        Método de Pagamento
                      </p>
                      <p className="font-medium text-aether-text">
                        {getPaymentInfo(selectedOrder.payment_method).label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-aether-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Receipt size={14} /> Itens do Pedido
                </h3>

                {loadingDetails ? (
                  <div className="py-8 text-center text-aether-text-muted/70 text-sm">
                    Carregando itens...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {details?.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start py-3 border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-aether-text text-sm">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-aether-text-muted mt-0.5">
                            {item.quantity}x{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-bold text-aether-text text-sm">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.total_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-aether-border bg-aether-bg rounded-b-2xl">
              <button
                onClick={handlePrintReceipt}
                disabled={loadingDetails}
                className="w-full py-2.5 bg-aether-surface border border-aether-border text-aether-text-muted font-medium text-sm rounded-lg hover:bg-aether-bg hover:text-aether-text transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={16} /> Imprimir Recibo
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
