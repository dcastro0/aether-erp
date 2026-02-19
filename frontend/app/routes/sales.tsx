import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  User,
  Package,
  Loader2,
  ScanBarcode,
  LayoutGrid,
  Tag,
  Receipt,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import {
  api,
  type Product,
  type Customer,
  type CreateOrderDTO,
} from "../lib/api";

interface CartItem extends Product {
  cartQuantity: number;
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const queryClient = useQueryClient();

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/protected/products"),
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.get<Customer[]>("/protected/customers"),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderDTO) => api.post("/protected/orders", data),
    onSuccess: () => {
      alert("Venda realizada com sucesso!");
      setCart([]);
      setSelectedCustomerId("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      alert(
        `Erro ao finalizar venda: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      );
    },
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock_quantity) return prev;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === productId) {
          const newQty = item.cartQuantity + delta;
          if (newQty < 1) return item;
          if (newQty > item.stock_quantity) return item;
          return { ...item, cartQuantity: newQty };
        }
        return item;
      });
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (acc, item) => acc + Number(item.price) * item.cartQuantity,
      0,
    );
  }, [cart]);

  const handleCheckout = () => {
    if (!selectedCustomerId) return alert("Selecione um cliente");
    if (cart.length === 0) return alert("Carrinho vazio");

    const payload: CreateOrderDTO = {
      customer_id: selectedCustomerId,
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.cartQuantity,
        unit_price: Number(item.price),
      })),
    };

    createOrderMutation.mutate(payload);
  };

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-6 lg:flex-row overflow-hidden">
        {/* LADO ESQUERDO: Catálogo e Busca */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Header do Catálogo */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Ponto de Venda
                </h1>
                <p className="text-sm text-slate-500">
                  Selecione os produtos para adicionar ao pedido.
                </p>
              </div>
              <div className="hidden sm:flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center gap-1">
                  <LayoutGrid size={14} /> Todos
                </span>
                <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-full border border-slate-100 flex items-center gap-1 hover:bg-slate-100 cursor-pointer">
                  <Tag size={14} /> Promoções
                </span>
              </div>
            </div>

            {/* Barra de Busca Pro */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-3 border-none rounded-xl bg-slate-100 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-inner"
                placeholder="Buscar produto por nome, código ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ScanBarcode className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Grid de Produtos */}
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            {loadingProducts ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
              </div>
            ) : filteredProducts?.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400 gap-4">
                <div className="bg-slate-100 p-6 rounded-full">
                  <Package size={48} className="opacity-40" />
                </div>
                <p className="text-lg font-medium">Nenhum produto encontrado</p>
                <p className="text-sm">Tente buscar por outro termo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts?.map((product) => {
                  const inStock = product.stock_quantity > 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => inStock && addToCart(product)}
                      disabled={!inStock}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200
                        ${
                          inStock
                            ? "border-slate-200 bg-white hover:border-blue-400 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1"
                            : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                        }`}
                    >
                      <div className="w-full">
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm
                                ${inStock ? "bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600" : "bg-slate-200 text-slate-400"}`}
                          >
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                          {inStock ? (
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-green-100">
                              Disp.
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-100">
                              Esgotado
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-800 leading-tight mb-1">
                          {product.name}
                        </h3>
                        <p className="text-xs font-mono text-slate-400 mb-4">
                          {product.sku || "SEM SKU"}
                        </p>
                      </div>

                      <div className="flex items-end justify-between border-t border-slate-50 pt-3 mt-auto">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            Preço Unit.
                          </p>
                          <p className="text-lg font-bold text-slate-900">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(product.price))}
                          </p>
                        </div>
                        <div
                          className={`text-xs font-medium ${product.stock_quantity < 5 ? "text-amber-600" : "text-slate-500"}`}
                        >
                          {product.stock_quantity} un
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LADO DIREITO: Carrinho / Ticket */}
        <div className="flex w-full lg:w-[400px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden h-full">
          {/* Header do Carrinho */}
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="text-slate-400" size={20} />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Resumo do Pedido
              </h2>
              <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                #{Math.floor(Math.random() * 10000)}
              </span>
            </div>

            {/* Seletor de Cliente Estilizado */}
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-shadow shadow-sm"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Selecionar Cliente...</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <User
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />
              <div className="absolute right-3 top-3.5 pointer-events-none">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Lista de Itens (Scrollável) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-xl m-2">
                <ShoppingCart size={48} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Carrinho vazio</p>
                <p className="text-xs">Adicione itens ao lado</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                >
                  {/* Qty Controls */}
                  <div className="flex flex-col items-center justify-between bg-white rounded-lg border border-slate-200 px-1 py-1 h-full shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.cartQuantity >= item.stock_quantity}
                      className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                    >
                      <Plus size={12} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      {item.cartQuantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 text-slate-400 hover:text-blue-600"
                    >
                      <Minus size={12} />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-slate-500">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(item.price))}
                      </p>
                      <span className="text-[10px] text-slate-300">•</span>
                      <p className="text-xs font-bold text-slate-700">
                        Total:{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(item.price) * item.cartQuantity)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="self-center p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer / Total */}
          <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-4 shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(cartTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>Descontos</span>
                <span>R$ 0,00</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-slate-200">
                <span className="text-base font-bold text-slate-800">
                  Total a Pagar
                </span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(cartTotal)}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={
                createOrderMutation.isPending ||
                cart.length === 0 ||
                !selectedCustomerId
              }
              className="w-full relative overflow-hidden rounded-xl bg-slate-900 py-4 text-white font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {createOrderMutation.isPending ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>Finalizar Pedido</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
