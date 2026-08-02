import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { api, type NotificationSummary } from "../lib/api";
import { Bell, AlertTriangle, Package, DollarSign, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export function NotificationsPopover() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<NotificationSummary>({ total_unread: 0, items: [] });
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get<NotificationSummary>("/protected/notifications");
      setSummary(data);
    } catch {
      // Quiet fail if server unreachable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling every 1 min
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all focus:outline-none"
        title="Central de Alertas"
      >
        <Bell className="w-5 h-5" />
        {summary.total_unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {summary.total_unread > 99 ? "99+" : summary.total_unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Popover Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-100 text-sm">Alertas & Notificações</span>
              {summary.total_unread > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {summary.total_unread} pendente{summary.total_unread > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Atualizar Notificações"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 text-xs">
            {summary.items.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
                <p className="font-medium text-slate-300">Tudo sob controle!</p>
                <p className="text-[11px] text-slate-500">Nenhum estoque crítico ou conta pendente de vencimento.</p>
              </div>
            ) : (
              summary.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsOpen(false);
                    if (item.link) navigate(item.link);
                  }}
                  className="p-3.5 hover:bg-slate-800/50 cursor-pointer transition-colors flex items-start gap-3"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {item.type === "stock" ? (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Package className="w-4 h-4" />
                      </div>
                    ) : item.type === "financial" ? (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-slate-200 text-xs leading-tight">{item.title}</p>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
