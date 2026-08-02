import { useState, useEffect } from "react";
import { 
  Globe, 
  Moon, 
  Sun,
  Laptop,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Bell,
  BellOff,
  Monitor,
  Type,
  PanelLeftClose,
  Download,
  FileSpreadsheet,
  Fingerprint,
  Clock,
  MapPin,
  Info,
  Cloud,
  Database,
  Eraser,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api } from "../lib/api";

const i18n = {
  English: {
    title: "Settings & Account",
    subtitle: "Manage your profile, password security, and interface preferences.",
    accountProfile: "Account Profile",
    accountProfileDesc: "Update your full name and registered email.",
    securityPassword: "Security & Password",
    securityPasswordDesc: "Change your login password to keep your account safe.",
    preferences: "Preferences",
    interfaceTheme: "Interface Theme",
    interfaceThemeDesc: "Select or customize your UI theme.",
    themeLight: "Light",
    themeLightDesc: "Off-white, clean",
    themeDark: "Dark",
    themeDarkDesc: "Deep slate, vast",
    themeSystem: "System",
    themeSystemDesc: "Follows system",
    language: "Language",
    languageDesc: "Select your preferred language."
  },
  Português: {
    title: "Configurações e Conta",
    subtitle: "Gerencie seu perfil, segurança da senha e preferências da interface.",
    accountProfile: "Perfil da Conta",
    accountProfileDesc: "Atualize seu nome completo e e-mail cadastrado.",
    securityPassword: "Segurança & Senha",
    securityPasswordDesc: "Altere sua senha de acesso para manter sua conta protegida.",
    preferences: "Preferências",
    interfaceTheme: "Tema da Interface",
    interfaceThemeDesc: "Selecione ou personalize o tema da interface.",
    themeLight: "Claro",
    themeLightDesc: "Branco-suave, limpo",
    themeDark: "Escuro",
    themeDarkDesc: "Ardósia profunda, vasto",
    themeSystem: "Sistema",
    themeSystemDesc: "Segue o sistema",
    language: "Idioma",
    languageDesc: "Selecione o seu idioma preferido."
  }
};

export default function SettingsPage() {
  const [language, setLanguage] = useState<"English" | "Português">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("language") as "English" | "Português") || "Português";
    }
    return "Português";
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "Dark";
    }
    return "Dark";
  });
  
  const t = i18n[language];

  // User Profile state
  const currentUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || '{"full_name": "", "email": ""}')
    : { full_name: "", email: "" };

  const [fullName, setFullName] = useState(currentUser.full_name || "");
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Notification Preferences
  const [notifSales, setNotifSales] = useState(() => localStorage.getItem("notif_sales") !== "false");
  const [notifStock, setNotifStock] = useState(() => localStorage.getItem("notif_stock") !== "false");
  const [notifFinancial, setNotifFinancial] = useState(() => localStorage.getItem("notif_financial") !== "false");
  const [notifSecurity, setNotifSecurity] = useState(() => localStorage.getItem("notif_security") !== "false");
  const [notifSound, setNotifSound] = useState(() => localStorage.getItem("notif_sound") !== "false");

  // Display Preferences
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("font_size") || "normal");
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("compact_mode") === "true");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "true");
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem("animations") !== "false");

  // Data Preferences
  const [currency, setCurrency] = useState(() => localStorage.getItem("currency") || "BRL");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("date_format") || "DD/MM/YYYY");
  const [exportFormat, setExportFormat] = useState(() => localStorage.getItem("export_format") || "csv");
  const [itemsPerPage, setItemsPerPage] = useState(() => localStorage.getItem("items_per_page") || "25");

  useEffect(() => {
    localStorage.setItem("language", language);
    window.dispatchEvent(new Event('languageChange'));
  }, [language]);

  // Persist notification preferences
  useEffect(() => {
    localStorage.setItem("notif_sales", String(notifSales));
    localStorage.setItem("notif_stock", String(notifStock));
    localStorage.setItem("notif_financial", String(notifFinancial));
    localStorage.setItem("notif_security", String(notifSecurity));
    localStorage.setItem("notif_sound", String(notifSound));
  }, [notifSales, notifStock, notifFinancial, notifSecurity, notifSound]);

  // Persist display preferences
  useEffect(() => {
    localStorage.setItem("font_size", fontSize);
    localStorage.setItem("compact_mode", String(compactMode));
    localStorage.setItem("sidebar_collapsed", String(sidebarCollapsed));
    localStorage.setItem("animations", String(animationsEnabled));
  }, [fontSize, compactMode, sidebarCollapsed, animationsEnabled]);

  // Persist data preferences
  useEffect(() => {
    localStorage.setItem("currency", currency);
    localStorage.setItem("date_format", dateFormat);
    localStorage.setItem("export_format", exportFormat);
    localStorage.setItem("items_per_page", itemsPerPage);
  }, [currency, dateFormat, exportFormat, itemsPerPage]);

  const handleClearCache = () => {
    const keysToKeep = ["token", "user", "theme", "language"];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) localStorage.removeItem(key);
    });
    window.location.reload();
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = window.document.documentElement;
    if (theme === "Dark") {
      root.classList.add("dark");
    } else if (theme === "Light") {
      root.classList.remove("dark");
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      if (systemTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setLoadingProfile(true);

    try {
      await api.put("/protected/profile", { full_name: fullName });
      const updatedUser = { ...currentUser, full_name: fullName };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileMessage({ text: "Perfil atualizado com sucesso!", type: "success" });
    } catch (err: any) {
      setProfileMessage({ text: err.message || "Erro ao atualizar perfil", type: "error" });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ text: "A nova senha deve ter no mínimo 6 caracteres.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "A confirmação de senha não confere.", type: "error" });
      return;
    }

    setLoadingPassword(true);

    try {
      await api.put("/protected/profile/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      // Clear password fields and update local user state
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const updatedUser = { ...currentUser, must_change_password: false };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setPasswordMessage({ text: "Senha alterada com sucesso!", type: "success" });
    } catch (err: any) {
      setPasswordMessage({ text: err.message || "Erro ao alterar senha", type: "error" });
    } finally {
      setLoadingPassword(false);
    }
  };

  const themes = [
    { name: "Light", label: t.themeLight, icon: Sun, description: t.themeLightDesc },
    { name: "Dark", label: t.themeDark, icon: Moon, description: t.themeDarkDesc },
    { name: "System", label: t.themeSystem, icon: Laptop, description: t.themeSystemDesc },
  ];

  const languages = ["English", "Português"] as const;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <header>
          <h1 className="text-2xl font-bold text-aether-text tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs text-aether-text-muted mt-1">
            {t.subtitle}
          </p>
        </header>

        {/* Seção 1: Perfil da Conta */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-aether-border pb-4">
            <div className="p-2.5 rounded-xl bg-aether-accent/10 text-aether-accent">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-aether-text">{t.accountProfile}</h2>
              <p className="text-xs text-aether-text-muted">{t.accountProfileDesc}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            {profileMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                profileMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}>
                {profileMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {profileMessage.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1">E-mail Cadastrado</label>
              <input
                type="email"
                value={currentUser.email || ""}
                disabled
                className="w-full rounded-xl border border-aether-border bg-aether-bg/50 px-3.5 py-2.5 text-xs text-aether-text-muted cursor-not-allowed opacity-75"
              />
            </div>

            <button
              type="submit"
              disabled={loadingProfile}
              className="rounded-xl bg-aether-accent px-4 py-2.5 text-xs font-semibold text-white hover:bg-aether-accent-hover disabled:opacity-70 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              {loadingProfile ? <Loader2 className="animate-spin" size={14} /> : null}
              Salvar Alterações do Perfil
            </button>
          </form>
        </section>

        {/* Seção 2: Segurança & Troca de Senha */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-aether-border pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-aether-text">{t.securityPassword}</h2>
              <p className="text-xs text-aether-text-muted">{t.securityPasswordDesc}</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            {passwordMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                passwordMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}>
                {passwordMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {passwordMessage.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1">Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingPassword}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-70 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              {loadingPassword ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={16} />}
              Atualizar Senha de Acesso
            </button>
          </form>
        </section>

        {/* Seção 3: Preferências de Interface */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-6">
          <div className="border-b border-aether-border pb-4">
            <h2 className="text-base font-bold text-aether-text">
              {t.preferences}
            </h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-aether-text">{t.interfaceTheme}</h3>
                <p className="text-xs text-aether-text-muted mt-1">
                  {t.interfaceThemeDesc}
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {themes.map((tItem) => (
                    <button
                      key={tItem.name}
                      onClick={() => setTheme(tItem.name)}
                      className={`flex flex-col items-start p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        theme === tItem.name
                          ? "border-aether-accent bg-aether-accent/10 text-aether-accent"
                          : "border-aether-border bg-aether-bg hover:border-aether-text-muted/50 text-aether-text-muted"
                      }`}
                    >
                      <tItem.icon 
                        size={18} 
                        className={`mb-2 ${
                          theme === tItem.name 
                            ? "text-aether-accent" 
                            : "text-aether-text-muted"
                        }`} 
                      />
                      <span className="text-xs font-bold">{tItem.label}</span>
                      <span className="text-[10px] text-aether-text-muted mt-0.5">{tItem.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-aether-text">{t.language}</h3>
                <p className="text-xs text-aether-text-muted mt-1">
                  {t.languageDesc}
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-col space-y-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                        language === lang
                          ? "border-aether-accent bg-aether-accent/10 text-aether-accent"
                          : "border-aether-border bg-aether-bg hover:border-aether-text-muted/50 text-aether-text-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe 
                          size={16} 
                          className={language === lang ? "text-aether-accent" : "text-aether-text-muted"} 
                        />
                        <span className="text-xs font-bold">{lang}</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        language === lang ? "border-aether-accent" : "border-aether-border"
                      }`}>
                        {language === lang && (
                          <div className="w-1.5 h-1.5 rounded-full bg-aether-accent" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 4: Notificações */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-aether-border pb-4">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-aether-text">Notificações</h2>
              <p className="text-xs text-aether-text-muted">Controle quais alertas você deseja receber no sistema.</p>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            {[
              { label: "Vendas & Pedidos", desc: "Novos pedidos, vendas concluídas e cancelamentos.", value: notifSales, setter: setNotifSales },
              { label: "Estoque & Produtos", desc: "Alertas de estoque baixo e reposição necessária.", value: notifStock, setter: setNotifStock },
              { label: "Financeiro", desc: "Contas a pagar/receber, vencimentos próximos.", value: notifFinancial, setter: setNotifFinancial },
              { label: "Segurança & Acessos", desc: "Logins suspeitos, alterações de permissão.", value: notifSecurity, setter: setNotifSecurity },
              { label: "Som de Notificação", desc: "Reproduzir som ao receber notificações.", value: notifSound, setter: setNotifSound },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3.5 rounded-xl border border-aether-border bg-aether-bg">
                <div>
                  <p className="text-xs font-semibold text-aether-text">{item.label}</p>
                  <p className="text-[10px] text-aether-text-muted mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => item.setter(!item.value)}
                  className="cursor-pointer text-aether-text-muted hover:text-aether-accent transition-colors"
                >
                  {item.value ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} />}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Seção 5: Exibição & Acessibilidade */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-aether-border pb-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Monitor size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-aether-text">Exibição & Acessibilidade</h2>
              <p className="text-xs text-aether-text-muted">Personalize a densidade e comportamento visual da interface.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1.5 flex items-center gap-1.5"><Type size={13} /> Tamanho da Fonte</label>
              <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all">
                <option value="small">Pequena (12px)</option>
                <option value="normal">Normal (14px)</option>
                <option value="large">Grande (16px)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1.5 flex items-center gap-1.5"><PanelLeftClose size={13} /> Itens por Página</label>
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(e.target.value)} className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all">
                <option value="10">10 itens</option>
                <option value="25">25 itens</option>
                <option value="50">50 itens</option>
                <option value="100">100 itens</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-w-lg">
            {[
              { label: "Modo Compacto", desc: "Reduz espaçamento para exibir mais conteúdo.", value: compactMode, setter: setCompactMode },
              { label: "Animações & Transições", desc: "Desative para melhorar a performance.", value: animationsEnabled, setter: setAnimationsEnabled },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3.5 rounded-xl border border-aether-border bg-aether-bg">
                <div>
                  <p className="text-xs font-semibold text-aether-text">{item.label}</p>
                  <p className="text-[10px] text-aether-text-muted mt-0.5">{item.desc}</p>
                </div>
                <button onClick={() => item.setter(!item.value)} className="cursor-pointer text-aether-text-muted hover:text-aether-accent transition-colors">
                  {item.value ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} />}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Seção 6: Dados & Exportação */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-aether-border pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-aether-text">Dados & Exportação</h2>
              <p className="text-xs text-aether-text-muted">Preferências de moeda, formato de datas e exportação de dados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1.5">Moeda Padrão</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all">
                <option value="BRL">R$ Real (BRL)</option>
                <option value="USD">$ Dólar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1.5">Formato de Data</label>
              <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all">
                <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                <option value="MM/DD/YYYY">MM/DD/AAAA</option>
                <option value="YYYY-MM-DD">AAAA-MM-DD (ISO)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-aether-text-muted mb-1.5">Formato de Exportação</label>
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="w-full rounded-xl border border-aether-border bg-aether-bg px-3.5 py-2.5 text-xs text-aether-text focus:border-aether-accent focus:outline-none transition-all">
                <option value="csv">CSV (.csv)</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF (.pdf)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Seção 7: Sessão & Informações */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-aether-border pb-4">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <Fingerprint size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-aether-text">Sessão & Segurança</h2>
              <p className="text-xs text-aether-text-muted">Informações da sessão ativa e gerenciamento de cache local.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            <div className="p-3.5 rounded-xl border border-aether-border bg-aether-bg">
              <p className="text-[10px] text-aether-text-muted uppercase font-medium flex items-center gap-1"><User size={11} /> Usuário Ativo</p>
              <p className="text-xs font-semibold text-aether-text mt-1">{currentUser.full_name || "—"}</p>
              <p className="text-[10px] text-aether-text-muted font-mono">{currentUser.email || "—"}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-aether-border bg-aether-bg">
              <p className="text-[10px] text-aether-text-muted uppercase font-medium flex items-center gap-1"><ShieldCheck size={11} /> Nível de Acesso</p>
              <p className="text-xs font-semibold text-aether-text mt-1 capitalize">{currentUser.role === "owner" ? "Proprietário" : currentUser.role === "admin" ? "Administrador" : currentUser.role === "editor" ? "Operador" : "Visualizador"}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-aether-border bg-aether-bg">
              <p className="text-[10px] text-aether-text-muted uppercase font-medium flex items-center gap-1"><Clock size={11} /> Sessão Iniciada</p>
              <p className="text-xs font-semibold text-aether-text mt-1">{new Date().toLocaleDateString("pt-BR")}</p>
              <p className="text-[10px] text-aether-text-muted font-mono">{new Date().toLocaleTimeString("pt-BR")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 max-w-lg">
            <button onClick={handleClearCache} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-xs font-semibold transition-all cursor-pointer">
              <Eraser size={14} />
              Limpar Cache Local
            </button>
            <p className="text-[10px] text-aether-text-muted">Remove dados temporários e preferências salvas localmente.</p>
          </div>
        </section>

        {/* Seção 8: Sobre o Sistema */}
        <section className="bg-aether-surface p-6 rounded-2xl border border-aether-border shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-aether-border pb-4">
            <div className="p-2.5 rounded-xl bg-aether-accent/10 text-aether-accent">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-aether-text">Sobre o Aether ERP</h2>
              <p className="text-xs text-aether-text-muted">Informações da plataforma e versão instalada.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Versão", value: "1.0.0" },
              { label: "Build", value: "2026.08.02" },
              { label: "Ambiente", value: "Produção" },
              { label: "API", value: "v1 — Go Fiber" },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-xl border border-aether-border bg-aether-bg text-center">
                <p className="text-[10px] text-aether-text-muted uppercase font-medium">{item.label}</p>
                <p className="text-xs font-bold text-aether-text mt-1 font-mono">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-aether-text-muted text-center pt-2">
            Aether ERP — Tactical Suite · Desenvolvido com Go, React e PostgreSQL · © {new Date().getFullYear()}
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
