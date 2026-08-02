import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),

  route("dashboard", "routes/home.tsx", { id: "dashboard" }),

  route("dashboard/products", "routes/products.tsx"),
  route("dashboard/customers", "routes/customers.tsx"),
  route("dashboard/sales", "routes/sales.tsx"),
  route("dashboard/orders", "routes/orders.tsx"),
  route("dashboard/settings", "routes/settings.tsx"),
  route("dashboard/financial", "routes/financial.tsx"),
  route("dashboard/employees", "routes/employees.tsx"),
  route("dashboard/audit-logs", "routes/audit-logs.tsx"),
  route("dashboard/suppliers", "routes/suppliers.tsx"),
  route("dashboard/purchases", "routes/purchases.tsx"),
  route("dashboard/reports", "routes/reports.tsx"),
] satisfies RouteConfig;
