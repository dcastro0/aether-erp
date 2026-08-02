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
  Banknote,
  QrCode,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
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
  const user = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || '{"role": "owner"}')
    : { role: "owner" };
  const role = user?.role || "owner";

  if (role === "viewer") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert size={48} />
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Acesso Restrito ao PDV</h2>
          <p className="text-sm text-[#94A3B8] max-w-md leading-relaxed">
            Visualizadores possuem acesso de leitura a relatórios e pedidos. Apenas Administradores e Operadores de Venda podem realizar novas vendas no Ponto de Venda.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [cart, setCart] = useState<CartItem[]>([]);
  const queryClient = useQueryClient();

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get<Product[]>("/protected/products"),
  });

  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.get<Customer[]>("/protected/customers"),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: CreateOrderDTO) => api.post("/protected/orders", data),
    onSuccess: () => {
      setCart([]);
      setSelectedCustomerId("");
      setPaymentMethod("dinheiro");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      alert("Venda realizada com sucesso!");
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
      payment_method: paymentMethod,
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
      p.is_active &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const paymentMethodsList = [
    { id: "dinheiro", label: "Dinheiro", icon: Banknote },
    { id: "pix", label: "PIX", icon: QrCode },
    { id: "credito", label: "Crédito", icon: CreditCard },
    { id: "debito", label: "Débito", icon: Wallet },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 lg:flex-row overflow-hidden">
        <div className="flex flex-1 flex-col gap-6 overflow-hidden">
          <div className="flex flex-col gap-4 rounded-2xl bg-aether-surface p-5 shadow-sm border border-aether-border shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-aether-text tracking-tight">
                  Ponto de Venda
                </h1>
                <p className="text-sm text-aether-text-muted">
                  Busque e selecione produtos para adicionar ao pedido.
                </p>
              </div>
              <div className="hidden sm:flex items-center justify-center h-12 w-12 rounded-xl bg-aether-accent-muted text-aether-accent">
                <ScanBarcode size={24} />
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-aether-text-muted/70 group-focus-within:text-aether-accent transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-aether-border bg-aether-bg text-sm text-aether-text focus:bg-aether-surface focus:border-aether-accent focus:ring-4 focus:ring-aether-accent-muted transition-all outline-none placeholder:text-aether-text-muted/70"
                placeholder="Buscar por nome ou código SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {loadingProducts ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-aether-accent" />
              </div>
            ) : filteredProducts?.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-aether-text-muted/70 gap-4">
                <div className="h-16 w-16 bg-aether-bg rounded-full flex items-center justify-center">
                  <Package size={32} className="opacity-50" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-aether-text">
                    Nenhum produto encontrado
                  </p>
                  <p className="text-sm">Tente buscar com outros termos.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 pb-6">
                {filteredProducts?.map((product) => {
                  const inStock = product.stock_quantity > 0;
                  const cartItem = cart.find((item) => item.id === product.id);
                  const isMaxReached =
                    cartItem?.cartQuantity === product.stock_quantity;

                  return (
                    <button
                      key={product.id}
                      onClick={() =>
                        inStock && !isMaxReached && addToCart(product)
                      }
                      disabled={!inStock || isMaxReached}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 ${
                        inStock && !isMaxReached
                          ? "bg-aether-surface border-aether-border hover:border-aether-accent hover:shadow-md hover:-translate-y-0.5"
                          : "bg-aether-bg border-aether-border opacity-75 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-aether-text line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-aether-bg text-[10px] font-mono font-medium text-aether-text-muted border border-aether-border">
                            {product.sku || "SEM SKU"}
                          </span>
                        </div>
                        {cartItem && (
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-aether-accent text-white text-xs font-bold shadow-sm">
                            {cartItem.cartQuantity}
                          </span>
                        )}
                      </div>
                      <div className="mt-6 flex justify-between items-end">
                        <p className="text-xl font-black text-aether-text">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(product.price))}
                        </p>
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-xs font-semibold flex items-center gap-1 ${
                              inStock ? "text-emerald-500" : "text-aether-error"
                            }`}
                          >
                            {inStock ? (
                              <>
                                <CheckCircle2 size={12} />{" "}
                                {product.stock_quantity} un
                              </>
                            ) : (
                              <>
                                <AlertCircle size={12} /> Esgotado
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full lg:w-[420px] shrink-0 flex-col rounded-2xl border border-aether-border bg-aether-surface shadow-xl overflow-hidden h-full">
          <div className="bg-aether-bg p-5 text-aether-text border-b border-aether-border">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <ShoppingCart size={20} className="text-aether-accent" />
              Resumo do Pedido
            </h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-aether-text-muted/70" />
              </div>
              <select
                className="w-full bg-aether-surface border border-aether-border text-aether-text py-2.5 pl-9 pr-4 rounded-xl text-sm focus:ring-2 focus:ring-aether-accent outline-none appearance-none cursor-pointer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="" disabled>
                  Selecione um cliente...
                </option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-aether-bg/50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-aether-text-muted/70 gap-3">
                <ShoppingCart size={48} className="opacity-20" />
                <p className="text-sm font-medium">O carrinho está vazio</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-4 rounded-xl border border-aether-border bg-aether-surface shadow-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-bold text-aether-text leading-tight">
                        {item.name}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-aether-text-muted hover:text-aether-error transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-aether-accent">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(item.price) * item.cartQuantity)}
                      </p>
                      <div className="flex items-center gap-3 bg-aether-bg border border-aether-border rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 rounded-md text-aether-text-muted hover:bg-aether-surface hover:text-aether-text hover:shadow-sm transition-all"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center text-aether-text">
                          {item.cartQuantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.cartQuantity >= item.stock_quantity}
                          className="p-1 rounded-md text-aether-text-muted hover:bg-aether-surface hover:text-aether-text hover:shadow-sm transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-aether-surface p-5 border-t border-aether-border shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold text-aether-text-muted uppercase tracking-wider">
                Método de Pagamento
              </p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethodsList.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      paymentMethod === m.id
                        ? "border-aether-accent bg-aether-accent-muted text-aether-accent ring-1 ring-aether-accent"
                        : "border-aether-border bg-aether-surface text-aether-text-muted hover:bg-aether-bg"
                    }`}
                  >
                    <m.icon size={16} /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-aether-text-muted font-medium">Total a pagar</span>
              <span className="text-3xl font-black text-aether-text">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(cartTotal)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={
                createOrderMutation.isPending ||
                cart.length === 0 ||
                !selectedCustomerId
              }
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-aether-accent py-4 text-white font-bold text-lg hover:bg-aether-accent-hover disabled:bg-aether-bg disabled:text-aether-text-muted transition-all shadow-md shadow-aether-accent/20 disabled:shadow-none"
            >
              {createOrderMutation.isPending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Finalizar Venda"
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
