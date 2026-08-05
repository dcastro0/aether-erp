import React from "react";
/* label placeholder aria-label */
import { Printer, Download, CheckCircle2, Cloud, FileText, X } from "lucide-react";

export interface ReceiptData {
  title: string;
  id: string;
  date: string;
  customerName?: string;
  supplierName?: string;
  paymentMethod: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
  notes?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ReceiptData | null;
}

export function ReceiptModal({ isOpen, onClose, data }: ReceiptModalProps) {
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-aether-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-aether-surface border border-aether-border rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Action Bar (Hidden during print) */}
        <div className="print:hidden bg-aether-bg border-b border-aether-border px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
            <span>Comprovante Emitido com Sucesso</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-aether-text-muted hover:text-aether-text rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div id="printable-receipt" className="p-6 bg-white text-slate-900 font-mono text-xs space-y-4">
          {/* Header Cupom */}
          <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
            <div className="flex items-center justify-center gap-2 font-sans font-black text-lg text-slate-950">
              <Cloud className="w-5 h-5 text-sky-600" />
              <span>AETHER ERP</span>
            </div>
            <p className="text-[10px] text-slate-600 font-sans uppercase font-bold tracking-widest">
              Tactical Suite • Comprovante Fiscal / Não Fiscal
            </p>
            <p className="text-[11px] text-slate-500">CNPJ: 00.123.456/0001-89 • IE: 123.456.789</p>
            <p className="text-[11px] text-slate-500">Rua da Tecnologia, 1000 - São Paulo/SP</p>
          </div>

          {/* Dados do Pedido */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Documento:</span>
              <span className="font-bold">{data.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Data / Hora:</span>
              <span>{data.date}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold">{data.customerName}</span>
              </div>
            )}
            {data.supplierName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Fornecedor:</span>
                <span className="font-bold">{data.supplierName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Pagamento:</span>
              <span className="uppercase font-bold text-sky-700">{data.paymentMethod}</span>
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="space-y-2 border-b border-dashed border-slate-300 pb-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Item / Qtd x Unit</span>
              <span>Total</span>
            </div>
            {data.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="font-bold text-slate-900">{item.name}</div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>
                    {item.quantity} x R$ {item.unitPrice.toFixed(2)}
                  </span>
                  <span className="font-bold text-slate-900">
                    R$ {(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-900">
              <span>VALOR TOTAL:</span>
              <span className="text-base">
                R$ {data.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Footer Cupom */}
          <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
            <p className="font-bold">Obrigado pela preferência!</p>
            <p>Sistema Aether ERP — Autenticação Eletrônica #9482-A8F</p>
          </div>
        </div>
      </div>
    </div>
  );
}
