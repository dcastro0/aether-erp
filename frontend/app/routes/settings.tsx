import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { User, Building2, Shield, Bell, Save, Loader2 } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api } from "../lib/api";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setFullName(parsed.full_name);
    }
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data: { full_name: string }) =>
      api.put("/protected/profile", data),
    onSuccess: (updatedUser: any) => {
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert("Perfil atualizado com sucesso!");
    },
    onError: () => alert("Erro ao atualizar perfil"),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => api.put("/protected/profile/password", data),
    onSuccess: () => {
      alert("Palavra-passe atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) => alert(`Erro: ${err.message}`),
  });

  const handleUpdateProfile = () => {
    if (!fullName.trim()) return;
    updateProfileMutation.mutate({ full_name: fullName });
  };

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      alert("As novas palavras-passe não coincidem.");
      return;
    }
    if (newPassword.length < 6) {
      alert("A nova palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    updatePasswordMutation.mutate({
      current_password: currentPassword,
      new_password: newPassword,
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
          <p className="text-sm text-slate-500">
            Gira as preferências da sua conta e da organização.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "profile" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <User size={18} /> O Meu Perfil
              </button>
              <button
                onClick={() => setActiveTab("organization")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "organization" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Building2 size={18} /> Organização
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "security" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Shield size={18} /> Segurança
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === "notifications" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Bell size={18} /> Notificações
              </button>
            </nav>
          </div>

          <div className="flex-1">
            {activeTab === "profile" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6">
                  Informações Pessoais
                </h2>

                <div className="flex items-center gap-6 mb-8">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Endereço de E-mail
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-500 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    Guardar Alterações
                  </button>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-6">
                  Segurança e Autenticação
                </h2>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Palavra-passe Atual
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nova Palavra-passe
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Confirmar Nova Palavra-passe
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleUpdatePassword}
                    disabled={updatePasswordMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70"
                  >
                    {updatePasswordMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    Atualizar Palavra-passe
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
