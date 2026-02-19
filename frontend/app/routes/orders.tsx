import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Receipt,
  ShoppingBag,
  X,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type Order, type OrderDetails } from "../lib/api";

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 1. Buscar Lista de Pedidos
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<Order[]>("/protected/orders"),
  });

  // 2. Buscar Detalhes (Só executa se tiver um pedido selecionado)
  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ["order-details", selectedOrder?.id],
    queryFn: () =>
      api.get<OrderDetails>(`/protected/orders/${selectedOrder?.id}`),
    enabled: !!selectedOrder,
  });

  const filteredOrders = orders?.filter(
    (o) =>
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "canceled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
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
        {/* LISTA DE PEDIDOS (PRINCIPAL) */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Histórico de Vendas
              </h1>
              <p className="text-sm text-slate-500">
                Consulte todas as transações realizadas.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por cliente ou ID..."
                className="w-full rounded-xl border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      ID / Data
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Cliente
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">
                      Total
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-slate-500"
                      >
                        Carregando...
                      </td>
                    </tr>
                  ) : filteredOrders?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-12 text-center text-slate-400"
                      >
                        Nenhuma venda encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders?.map((order) => (
                      <tr
                        key={order.id}
                        className={`group transition-all hover:bg-blue-50/50 cursor-pointer ${selectedOrder?.id === order.id ? "bg-blue-50" : ""}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs text-slate-400">
                              #{order.id.slice(0, 8)}
                            </span>
                            <div className="flex items-center gap-1 text-slate-700 mt-1">
                              <Calendar size={12} className="text-slate-400" />
                              <span>
                                {new Date(
                                  order.created_at,
                                ).toLocaleDateString()}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>
                                {new Date(order.created_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">
                            {order.customer_name}
                          </span>
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
                          <span className="font-bold text-slate-900 text-base">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(order.total_amount))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight
                            className={`text-slate-300 transition-transform ${selectedOrder?.id === order.id ? "text-blue-500 translate-x-1" : "group-hover:text-blue-400"}`}
                            size={20}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DETALHES LATERAL (SLIDE OVER) */}
        {selectedOrder && (
          <div className="w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0 z-20 lg:relative lg:shadow-none lg:border lg:rounded-2xl lg:h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-900">Detalhes do Pedido</h2>
                <p className="text-xs text-slate-500 font-mono">
                  #{selectedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                      Valor Total
                    </p>
                    <p className="text-xl font-black text-slate-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(selectedOrder.total_amount))}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Cliente</p>
                    <p
                      className="font-medium text-slate-900 truncate"
                      title={selectedOrder.customer_name}
                    >
                      {selectedOrder.customer_name}
                    </p>
                  </div>
                  <div className="p-3 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Data</p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedOrder.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Itens */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Receipt size={14} /> Itens do Pedido
                </h3>

                {loadingDetails ? (
                  <div className="py-8 text-center text-slate-400 text-sm">
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
                          <p className="font-medium text-slate-800 text-sm">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.quantity}x{" "}
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.unit_price)}
                          </p>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">
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

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <FileText size={16} /> Imprimir Recibo
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
