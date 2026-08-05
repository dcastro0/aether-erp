import React, { useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  DollarSign
} from "lucide-react";

export interface CashMovement {
  id: string;
  type: "opening" | "sangria" | "suprimento" | "sale";
  amount: number;
  description: string;
  timestamp: string;
}

interface CashRegisterModalProps {
  isOpen: boolean;
  mode: "open" | "sangria" | "suprimento" | "close";
  onClose: () => void;
  onConfirmOpen: (initialBalance: number) => void;
  onConfirmMovement: (type: "sangria" | "suprimento", amount: number, description: string) => void;
  onConfirmClose: (actualCash: number) => void;
  expectedBalance: number;
  movements: CashMovement[];
}

export function CashRegisterModal({
  isOpen,
  mode,
  onClose,
  onConfirmOpen,
  onConfirmMovement,
  onConfirmClose,
  expectedBalance,
  movements
}: CashRegisterModalProps) {
  const [amountInput, setAmountInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [actualCashInput, setActualCashInput] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput) || 0;

    if (mode === "open") {
      onConfirmOpen(val);
    } else if (mode === "sangria" || mode === "suprimento") {
      onConfirmMovement(mode, val, descriptionInput || (mode === "sangria" ? "Sangria de Caixa" : "Suprimento de Troco"));
    } else if (mode === "close") {
      const actual = parseFloat(actualCashInput) || 0;
      onConfirmClose(actual);
    }

    // Reset Form
    setAmountInput("");
    setDescriptionInput("");
    setActualCashInput("");
  };

  const getTitle = () => {
    switch (mode) {
      case "open":
        return "Abertura de Caixa (Novo Turno)";
      case "sangria":
        return "Sangria de Caixa (Retirada)";
      case "suprimento":
        return "Suprimento de Caixa (Aporte de Troco)";
      case "close":
        return "Fechamento de Turno & Conciliação";
    }
  };

  return (
    <div className="fixed inset-0 bg-aether-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-aether-surface border border-aether-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-aether-border pb-3">
          <h3 className="font-bold text-lg text-aether-text flex items-center gap-2">
            {mode === "open" ? (
              <Unlock className="w-5 h-5 text-emerald-500" />
            ) : mode === "close" ? (
              <Lock className="w-5 h-5 text-rose-500" />
            ) : mode === "sangria" ? (
              <ArrowDownRight className="w-5 h-5 text-amber-500" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-sky-500" />
            )}
            {getTitle()}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-aether-text-muted hover:text-aether-text cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "open" && (
            <div className="space-y-3">
              <p className="text-xs text-aether-text-muted">
                Informe o valor de fundo de troco inicial em cédulas e moedas para iniciar o turno de vendas no PDV.
              </p>
              <div>
                <label className="block text-xs font-medium text-aether-text-muted mb-1">
                  Saldo Inicial / Troco (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="200.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-aether-bg border border-aether-border rounded-xl px-3.5 py-2.5 text-sm text-aether-text font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {(mode === "sangria" || mode === "suprimento") && (
            <div className="space-y-3">
              <div className="bg-aether-bg border border-aether-border rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-aether-text-muted">Saldo Atual Estimado:</span>
                <span className="font-bold font-mono text-sky-400">
                  R$ {expectedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-aether-text-muted mb-1">
                  Valor do {mode === "sangria" ? "Retirada (Sangria)" : "Aporte (Suprimento)"} (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="100.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-aether-bg border border-aether-border rounded-xl px-3.5 py-2.5 text-sm text-aether-text font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-aether-text-muted mb-1">Motivo / Observação</label>
                <input
                  type="text"
                  placeholder={mode === "sangria" ? "Ex: Depósito bancário de segurança" : "Ex: Adicionado notas de R$ 5 para troco"}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="w-full bg-aether-bg border border-aether-border rounded-xl px-3 py-2 text-xs text-aether-text focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {mode === "close" && (
            <div className="space-y-4">
              <div className="bg-aether-bg border border-aether-border rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-aether-text-muted">
                  <span>Saldo de Abertura + Vendas Dinheiro:</span>
                  <span className="font-mono text-aether-text font-semibold">
                    R$ {expectedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-sky-400 border-t border-aether-border pt-2">
                  <span>Saldo Esperado no Gaveteiro:</span>
                  <span className="font-mono text-sm">
                    R$ {expectedBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-aether-text-muted mb-1">
                  Valor Total Contado Físico no Caixa (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  className="w-full bg-aether-bg border border-aether-border rounded-xl px-3.5 py-2.5 text-sm text-aether-text font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              {actualCashInput && (
                <div className="text-xs p-3 rounded-xl border flex items-center justify-between font-medium">
                  {parseFloat(actualCashInput) === expectedBalance ? (
                    <div className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 w-full p-2 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Caixa Conciliado Sem Quebras!</span>
                    </div>
                  ) : parseFloat(actualCashInput) > expectedBalance ? (
                    <div className="text-sky-400 bg-sky-500/10 border-sky-500/20 w-full p-2 rounded-lg flex items-center justify-between">
                      <span>Sobra de Caixa:</span>
                      <span className="font-mono font-bold">+ R$ {(parseFloat(actualCashInput) - expectedBalance).toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="text-rose-500 bg-rose-500/10 border-rose-500/20 w-full p-2 rounded-lg flex items-center justify-between">
                      <span>Diferença / Quebra de Caixa:</span>
                      <span className="font-mono font-bold">- R$ {(expectedBalance - parseFloat(actualCashInput)).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-aether-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-aether-bg hover:bg-aether-surface border border-aether-border text-aether-text-muted text-xs font-medium rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold rounded-xl text-white cursor-pointer ${
                mode === "open"
                  ? "bg-emerald-500 hover:bg-emerald-400"
                  : mode === "close"
                  ? "bg-rose-500 hover:bg-rose-400"
                  : "bg-sky-500 hover:bg-sky-400"
              }`}
            >
              {mode === "open"
                ? "Confirmar Abertura"
                : mode === "close"
                ? "Finalizar e Encerrar Caixa"
                : "Registrar Movimentação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
