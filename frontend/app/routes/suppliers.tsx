import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type Supplier, type CreateSupplierDTO } from "../lib/api";
import {
  Truck,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const [formData, setFormData] = useState<CreateSupplierDTO>({
    name: "",
    trade_name: "",
    document: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get<Supplier[]>("/protected/suppliers");
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setFormData({
        name: sup.name,
        trade_name: sup.trade_name || "",
        document: sup.document || "",
        email: sup.email || "",
        phone: sup.phone || "",
        address: sup.address || "",
        notes: sup.notes || "",
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        trade_name: "",
        document: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
    }
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("O nome do fornecedor é obrigatório.");
      return;
    }

    try {
      setModalLoading(true);
      setModalError("");

      if (editingSupplier) {
        await api.put(`/protected/suppliers/${editingSupplier.id}`, formData);
      } else {
        await api.post("/protected/suppliers", formData);
      }

      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      setModalError(err.message || "Erro ao salvar fornecedor.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o fornecedor "${name}"?`)) return;

    try {
      await api.delete(`/protected/suppliers/${id}`);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.message || "Erro ao remover fornecedor.");
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.trade_name && s.trade_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.document && s.document.includes(search)) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-aether-text flex items-center gap-2.5">
              <Truck className="w-7 h-7 text-aether-accent" />
              Gestão de Fornecedores
            </h1>
            <p className="text-sm text-aether-text-muted mt-1">
              Cadastre e acompanhe empresas parceiras para emissão de compras e reposição de estoque
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-aether-accent hover:bg-aether-accent-hover text-white font-semibold rounded-lg shadow-md transition-all text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-aether-surface border border-aether-border rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-[var(--accent-light)] border border-[var(--accent)]/20 rounded-lg text-[var(--accent)]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-aether-text-muted uppercase font-medium tracking-wider">Total Registrado</p>
              <p className="text-xl font-bold text-aether-text">{suppliers.length}</p>
            </div>
          </div>
          <div className="bg-aether-surface border border-aether-border rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-aether-text-muted uppercase font-medium tracking-wider">Com E-mail</p>
              <p className="text-xl font-bold text-aether-text">
                {suppliers.filter((s) => s.email && s.email.length > 0).length}
              </p>
            </div>
          </div>
          <div className="bg-aether-surface border border-aether-border rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-500">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-aether-text-muted uppercase font-medium tracking-wider">Com Telefone</p>
              <p className="text-xl font-bold text-aether-text">
                {suppliers.filter((s) => s.phone && s.phone.length > 0).length}
              </p>
            </div>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-aether-text-muted" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia, CNPJ/CPF ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-aether-surface border border-aether-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-aether-text placeholder-aether-text-muted/70 focus:outline-none focus:border-aether-accent"
          />
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-aether-text-muted gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-aether-accent" />
            <span>Carregando fornecedores...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="bg-aether-surface border border-aether-border rounded-xl py-12 text-center text-aether-text-muted">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-50 stroke-[1.5]" />
            <p className="text-base font-medium text-aether-text">Nenhum fornecedor encontrado</p>
            <p className="text-xs text-aether-text-muted mt-1">Cadastre o primeiro parceiro para poder emitir ordens de compra.</p>
          </div>
        ) : (
          <div className="bg-aether-surface border border-aether-border rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-aether-bg text-aether-text-muted uppercase text-[11px] font-semibold tracking-wider border-b border-aether-border">
                  <tr>
                    <th className="px-5 py-3.5">Razão Social / Nome</th>
                    <th className="px-5 py-3.5">Nome Fantasia</th>
                    <th className="px-5 py-3.5">Documento (CNPJ/CPF)</th>
                    <th className="px-5 py-3.5">Contato</th>
                    <th className="px-5 py-3.5">Endereço</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-aether-text">
                  {filteredSuppliers.map((sup) => (
                    <tr key={sup.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-aether-text">
                        {sup.name}
                      </td>
                      <td className="px-5 py-3.5 text-aether-text-muted">
                        {sup.trade_name || "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-aether-text">
                        {sup.document || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-aether-text-muted space-y-0.5">
                        {sup.email && (
                          <div className="flex items-center gap-1.5 text-aether-text">
                            <Mail className="w-3.5 h-3.5 text-aether-text-muted" />
                            <span>{sup.email}</span>
                          </div>
                        )}
                        {sup.phone && (
                          <div className="flex items-center gap-1.5 text-aether-text-muted">
                            <Phone className="w-3.5 h-3.5 text-aether-text-muted" />
                            <span>{sup.phone}</span>
                          </div>
                        )}
                        {!sup.email && !sup.phone && "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-aether-text-muted max-w-xs truncate">
                        {sup.address ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-aether-text-muted flex-shrink-0" />
                            <span className="truncate">{sup.address}</span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(sup)}
                          className="p-1.5 text-aether-text-muted hover:text-aether-accent bg-aether-bg hover:bg-aether-surface rounded-lg transition-colors border border-aether-border cursor-pointer"
                          title="Editar Fornecedor"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sup.id, sup.name)}
                          className="p-1.5 text-aether-text-muted hover:text-rose-500 bg-aether-bg hover:bg-aether-surface rounded-lg transition-colors border border-aether-border cursor-pointer"
                          title="Remover Fornecedor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
                <h3 className="font-semibold text-slate-100 text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {modalError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-400">Razão Social / Nome *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Distribuidora de Eletrônicos Ltda"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Nome Fantasia</label>
                    <input
                      type="text"
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      placeholder="Ex: Eletrônicos Express"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">CNPJ / CPF</label>
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">E-mail Comercial</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@fornecedor.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-0000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-400">Endereço Completo</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-slate-400">Observações Internas</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Condições de pagamento, prazos de entrega habituais..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingSupplier ? "Salvar Alterações" : "Cadastrar Fornecedor"}</span>
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
