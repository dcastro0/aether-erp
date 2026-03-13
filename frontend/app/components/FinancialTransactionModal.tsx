import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DollarSign, Tag, FileText, CalendarDays } from "lucide-react";
import type { CreateFinancialTransactionDTO } from "../lib/api";

const MAX_AMOUNT = 99999999.99;

const transactionSchema = z.object({
  type: z.enum(["payable", "receivable"], {
    required_error: "Tipo é obrigatório",
  }),
  status: z.enum(["pending", "paid", "overdue", "canceled"], {
    required_error: "Status é obrigatório",
  }),
  amount: z
    .number({ invalid_type_error: "Valor inválido" })
    .min(0.01, "Valor deve ser maior que zero")
    .max(MAX_AMOUNT, "Valor muito alto"),
  description: z.string().min(3, "Descrição muito curta"),
  due_date: z.string().min(1, "Data de vencimento é obrigatória"),
});

type TransactionForm = z.infer<typeof transactionSchema>;

interface FinancialTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFinancialTransactionDTO) => void;
  isLoading?: boolean;
}

export function FinancialTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: FinancialTransactionModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "payable",
      status: "pending",
      amount: 0,
      description: "",
      due_date: new Date().toISOString().split("T")[0],
    },
  });

  const handleFormSubmit: SubmitHandler<TransactionForm> = (data) => {
    onSubmit({
      ...data,
      reference_type: "manual",
    });
  };

  const watchType = watch("type");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Nova Transação</h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${
                watchType === "payable"
                  ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                value="payable"
                {...register("type")}
                className="sr-only"
              />
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  watchType === "payable" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                }`}
              >
                <DollarSign size={16} />
              </div>
              <span
                className={`text-sm font-medium ${
                  watchType === "payable" ? "text-red-700" : "text-slate-600"
                }`}
              >
                A Pagar
              </span>
            </label>
            <label
              className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${
                watchType === "receivable"
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                value="receivable"
                {...register("type")}
                className="sr-only"
              />
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  watchType === "receivable" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                }`}
              >
                <DollarSign size={16} />
              </div>
              <span
                className={`text-sm font-medium ${
                  watchType === "receivable" ? "text-emerald-700" : "text-slate-600"
                }`}
              >
                A Receber
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrição
              </label>
              <div className="relative">
                <FileText
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  {...register("description")}
                  placeholder="Ex: Aluguel, Conta de Luz, Venda Manual..."
                  className="block w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                />
              </div>
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor (R$)
                </label>
                <div className="relative">
                  <DollarSign
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("amount", { valueAsNumber: true })}
                    className="block w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vencimento
                </label>
                <div className="relative">
                  <CalendarDays
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="date"
                    {...register("due_date")}
                    className="block w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                  />
                </div>
                {errors.due_date && (
                  <p className="text-xs text-red-500 mt-1">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status Inicial
              </label>
              <div className="relative">
                <Tag
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <select
                  {...register("status")}
                  className="block w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
              </div>
              {errors.status && (
                <p className="text-xs text-red-500 mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-70 ${
                watchType === "payable"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isLoading ? "Salvando..." : "Criar Transação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
