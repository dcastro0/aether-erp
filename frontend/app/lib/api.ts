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

// Novos Tipos para Pedidos
export interface OrderItemDTO {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreateOrderDTO {
  customer_id: string;
  items: OrderItemDTO[];
}

export interface Order {
  id: string;
  customer_name: string;
  total_amount: string;
  status: string;
  created_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderDetails {
  items: OrderItem[];
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

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "GET",
      headers: this._getHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = "/login";
      }
      throw new Error(errorData.error || "Erro na requisição");
    }

    return res.json();
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this._getHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro na requisição");
    }

    return res.json();
  },
};
