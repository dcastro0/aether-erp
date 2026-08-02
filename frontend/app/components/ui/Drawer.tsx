import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md h-full bg-[#0F172A] border-l border-[#1E293B] shadow-2xl flex flex-col transform transition-transform duration-200 ease-out translate-x-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B]">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-[#F8FAFC]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors focus:outline-none"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
};
