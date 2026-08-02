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
  ShieldCheck
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

  useEffect(() => {
    localStorage.setItem("language", language);
    window.dispatchEvent(new Event('languageChange'));
  }, [language]);

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
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            {t.subtitle}
          </p>
        </header>

        {/* Seção 1: Perfil da Conta */}
        <section className="bg-[#0F172A] p-6 rounded-2xl border border-[#1E293B] shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4">
            <div className="p-2.5 rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">{t.accountProfile}</h2>
              <p className="text-xs text-[#94A3B8]">{t.accountProfileDesc}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
            {profileMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                profileMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                {profileMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {profileMessage.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Nome Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">E-mail Cadastrado</label>
              <input
                type="email"
                value={currentUser.email || ""}
                disabled
                className="w-full rounded-xl border border-[#1E293B] bg-[#090D16]/50 px-3.5 py-2.5 text-xs text-[#64748B] cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loadingProfile}
              className="rounded-xl bg-[#0EA5E9] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0284C7] disabled:opacity-70 shadow-lg shadow-sky-500/20 transition-all flex items-center gap-2"
            >
              {loadingProfile ? <Loader2 className="animate-spin" size={14} /> : null}
              Salvar Alterações do Perfil
            </button>
          </form>
        </section>

        {/* Seção 2: Segurança & Troca de Senha */}
        <section className="bg-[#0F172A] p-6 rounded-2xl border border-[#1E293B] shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#1E293B] pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">{t.securityPassword}</h2>
              <p className="text-xs text-[#94A3B8]">{t.securityPasswordDesc}</p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            {passwordMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                passwordMessage.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                {passwordMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {passwordMessage.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="No mínimo 6 caracteres"
                className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full rounded-xl border border-[#1E293B] bg-[#090D16] px-3.5 py-2.5 text-xs text-[#F8FAFC] focus:border-[#0EA5E9] focus:outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loadingPassword}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-70 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {loadingPassword ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={16} />}
              Atualizar Senha de Acesso
            </button>
          </form>
        </section>

        {/* Seção 3: Preferências de Interface */}
        <section className="bg-[#0F172A] p-6 rounded-2xl border border-[#1E293B] shadow-sm space-y-6">
          <div className="border-b border-[#1E293B] pb-4">
            <h2 className="text-base font-bold text-[#F8FAFC]">
              {t.preferences}
            </h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-[#F8FAFC]">{t.interfaceTheme}</h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {t.interfaceThemeDesc}
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {themes.map((tItem) => (
                    <button
                      key={tItem.name}
                      onClick={() => setTheme(tItem.name)}
                      className={`flex flex-col items-start p-3.5 rounded-xl border transition-all duration-200 ${
                        theme === tItem.name
                          ? "border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#38BDF8]"
                          : "border-[#1E293B] bg-[#090D16] hover:border-[#334155] text-[#94A3B8]"
                      }`}
                    >
                      <tItem.icon 
                        size={18} 
                        className={`mb-2 ${
                          theme === tItem.name 
                            ? "text-[#0EA5E9]" 
                            : "text-[#64748B]"
                        }`} 
                      />
                      <span className="text-xs font-bold">{tItem.label}</span>
                      <span className="text-[10px] text-[#64748B] mt-0.5">{tItem.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-[#F8FAFC]">{t.language}</h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {t.languageDesc}
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-col space-y-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                        language === lang
                          ? "border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#38BDF8]"
                          : "border-[#1E293B] bg-[#090D16] hover:border-[#334155] text-[#94A3B8]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe 
                          size={16} 
                          className={language === lang ? "text-[#0EA5E9]" : "text-[#64748B]"} 
                        />
                        <span className="text-xs font-bold">{lang}</span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        language === lang ? "border-[#0EA5E9]" : "border-[#334155]"
                      }`}>
                        {language === lang && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
