import { useState, useEffect } from "react";
import { QrCode, Copy, Check, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { generatePixPayload } from "../lib/pix";

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  customerName?: string;
  isPending: boolean;
}

export function PixModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  customerName = "Cliente",
  isPending,
}: PixModalProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes timer

  const pixKey = "pix@aether-erp.com.br";
  const merchantName = "AETHER ERP BRASIL";
  const merchantCity = "SAO PAULO";

  const payload = generatePixPayload(pixKey, merchantName, merchantCity, amount);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`;

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(300);
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-base leading-tight">Pagamento Pix BR Code</h3>
              <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Aguardando transferência... ({timeFormatted})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          <div className="space-y-1">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Valor Total a Pagar</p>
            <p className="text-3xl font-black text-emerald-500">
              R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">Cliente: <strong className="text-[var(--text-primary)]">{customerName}</strong></p>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-xl inline-block shadow-inner border border-slate-200">
            <img src={qrCodeUrl} alt="QR Code Pix" className="w-48 h-48 mx-auto object-contain" />
          </div>

          {/* Pix Copia e Cola */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pix Copia e Cola</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={payload}
                className="w-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-xs font-mono text-[var(--text-secondary)] truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] text-emerald-500 border border-emerald-500/30"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmar Recebimento do Pix</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isPending}
              className="w-full py-2 bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancelar e Escolher Outro Método
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
