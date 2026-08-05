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
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  Printer
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { PixModal } from "../components/PixModal";
import { CashRegisterModal, type CashMovement } from "../components/CashRegisterModal";
import { ReceiptModal, type ReceiptData } from "../components/ReceiptModal";
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

  // POS State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Cash Register State
  const [isCashOpen, setIsCashOpen] = useState(true);
  const [cashBalance, setCashBalance] = useState(250.0);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([
    { id: "MVT-01", type: "opening", amount: 250.0, description: "Abertura de Turno", timestamp: "08:30" }
  ]);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashModalMode, setCashModalMode] = useState<"open" | "sangria" | "suprimento" | "close">("open");

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

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
    onSuccess: (res: any) => {
      // Build receipt data
      const customerObj = customers?.find((c) => c.id === selectedCustomerId);
      const newReceipt: ReceiptData = {
        title: "Comprovante de Venda - PDV",
        id: `PED-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleString("pt-BR"),
        customerName: customerObj?.name || "Cliente Não Identificado",
        paymentMethod: paymentMethod.toUpperCase(),
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.cartQuantity,
          unitPrice: Number(item.price)
        })),
        total: cartTotal
      };

      if (paymentMethod === "dinheiro") {
        setCashBalance((prev) => prev + cartTotal);
      }

      setReceiptData(newReceipt);
      setIsReceiptOpen(true);

      setCart([]);
      setSelectedCustomerId("");
      setPaymentMethod("dinheiro");
      setIsPixModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err) => {
      alert(
        `Erro ao finalizar venda: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
      );
    },
  });

  const addToCart = (product: Product) => {
    if (!isCashOpen) {
      alert("O Caixa do PDV está Fechado. Clique em 'Abrir Turno de Caixa' antes de realizar vendas.");
      return;
    }
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

  const executeOrderCreation = () => {
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

  const handleCheckout = () => {
    if (!isCashOpen) {
      alert("O Caixa está Fechado. Realize a abertura de turno primeiro.");
      return;
    }
    if (!selectedCustomerId) return alert("Selecione um cliente");
    if (cart.length === 0) return alert("Carrinho vazio");

    if (paymentMethod === "pix") {
      setIsPixModalOpen(true);
      return;
    }

    executeOrderCreation();
  };

  // Cash Register Action Handlers
  const handleConfirmOpenCash = (initialBalance: number) => {
    setCashBalance(initialBalance);
    setIsCashOpen(true);
    setCashMovements([
      { id: `MVT-${Date.now()}`, type: "opening", amount: initialBalance, description: "Abertura de Caixa", timestamp: new Date().toLocaleTimeString() }
    ]);
    setIsCashModalOpen(false);
  };

  const handleConfirmMovement = (type: "sangria" | "suprimento", amount: number, description: string) => {
    if (type === "sangria") {
      setCashBalance((prev) => Math.max(0, prev - amount));
    } else {
      setCashBalance((prev) => prev + amount);
    }
    setCashMovements((prev) => [
      ...prev,
      { id: `MVT-${Date.now()}`, type, amount, description, timestamp: new Date().toLocaleTimeString() }
    ]);
    setIsCashModalOpen(false);
  };

  const handleConfirmCloseCash = (actualCash: number) => {
    setIsCashOpen(false);
    setIsCashModalOpen(false);
    alert(`Caixa Fechado com Sucesso! Valor Contado: R$ ${actualCash.toFixed(2)}.`);
  };

  const openCashModal = (mode: "open" | "sangria" | "suprimento" | "close") => {
    setCashModalMode(mode);
    setIsCashModalOpen(true);
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
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 overflow-hidden">
        {/* Top Cash Register Controls Bar */}
        <div className="bg-aether-surface border border-aether-border rounded-2xl p-3 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border flex items-center justify-center ${
              isCashOpen ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"
            }`}>
              {isCashOpen ? <Unlock size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-aether-text uppercase tracking-wider">Status do Caixa PDV:</span>
                {isCashOpen ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    TURNO ABERTO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                    CAIXA FECHADO
                  </span>
                )}
              </div>
              <p className="text-xs text-aether-text-muted mt-0.5">
                Saldo no Gaveteiro: <strong className="text-aether-text font-mono">R$ {cashBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCashOpen ? (
              <button
                onClick={() => openCashModal("open")}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Unlock size={14} />
                Abrir Turno de Caixa
              </button>
            ) : (
              <>
                <button
                  onClick={() => openCashModal("suprimento")}
                  className="px-3 py-1.5 bg-aether-bg hover:bg-aether-surface border border-aether-border text-sky-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight size={14} />
                  Suprimento
                </button>
                <button
                  onClick={() => openCashModal("sangria")}
                  className="px-3 py-1.5 bg-aether-bg hover:bg-aether-surface border border-aether-border text-amber-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ArrowDownRight size={14} />
                  Sangria
                </button>
                <button
                  onClick={() => openCashModal("close")}
                  className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Lock size={14} />
                  Fechar Turno
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main POS Interface */}
        <div className="flex flex-col flex-1 gap-6 lg:flex-row overflow-hidden">
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <div className="flex flex-col gap-3 rounded-2xl bg-aether-surface p-4 shadow-sm border border-aether-border shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-aether-text tracking-tight">
                    Ponto de Venda (PDV)
                  </h1>
                  <p className="text-xs text-aether-text-muted">
                    Busque e selecione produtos para adicionar ao pedido.
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-xl bg-aether-accent-muted text-aether-accent">
                  <ScanBarcode size={20} />
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-aether-text-muted/70 group-focus-within:text-aether-accent transition-colors" />
                </div>
                <input
                  type="text"
                  aria-label="Buscar produtos no PDV"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-aether-border bg-aether-bg text-xs text-aether-text focus:bg-aether-surface focus:border-aether-accent focus:ring-2 focus:ring-aether-accent-muted transition-all outline-none placeholder:text-aether-text-muted/70"
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
                        disabled={!inStock || isMaxReached || !isCashOpen}
                        className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                          inStock && !isMaxReached && isCashOpen
                            ? "bg-aether-surface border-aether-border hover:border-aether-accent hover:shadow-md hover:-translate-y-0.5"
                            : "bg-aether-bg border-aether-border opacity-75 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="font-bold text-aether-text line-clamp-2 leading-tight text-xs">
                              {product.name}
                            </h3>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-aether-bg text-[10px] font-mono font-medium text-aether-text-muted border border-aether-border">
                              {product.sku || "SEM SKU"}
                            </span>
                          </div>
                          {cartItem && (
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-aether-accent text-white text-[11px] font-bold shadow-sm">
                              {cartItem.cartQuantity}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex justify-between items-end">
                          <p className="text-lg font-black text-aether-text">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(product.price))}
                          </p>
                          <div className="flex flex-col items-end">
                            <span
                              className={`text-[11px] font-semibold flex items-center gap-1 ${
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

          {/* Right Checkout Panel */}
          <div className="flex w-full lg:w-[400px] shrink-0 flex-col rounded-2xl border border-aether-border bg-aether-surface shadow-xl overflow-hidden h-full">
            <div className="bg-aether-bg p-4 text-aether-text border-b border-aether-border">
              <h2 className="text-base font-bold flex items-center gap-2 mb-3">
                <ShoppingCart size={18} className="text-aether-accent" />
                Resumo do Pedido
              </h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-aether-text-muted/70" />
                </div>
                <select
                  aria-label="Selecione um cliente para o pedido"
                  className="w-full bg-aether-surface border border-aether-border text-aether-text py-2 pl-9 pr-4 rounded-xl text-xs focus:ring-2 focus:ring-aether-accent outline-none appearance-none cursor-pointer"
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
                <div className="h-full flex flex-col items-center justify-center text-aether-text-muted/70 gap-2">
                  <ShoppingCart size={40} className="opacity-20" />
                  <p className="text-xs font-medium">O carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 p-3 rounded-xl border border-aether-border bg-aether-surface shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-xs font-bold text-aether-text leading-tight">
                          {item.name}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-aether-text-muted hover:text-aether-error transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-aether-accent">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(item.price) * item.cartQuantity)}
                        </p>
                        <div className="flex items-center gap-2 bg-aether-bg border border-aether-border rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded-md text-aether-text-muted hover:bg-aether-surface hover:text-aether-text transition-all cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-5 text-center text-aether-text">
                            {item.cartQuantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.cartQuantity >= item.stock_quantity}
                            className="p-1 rounded-md text-aether-text-muted hover:bg-aether-surface hover:text-aether-text transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-aether-surface p-4 border-t border-aether-border shadow-sm">
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-bold text-aether-text-muted uppercase tracking-wider">
                  Forma de Pagamento
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {paymentMethodsList.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? "border-aether-accent bg-aether-accent-muted text-aether-accent ring-1 ring-aether-accent font-semibold"
                          : "border-aether-border bg-aether-surface text-aether-text-muted hover:bg-aether-bg"
                      }`}
                    >
                      <m.icon size={14} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-aether-text-muted font-medium">Total a pagar:</span>
                <span className="text-2xl font-black text-aether-text">
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
                  !selectedCustomerId ||
                  !isCashOpen
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-aether-accent py-3 text-white font-bold text-sm hover:bg-aether-accent-hover disabled:bg-aether-bg disabled:text-aether-text-muted transition-all shadow-md cursor-pointer"
              >
                {createOrderMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Finalizar Venda & Emitir Recibo"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PixModal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        onConfirm={executeOrderCreation}
        amount={cartTotal}
        customerName={customers?.find((c) => c.id === selectedCustomerId)?.name}
        isPending={createOrderMutation.isPending}
      />

      <CashRegisterModal
        isOpen={isCashModalOpen}
        mode={cashModalMode}
        onClose={() => setIsCashModalOpen(false)}
        onConfirmOpen={handleConfirmOpenCash}
        onConfirmMovement={handleConfirmMovement}
        onConfirmClose={handleConfirmCloseCash}
        expectedBalance={cashBalance}
        movements={cashMovements}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        data={receiptData}
      />
    </DashboardLayout>
  );
}
