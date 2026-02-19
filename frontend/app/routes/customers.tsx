import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Filter,
  Users,
  Building2,
  Phone,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { api, type Customer, type CreateCustomerDTO } from "../lib/api";

const customerSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  document: z.string().optional(),
  type: z.enum(["individual", "company"]),
});

type CustomerForm = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const {
    data: customers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: () => api.get<Customer[]>("/protected/customers"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerDTO) =>
      api.post("/protected/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setIsModalOpen(false);
      reset();
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      document: "",
      type: "individual" as "individual" | "company",
    },
  });

  const onSubmit: SubmitHandler<CustomerForm> = (data) => {
    createMutation.mutate(data);
  };

  const filteredCustomers = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Clientes
            </h1>
            <p className="text-sm text-slate-500">
              Gerencie sua base de contatos e parceiros.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus size={16} />
            Novo Cliente
          </button>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              className="w-full rounded-lg border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <Filter size={16} />
            Filtrar
          </button>
        </div>

        {/* Lista de Clientes */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
              <AlertCircle size={32} />
              <p>Erro ao carregar clientes.</p>
            </div>
          ) : filteredCustomers?.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400 gap-4">
              <Users size={48} className="opacity-20" />
              <p>Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Cliente
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Contato
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Documento
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-600">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers?.map((customer) => (
                    <tr
                      key={customer.id}
                      className="group hover:bg-slate-50/80 transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                              customer.type === "company"
                                ? "bg-indigo-500"
                                : "bg-blue-500"
                            }`}
                          >
                            {customer.type === "company" ? (
                              <Building2 size={18} />
                            ) : (
                              <Users size={18} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {customer.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Cadastrado em{" "}
                              {new Date(
                                customer.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-slate-600">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-xs">
                              <Mail size={14} className="text-slate-400" />{" "}
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-xs">
                              <Phone size={14} className="text-slate-400" />{" "}
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {customer.document || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            customer.type === "company"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                              : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}
                        >
                          {customer.type === "company"
                            ? "Empresa"
                            : "Pessoa Física"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Novo Cliente
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Tipo de Cliente (Radio Cards) */}
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${watch("type") === "individual" ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    value="individual"
                    {...register("type")}
                    className="sr-only"
                  />
                  <Users
                    className={
                      watch("type") === "individual"
                        ? "text-blue-600"
                        : "text-slate-400"
                    }
                  />
                  <span
                    className={`text-sm font-medium ${watch("type") === "individual" ? "text-blue-700" : "text-slate-600"}`}
                  >
                    Pessoa Física
                  </span>
                </label>
                <label
                  className={`cursor-pointer border rounded-lg p-3 flex items-center gap-3 transition-all ${watch("type") === "company" ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    value="company"
                    {...register("type")}
                    className="sr-only"
                  />
                  <Building2
                    className={
                      watch("type") === "company"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }
                  />
                  <span
                    className={`text-sm font-medium ${watch("type") === "company" ? "text-indigo-700" : "text-slate-600"}`}
                  >
                    Empresa
                  </span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome Completo / Razão Social
                  </label>
                  <input
                    {...register("name")}
                    className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Telefone
                    </label>
                    <input
                      {...register("phone")}
                      className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {watch("type") === "company" ? "CNPJ" : "CPF"}
                  </label>
                  <input
                    {...register("document")}
                    className="block w-full rounded-lg border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
                >
                  {createMutation.isPending ? "Salvando..." : "Criar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
