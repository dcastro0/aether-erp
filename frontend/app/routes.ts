import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),

  route("dashboard", "routes/home.tsx", { id: "dashboard" }),

  route("dashboard/products", "routes/products.tsx"),
  route("dashboard/customers", "routes/customers.tsx"),
  route("dashboard/sales", "routes/sales.tsx"),
  route("dashboard/orders", "routes/orders.tsx"),
] satisfies RouteConfig;
