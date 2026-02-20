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
  Banknote,
  QrCode,
  Wallet,
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
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
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
      setPaymentMethod("dinheiro");
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
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paymentMethodsList = [
    { id: "dinheiro", label: "Dinheiro", icon: Banknote },
    { id: "pix", label: "PIX", icon: QrCode },
    { id: "credito", label: "Crédito", icon: CreditCard },
    { id: "debito", label: "Débito", icon: Wallet },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-6 lg:flex-row overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
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
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-3 rounded-xl bg-slate-100 focus:bg-white transition-all"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts?.map((product) => {
                const inStock = product.stock_quantity > 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => inStock && addToCart(product)}
                    disabled={!inStock}
                    className={`group flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${inStock ? "bg-white border-slate-200 hover:border-blue-400" : "bg-slate-50 opacity-60 cursor-not-allowed"}`}
                  >
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {product.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">
                        {product.sku || "SEM SKU"}
                      </p>
                    </div>
                    <div className="mt-4 flex justify-between items-end">
                      <p className="text-lg font-bold">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(product.price))}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.stock_quantity} un
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex w-full lg:w-[400px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden h-full">
          <div className="bg-slate-50 p-4 border-b">
            <select
              className="w-full bg-white border border-slate-300 py-3 px-4 rounded-xl text-sm"
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
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-xl border bg-slate-50/50"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.cartQuantity}x{" "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(item.price))}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-5 border-t space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase">
                Pagamento
              </p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethodsList.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm ${paymentMethod === m.id ? "border-blue-500 bg-blue-50 text-blue-700" : "bg-white text-slate-600"}`}
                  >
                    <m.icon size={16} /> {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-end border-t pt-4">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-black">
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
              className="w-full rounded-xl bg-slate-900 py-4 text-white font-bold hover:bg-slate-800 disabled:opacity-70 transition-all"
            >
              Finalizar Pedido
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
