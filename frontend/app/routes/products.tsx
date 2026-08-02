import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Package,
  Loader2,
  AlertCircle,
  Filter,
  Download,
  TrendingUp,
  AlertTriangle,
  Box,
  Edit2,
  Power,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type Product, type CreateProductDTO } from "../lib/api";
import { exportToCSV } from "../lib/export";

const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Preço deve ser maior que zero"),
  ),
  stock_quantity: z.preprocess(
    (val) => Number(val),
    z.number().int().min(0, "Estoque não pode ser negativo"),
  ),
  sku: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "low" | "out" | "ok">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/protected/products"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDTO) =>
      api.post("/protected/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) =>
      api.put(`/protected/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      price: 0,
      stock_quantity: 0,
      sku: "",
      description: "",
      is_active: true,
    },
  });

  const isActiveWatch = watch("is_active");

  const onSubmit = (data: ProductForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setValue("name", product.name);
    setValue("price", Number(product.price));
    setValue("stock_quantity", product.stock_quantity);
    setValue("sku", product.sku || "");
    setValue("description", product.description || "");
    setValue("is_active", product.is_active);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    reset();
  };

  const handleExport = () => {
    if (!products) return;
    exportToCSV(
      products,
      [
        { header: "Nome", accessor: (p) => p.name },
        { header: "SKU", accessor: (p) => p.sku || "" },
        { header: "Preço", accessor: (p) => p.price },
        { header: "Estoque", accessor: (p) => p.stock_quantity },
        {
          header: "Status",
          accessor: (p) => (p.is_active ? "Ativo" : "Inativo"),
        },
      ],
      "relatorio_produtos",
    );
  };

  const metrics = useMemo(() => {
    if (!products) return { totalValue: 0, lowStock: 0, totalItems: 0 };
    return {
      totalItems: products.length,
      totalValue: products.reduce(
        (acc, p) => acc + Number(p.price) * p.stock_quantity,
        0,
      ),
      lowStock: products.filter((p) => p.stock_quantity < 5).length,
    };
  }, [products]);

  const filteredProducts = products?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStock =
      stockStatusFilter === "all"
        ? true
        : stockStatusFilter === "low"
        ? p.stock_quantity > 0 && p.stock_quantity < 5
        : stockStatusFilter === "out"
        ? p.stock_quantity === 0
        : p.stock_quantity >= 5;

    return matchesSearch && matchesStock;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-aether-text">
              Inventário
            </h1>
            <p className="text-sm text-aether-text-muted">
              Gerencie seu catálogo de produtos e controle de estoque.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border border-aether-border bg-aether-surface px-4 py-2 text-sm font-medium text-aether-text-muted hover:bg-aether-bg shadow-sm transition-all"
            >
              <Download size={16} />
              Exportar
            </button>
            {(() => {
              const u = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || '{"role": "owner"}') : { role: "owner" };
              return u?.role !== "viewer" ? (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-aether-accent px-4 py-2 text-sm font-medium text-white hover:bg-aether-accent-hover shadow-md shadow-blue-600/20 transition-all"
                >
                  <Plus size={16} />
                  Novo Produto
                </button>
              ) : null;
            })()}
          </div>
        </div>

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-aether-border bg-aether-surface p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-aether-text-muted">
                    Valor em Estoque
                  </p>
                  <p className="mt-1 text-2xl font-bold text-aether-text">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(metrics.totalValue)}
                  </p>
                </div>
                <div className="rounded-lg bg-aether-accent-muted p-3 text-aether-accent">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-aether-border bg-aether-surface p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-aether-text-muted">
                    Total de Produtos
                  </p>
                  <p className="mt-1 text-2xl font-bold text-aether-text">
                    {metrics.totalItems}
                  </p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                  <Box size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-aether-border bg-aether-surface p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-aether-text-muted">
                    Estoque Crítico
                  </p>
                  <p className="mt-1 text-2xl font-bold text-aether-text">
                    {metrics.lowStock}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-3 ${metrics.lowStock > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
                >
                  <AlertTriangle size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-aether-surface p-4 rounded-xl border border-aether-border shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-aether-text-muted/70"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              className="w-full rounded-lg border border-aether-border bg-aether-bg py-2 pl-10 pr-4 text-xs text-aether-text focus:border-aether-accent focus:bg-aether-surface transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-medium hidden sm:inline">Nível de Estoque:</span>
            {[
              { id: "all", label: "Todos" },
              { id: "low", label: "Crítico (< 5)" },
              { id: "out", label: "Esgotados" },
              { id: "ok", label: "Estoque OK" },
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setStockStatusFilter(status.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  stockStatusFilter === status.id
                    ? status.id === "low" || status.id === "out"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-[var(--accent)] text-white shadow-sm"
                    : "bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-aether-border bg-aether-surface shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-aether-accent" size={32} />
            </div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
              <AlertCircle size={32} />
              <p>Não foi possível carregar os dados.</p>
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center text-aether-text-muted/70 gap-4">
              <div className="h-16 w-16 bg-aether-bg rounded-full flex items-center justify-center">
                <Package size={32} className="opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-aether-text">
                  Nenhum produto encontrado
                </p>
                <p className="text-sm">
                  Tente ajustar sua busca ou adicione um novo item.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-aether-bg border-b border-aether-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Produto
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      SKU
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Preço
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Estoque
                    </th>
                    <th className="px-6 py-4 font-semibold text-aether-text-muted">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-aether-text-muted">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredProducts?.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-[var(--bg-surface-hover)] transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] font-bold shrink-0 shadow-sm border border-[var(--accent)]/20">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-aether-text">
                              {product.name}
                            </p>
                            <p className="text-xs text-aether-text-muted truncate max-w-[200px]">
                              {product.description || "Sem descrição"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-aether-text-muted bg-aether-bg border border-aether-border px-2.5 py-1 rounded-md">
                          {product.sku || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-aether-text font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(product.price))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              product.stock_quantity < 5
                                ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            }`}
                          />
                          <span
                            className={
                              product.stock_quantity < 5
                                ? "text-rose-500 font-semibold"
                                : "text-aether-text-muted font-medium"
                            }
                          >
                            {product.stock_quantity} un
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${
                            product.is_active
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                              : "bg-aether-bg text-aether-text-muted border-aether-border"
                          }`}
                        >
                          <Power size={12} />
                          {product.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(product)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-aether-accent hover:bg-aether-accent-muted rounded-lg transition-colors border border-transparent hover:border-[var(--accent)]/30"
                        >
                          <Edit2 size={16} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aether-surface/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-aether-surface p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-aether-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-aether-text">
                {editingId ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={closeModal}
                className="text-aether-text-muted/70 hover:text-aether-text-muted transition-colors bg-aether-bg hover:bg-aether-bg p-2 rounded-full"
              >
                <span className="sr-only">Fechar</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-aether-text-muted mb-1">
                    Nome do Produto
                  </label>
                  <input
                    {...register("name")}
                    className="block w-full rounded-lg border border-aether-border bg-aether-bg px-4 py-2.5 text-sm text-aether-text focus:border-aether-accent focus:bg-aether-surface focus:ring-4 focus:ring-aether-accent-muted transition-all placeholder:text-aether-text-muted/70 outline-none"
                    placeholder="Ex: Cadeira Ergonômica"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-aether-text-muted mb-1">
                      Preço (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-aether-text-muted/70 text-sm">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        {...register("price")}
                        className="block w-full rounded-lg border border-aether-border bg-aether-bg pl-9 pr-4 py-2.5 text-sm text-aether-text focus:border-aether-accent focus:bg-aether-surface focus:ring-4 focus:ring-aether-accent-muted transition-all outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-aether-text-muted mb-1">
                      Estoque Atual
                    </label>
                    <input
                      type="number"
                      {...register("stock_quantity")}
                      className="block w-full rounded-lg border border-aether-border bg-aether-bg px-4 py-2.5 text-sm text-aether-text focus:border-aether-accent focus:bg-aether-surface focus:ring-4 focus:ring-aether-accent-muted transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-aether-text-muted mb-1">
                    SKU / Código
                  </label>
                  <input
                    {...register("sku")}
                    className="block w-full rounded-lg border border-aether-border bg-aether-bg px-4 py-2.5 text-sm text-aether-text focus:border-aether-accent focus:bg-aether-surface focus:ring-4 focus:ring-aether-accent-muted transition-all font-mono uppercase outline-none"
                    placeholder="PROD-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-aether-text-muted mb-1">
                    Descrição
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="block w-full rounded-lg border border-aether-border bg-aether-bg px-4 py-2.5 text-sm text-aether-text focus:border-aether-accent focus:bg-aether-surface focus:ring-4 focus:ring-aether-accent-muted transition-all resize-none outline-none"
                    placeholder="Detalhes opcionais sobre o produto..."
                  />
                </div>

                {editingId && (
                  <div className="flex items-center gap-3 p-4 bg-aether-bg rounded-xl border border-aether-border">
                    <div className="flex h-6 items-center">
                      <input
                        type="checkbox"
                        {...register("is_active")}
                        className="h-4 w-4 rounded border-aether-border-light text-aether-accent focus:ring-aether-accent transition-all"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-aether-text">
                        Produto Ativo
                      </label>
                      <span className="text-xs text-aether-text-muted">
                        {isActiveWatch
                          ? "Este produto está disponível para venda."
                          : "Este produto está arquivado/inativo."}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-aether-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-aether-border bg-aether-surface px-4 py-2.5 text-sm font-semibold text-aether-text-muted hover:bg-aether-bg hover:text-aether-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 rounded-xl bg-aether-surface px-4 py-2.5 text-sm font-semibold text-white hover:bg-aether-bg disabled:opacity-70 shadow-lg shadow-slate-900/10 transition-all"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> Salvando...
                    </span>
                  ) : (
                    "Salvar Produto"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
