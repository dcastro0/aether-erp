import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { Mail, Lock, Loader2, ArrowRight, LayoutDashboard } from "lucide-react"; // Ícones novos
import { api, type LoginResponse } from "../lib/api";

// Schema (Mantido igual)
const loginSchema = z.object({
  email: z.string().email("Digite um email válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) =>
      api.post<LoginResponse>("/auth/login", data),
    onSuccess: (data) => {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* LADO ESQUERDO: Formulário */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Cabeçalho Mobile/Form */}
          <div className="mb-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Entre com suas credenciais para acessar o Aether.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Input Email com Ícone */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email Corporativo
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  {...register("email")}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all duration-200"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Input Senha com Ícone */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Senha
                </label>
                <a
                  href="#"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                >
                  Esqueceu?
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all duration-200"
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Erro da API */}
            {loginMutation.isError && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 flex items-center gap-2">
                <span className="font-bold">Erro:</span>
                {loginMutation.error instanceof Error
                  ? loginMutation.error.message
                  : "Falha ao autenticar"}
              </div>
            )}

            {/* Botão de Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group flex w-full items-center justify-center rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
            >
              {loginMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  Entrar na Plataforma
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Ainda não tem conta?{" "}
            <a
              href="#"
              className="font-semibold text-blue-600 hover:text-blue-500"
            >
              Fale com o suporte
            </a>
          </div>
        </div>
      </div>

      {/* LADO DIREITO: Branding / Art */}
      <div className="hidden w-1/2 bg-slate-900 lg:flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-125 w-125 rounded-full bg-blue-600/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-125 w-125 rounded-full bg-indigo-600/20 blur-3xl"></div>

        {/* Logo Area */}
        <div className="relative z-10">
          <h2 className="text-white text-lg font-medium tracking-wide opacity-80">
            Aether ERP
          </h2>
        </div>

        {/* Content Area */}
        <div className="relative z-10 max-w-md">
          <blockquote className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-xl font-medium leading-relaxed text-white">
                "A gestão da sua empresa nunca foi tão fluida. Controle
                financeiro, estoque e vendas em uma única atmosfera."
              </p>
            </div>
            <footer className="text-sm text-slate-400">
              &copy; 2026 Aether Systems. Todos os direitos reservados.
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
