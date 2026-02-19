import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Package,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Filter,
  Download,
  TrendingUp,
  AlertTriangle,
  Box,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type Product, type CreateProductDTO } from "../lib/api";

const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  stock_quantity: z.coerce
    .number()
    .int()
    .min(0, "Estoque não pode ser negativo"),
  sku: z.string().optional(),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
      setIsModalOpen(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: 0,
      stock_quantity: 0,
      sku: "",
      description: "",
    },
  });

  const onSubmit: SubmitHandler<ProductForm> = (data) => {
    createMutation.mutate(data);
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

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Inventário
            </h1>
            <p className="text-sm text-slate-500">
              Gerencie seu catálogo de produtos e controle de estoque.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
              <Download size={16} />
              Exportar
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
            >
              <Plus size={16} />
              Novo Produto
            </button>
          </div>
        </div>

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Valor em Estoque
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(metrics.totalValue)}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total de Produtos
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {metrics.totalItems}
                  </p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                  <Box size={24} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Estoque Crítico
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {metrics.lowStock}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-3 ${metrics.lowStock > 0 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}
                >
                  <AlertTriangle size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <Filter size={16} />
            Filtros Avançados
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
              <AlertCircle size={32} />
              <p>Não foi possível carregar os dados.</p>
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center text-slate-400 gap-4">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                <Package size={32} className="opacity-50" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-slate-900">
                  Nenhum produto encontrado
                </p>
                <p className="text-sm">
                  Tente ajustar sua busca ou adicione um novo item.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Produto
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      SKU
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Preço
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Estoque
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts?.map((product) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-slate-50/80 transition-all duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate max-w-50">
                              {product.description || "Sem descrição"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {product.sku || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
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
                                ? "bg-red-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span
                            className={
                              product.stock_quantity < 5
                                ? "text-red-600 font-medium"
                                : "text-slate-600"
                            }
                          >
                            {product.stock_quantity} un
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            product.is_active
                              ? "bg-green-50 text-green-700 border-green-100"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {product.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <MoreHorizontal size={18} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Novo Produto</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Fechar</span>
                <svg
                  className="h-6 w-6"
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome do Produto
                  </label>
                  <input
                    {...register("name")}
                    className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all placeholder:text-slate-400"
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Preço (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        {...register("price")}
                        className="block w-full rounded-lg border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                        placeholder="0,00"
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Estoque Inicial
                    </label>
                    <input
                      type="number"
                      {...register("stock_quantity")}
                      className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    SKU / Código
                  </label>
                  <input
                    {...register("sku")}
                    className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all font-mono uppercase"
                    placeholder="PROD-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all resize-none"
                    placeholder="Detalhes opcionais sobre o produto..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70 shadow-lg shadow-slate-900/10 transition-all"
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> Salvando...
                    </span>
                  ) : (
                    "Criar Produto"
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
