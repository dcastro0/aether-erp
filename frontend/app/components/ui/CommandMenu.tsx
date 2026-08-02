import React, { useEffect, useState } from "react";
import { Search, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router";

export interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const user = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || '{"role": "owner"}')
    : { role: "owner" };
  const role = user?.role || "owner";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: "Dashboard Overview", path: "/dashboard", type: "Painel", roles: ["owner", "admin", "editor", "viewer"] },
    { title: "Lançamentos Financeiros", path: "/dashboard/financial", type: "Financeiro", roles: ["owner", "admin", "editor", "viewer"] },
    { title: "Catálogo de Produtos", path: "/dashboard/products", type: "Estoque", roles: ["owner", "admin", "editor", "viewer"] },
    { title: "Lista de Clientes", path: "/dashboard/customers", type: "CRM", roles: ["owner", "admin", "editor", "viewer"] },
    { title: "Equipe & Controle de Acessos", path: "/dashboard/employees", type: "Gestão", roles: ["owner", "admin"] },
    { title: "Logs de Auditoria & Rastreabilidade", path: "/dashboard/audit-logs", type: "Segurança", roles: ["owner", "admin"] },
    { title: "Ponto de Venda (PDV)", path: "/dashboard/sales", type: "Vendas", roles: ["owner", "admin", "editor"] },
    { title: "Histórico de Pedidos", path: "/dashboard/orders", type: "Vendas", roles: ["owner", "admin", "editor", "viewer"] },
    { title: "Configurações do Sistema", path: "/dashboard/settings", type: "Sistema", roles: ["owner", "admin", "editor", "viewer"] },
  ];

  const allowedLinks = quickLinks.filter((item) => item.roles.includes(role));

  const filteredLinks = allowedLinks.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0F172A] border border-[#334155] rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-[#1E293B]">
          <Search className="w-5 h-5 text-[#64748B] shrink-0" />
          <input
            type="text"
            placeholder="Buscar telas, faturas, produtos... (Esc para fechar)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full h-12 px-3 bg-transparent border-none text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-[#64748B] hover:text-[#F8FAFC]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#64748B] uppercase">
            Navegação Rápida
          </div>
          {filteredLinks.length === 0 ? (
            <div className="p-4 text-center text-sm text-[#64748B]">Nenhum resultado encontrado.</div>
          ) : (
            filteredLinks.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item.path)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-[#F8FAFC] hover:bg-[#1E293B] hover:text-[#0EA5E9] transition-colors group text-left"
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#0EA5E9]" />
                  <span>{item.title}</span>
                </div>
                <span className="text-xs text-[#64748B] bg-[#1E293B] px-2 py-0.5 rounded">{item.type}</span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 bg-[#090D16] border-t border-[#1E293B] text-xs text-[#64748B]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#1E293B] rounded text-[10px]">↑</kbd>{" "}
              <kbd className="px-1.5 py-0.5 bg-[#1E293B] rounded text-[10px]">↓</kbd> Navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-[#1E293B] rounded text-[10px]">Enter</kbd> Selecionar
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 bg-[#1E293B] rounded text-[10px]">Esc</kbd> Fechar
          </span>
        </div>
      </div>
    </div>
  );
};
