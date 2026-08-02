import React, { useState } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface FinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FinancialModal({ isOpen, onClose }: FinancialModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: "income",
    amount: "",
    description: "",
    status: "pending",
    due_date: "",
    payment_method: "dinheiro",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("http://localhost:3000/api/protected/financial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
        }),
      });
      if (!res.ok) throw new Error("Erro ao criar transação");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial"] });
      onClose();
      setFormData({
        type: "income",
        amount: "",
        description: "",
        status: "pending",
        due_date: "",
        payment_method: "dinheiro",
      });
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nova Transação</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(formData);
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Ex: Pagamento de Fornecedor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vencimento
              </label>
              <input
                type="date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Meio de Pagamento
              </label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="debito">Cartão de Débito</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
            >
              {mutation.isPending ? "Salvando..." : "Salvar Transação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
