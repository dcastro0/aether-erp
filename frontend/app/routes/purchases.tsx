import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  api,
  type PurchaseOrder,
  type Supplier,
  type Product,
  type CreatePurchaseOrderDTO,
  type CreatePurchaseOrderItemDTO
} from "../lib/api";
import {
  ShoppingBag,
  Plus,
  Search,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Calendar,
  DollarSign
} from "lucide-react";

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [receiveLoadingId, setReceiveLoadingId] = useState<string | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<CreatePurchaseOrderItemDTO[]>([]);

  // Item Temp Input
  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemUnitCost, setItemUnitCost] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ordersData, suppliersData, productsData] = await Promise.all([
        api.get<PurchaseOrder[]>("/protected/purchases"),
        api.get<Supplier[]>("/protected/suppliers"),
        api.get<Product[]>("/protected/products"),
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados de compras.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : "");
    setExpectedDelivery("");
    setNotes("");
    setItems([]);
    setSelectedProductId(products.length > 0 ? products[0].id : "");
    setItemQuantity(1);
    setItemUnitCost(0);
    setModalError("");
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      setModalError("Selecione um produto.");
      return;
    }
    if (itemQuantity <= 0) {
      setModalError("A quantidade deve ser maior que zero.");
      return;
    }
    if (itemUnitCost < 0) {
      setModalError("O custo unitário não pode ser negativo.");
      return;
    }

    const existingIndex = items.findIndex((i) => i.product_id === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += itemQuantity;
      updated[existingIndex].unit_cost = itemUnitCost;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_id: selectedProductId,
          quantity: itemQuantity,
          unit_cost: itemUnitCost,
        },
      ]);
    }
    setModalError("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + item.quantity * item.unit_cost, 0);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      setModalError("Selecione um fornecedor.");
      return;
    }
    if (items.length === 0) {
      setModalError("Adicione pelo menos um item à ordem de compra.");
      return;
    }

    try {
      setModalLoading(true);
      setModalError("");

      const dto: CreatePurchaseOrderDTO = {
        supplier_id: selectedSupplierId,
        notes: notes,
        expected_delivery: expectedDelivery ? new Date(expectedDelivery).toISOString() : undefined,
        items: items,
      };

      await api.post("/protected/purchases", dto);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "Erro ao criar ordem de compra.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleReceiveOrder = async (orderId: string, supplierName?: string) => {
    if (!confirm(`Confirmar o recebimento físico dos produtos da ordem de compra? O estoque dos produtos será incrementado e uma despesa será lançada no financeiro.`)) {
      return;
    }

    try {
      setReceiveLoadingId(orderId);
      await api.post(`/protected/purchases/${orderId}/receive`, {});
      fetchData();
    } catch (err: any) {
      alert(err.message || "Erro ao dar entrada na ordem de compra.");
    } finally {
      setReceiveLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((po) =>
    (po.supplier_name && po.supplier_name.toLowerCase().includes(search.toLowerCase())) ||
    po.id.includes(search) ||
    po.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-aether-text flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-aether-accent" />
              Ordens de Compra & Estoque
            </h1>
            <p className="text-sm text-aether-text-muted mt-1">
              Emita pedidos de compra para fornecedores e dê entrada automática no estoque da empresa
            </p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-aether-accent hover:bg-aether-accent-hover text-white font-semibold rounded-lg shadow-md transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Ordem de Compra
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-aether-surface border border-aether-border rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-aether-text-muted uppercase font-medium tracking-wider">Ordens Pendentes</p>
              <p className="text-xl font-bold text-aether-text">
                {orders.filter((o) => o.status === "pending").length}
              </p>
            </div>
          </div>
          <div className="bg-aether-surface border border-aether-border rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-aether-text-muted uppercase font-medium tracking-wider">Recebidas & Em Estoque</p>
              <p className="text-xl font-bold text-aether-text">
                {orders.filter((o) => o.status === "received").length}
              </p>
            </div>
          </div>
          <div className="bg-aether-surface border border-aether-border rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-aether-text-muted uppercase font-medium tracking-wider">Total em Compras</p>
              <p className="text-xl font-bold text-aether-text">
                R$ {orders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-aether-text-muted" />
          <input
            type="text"
            placeholder="Buscar por fornecedor, código da ordem ou status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-aether-surface border border-aether-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-aether-text placeholder-aether-text-muted/70 focus:outline-none focus:border-aether-accent"
          />
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-aether-text-muted gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-aether-accent" />
            <span>Carregando ordens de compra...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-aether-surface border border-aether-border rounded-xl py-12 text-center text-aether-text-muted">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-50 stroke-[1.5]" />
            <p className="text-base font-medium text-aether-text">Nenhuma ordem de compra cadastrada</p>
            <p className="text-xs text-aether-text-muted mt-1">Emita a primeira ordem de compra para repor seu estoque.</p>
          </div>
        ) : (
          <div className="bg-aether-surface border border-aether-border rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-aether-bg text-aether-text-muted uppercase text-[11px] font-semibold tracking-wider border-b border-aether-border">
                  <tr>
                    <th className="px-5 py-3.5">Cód. Ordem</th>
                    <th className="px-5 py-3.5">Fornecedor</th>
                    <th className="px-5 py-3.5">Valor Total</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Data Pedido</th>
                    <th className="px-5 py-3.5">Entrada no Estoque</th>
                    <th className="px-5 py-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-aether-text">
                  {filteredOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-aether-accent font-medium">
                        #{po.id.substring(0, 8)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-aether-text">
                        {po.supplier_name || "Fornecedor Removido"}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-aether-text">
                        R$ {Number(po.total_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5">
                        {po.status === "received" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Recebida / Em Estoque
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            Aguardando Entrega
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-aether-text-muted">
                        {new Date(po.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-aether-text-muted">
                        {po.received_at ? new Date(po.received_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {po.status === "pending" && (
                          <button
                            onClick={() => handleReceiveOrder(po.id, po.supplier_name)}
                            disabled={receiveLoadingId === po.id}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-semibold rounded-lg transition-colors text-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            {receiveLoadingId === po.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PackageCheck className="w-3.5 h-3.5" />
                            )}
                            <span>Dar Entrada</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Nova Ordem de Compra */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-aether-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-aether-surface border border-aether-border rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-aether-border flex justify-between items-center bg-aether-bg">
                <h3 className="font-semibold text-aether-text text-lg flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-aether-accent" />
                  Nova Ordem de Compra
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-aether-text-muted hover:text-aether-text text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveOrder} className="p-6 space-y-5">
                {modalError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-aether-text-muted">Fornecedor *</label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-aether-text focus:outline-none focus:border-aether-accent"
                    >
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.document ? `(${s.document})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-aether-text-muted">Previsão de Entrega</label>
                    <input
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                      className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-aether-text focus:outline-none focus:border-aether-accent"
                    />
                  </div>
                </div>

                {/* Sub-Seção Adicionar Itens */}
                <div className="bg-aether-bg border border-aether-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-aether-text uppercase tracking-wider">Itens da Compra</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full bg-aether-surface border border-aether-border rounded-lg px-2.5 py-1.5 text-xs text-aether-text"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Atual em estoque: {p.stock_quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(Number(e.target.value))}
                        className="w-full bg-aether-surface border border-aether-border rounded-lg px-2.5 py-1.5 text-xs text-aether-text placeholder-aether-text-muted/70"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Custo Unit (R$)"
                        value={itemUnitCost}
                        onChange={(e) => setItemUnitCost(Number(e.target.value))}
                        className="w-full bg-aether-surface border border-aether-border rounded-lg px-2.5 py-1.5 text-xs text-aether-text placeholder-aether-text-muted/70"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-1.5 bg-aether-surface hover:bg-aether-bg border border-aether-border text-aether-text text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Item à Ordem
                  </button>

                  {/* Tabela de Itens Adicionados */}
                  {items.length > 0 && (
                    <div className="mt-3 border-t border-aether-border pt-2 space-y-1">
                      {items.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.product_id);
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs py-1 px-2 bg-aether-surface rounded border border-aether-border">
                            <span className="text-aether-text font-medium">{prod?.name || "Produto"}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-aether-text-muted">{item.quantity}x R$ {item.unit_cost.toFixed(2)}</span>
                              <span className="font-bold text-aether-text">R$ {(item.quantity * item.unit_cost).toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-500 hover:text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-between items-center pt-2 font-bold text-sm text-aether-accent border-t border-aether-border">
                        <span>Total da Compra:</span>
                        <span>R$ {calculateTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-aether-text-muted">Observações / Termos de Pagamento</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Condição de pagamento 30 dias, prazo de entrega estipulado..."
                    className="w-full bg-aether-bg border border-aether-border rounded-lg px-3 py-2 text-sm text-aether-text focus:outline-none focus:border-aether-accent resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-aether-border flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-aether-bg hover:bg-aether-surface border border-aether-border text-aether-text-muted hover:text-aether-text text-sm font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 bg-aether-accent hover:bg-aether-accent-hover text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Criar Ordem de Compra</span>
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
