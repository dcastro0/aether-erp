export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  sku?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  type?: string;
  created_at: string;
}

export interface CreateCustomerDTO {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  type: "individual" | "company";
}

export interface OrderItemDTO {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderDTO {
  customer_id: string;
  payment_method: string;
  items: OrderItemDTO[];
}

export interface Order {
  id: string;
  customer_name: string;
  seller_name?: string;
  total_amount: string;
  status: string;
  payment_method: string;
  created_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: string;
}

export interface OrderDetails {
  items: OrderItem[];
}

export interface CashFlowPoint {
  period: string;
  receita: number;
  despesa: number;
  saldo: number;
}

export interface StockHealth {
  healthy_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface TopProduct {
  name: string;
  total_quantity_sold: number;
  total_revenue: number;
}

export interface DashboardMetrics {
  total_revenue: number;
  sales_count: number;
  customers_count: number;
  low_stock_count: number;
  total_products_count: number;
  cash_flow_monthly?: CashFlowPoint[];
  stock_health?: StockHealth;
  top_products?: TopProduct[];
}

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  role: "owner" | "admin" | "editor" | "viewer";
  is_active: boolean;
  joined_at: string;
}

export interface UpdateEmployeeDTO {
  full_name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
}

export interface Supplier {
  id: string;
  name: string;
  trade_name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateSupplierDTO {
  name: string;
  trade_name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  total_amount: number;
  status: "pending" | "received" | "cancelled";
  notes?: string;
  expected_delivery?: string;
  received_at?: string;
  created_at: string;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemDTO {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export interface CreatePurchaseOrderDTO {
  supplier_id: string;
  notes?: string;
  expected_delivery?: string;
  items: CreatePurchaseOrderItemDTO[];
}

export const api = {
  baseUrl: "http://localhost:3000/api",

  _getHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async _handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro na requisição ao servidor");
    }
    if (res.status === 204) {
      return {} as T;
    }
    const text = await res.text();
    if (!text) {
      return {} as T;
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      return { message: text } as T;
    }
  },

  async get<T>(endpoint: string): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this._getHeaders(),
      });
      return await this._handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError") {
        throw new Error("Não foi possível conectar ao servidor backend (offline ou bloqueado por CORS).");
      }
      throw err;
    }
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this._getHeaders(),
        body: JSON.stringify(data),
      });
      return await this._handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError") {
        throw new Error("Não foi possível conectar ao servidor backend.");
      }
      throw err;
    }
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: this._getHeaders(),
        body: JSON.stringify(data),
      });
      return await this._handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError") {
        throw new Error("Não foi possível conectar ao servidor backend.");
      }
      throw err;
    }
  },

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers: this._getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      return await this._handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError") {
        throw new Error("Não foi possível conectar ao servidor backend.");
      }
      throw err;
    }
  },

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: this._getHeaders(),
      });
      return await this._handleResponse<T>(res);
    } catch (err: any) {
      if (err.name === "TypeError") {
        throw new Error("Não foi possível conectar ao servidor backend.");
      }
      throw err;
    }
  },
};
