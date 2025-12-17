/**
 * API Service Layer
 * Centralized API calls for all backend endpoints
 */

import axiosInstance from "@/src/lib/axios";
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFilters,
  PaginatedResponse,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderFilters,
  Staff,
  CreateStaffRequest,
  UpdateStaffRequest,
  InventoryLog,
  CreateInventoryLogRequest,
} from "@/src/types/api";

// ==================== Auth API ====================

export const authApi = {
  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/user/login",
      data
    );
    return response.data.data;
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/user/register",
      data
    );
    return response.data.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>(
      "/auth/user/profile"
    );
    return response.data.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await axiosInstance.post("/auth/logout");
  },

  /**
   * Admin login
   */
  adminLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/admin/login",
      data
    );
    return response.data.data;
  },
};

// ==================== Products API ====================

export const productsApi = {
  /**
   * Get all products with filters
   */
  getAll: async (filters?: ProductFilters): Promise<Product[]> => {
    console.log("API: Fetching products with params:", filters);
    const response = await axiosInstance.get<any>("/products", {
      params: filters,
    });
    console.log("API: Products response:", response.data);
    // Backend returns data directly in response.data, not nested
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  },

  /**
   * Get single product by ID
   */
  getById: async (id: string): Promise<Product> => {
    const response = await axiosInstance.get<ApiResponse<Product>>(
      `/products/${id}`
    );
    return response.data.data;
  },

  /**
   * Create new product (Admin only)
   */
  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await axiosInstance.post<ApiResponse<Product>>(
      "/products",
      data
    );
    return response.data.data;
  },

  /**
   * Update product (Admin only)
   */
  update: async (id: string, data: UpdateProductRequest): Promise<Product> => {
    const response = await axiosInstance.put<ApiResponse<Product>>(
      `/products/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete product (Admin only)
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`);
  },
};

// ==================== Cart API ====================

export const cartApi = {
  /**
   * Get user's cart
   */
  get: async (): Promise<CartItem[]> => {
    const response = await axiosInstance.get<
      ApiResponse<{ items: CartItem[]; totalItems: number; totalPrice: number }>
    >("/cart");
    return response.data.data.items;
  },

  /**
   * Get cart item count
   */
  getCount: async (): Promise<number> => {
    const response = await axiosInstance.get<ApiResponse<{ count: number }>>(
      "/cart/count"
    );
    return response.data.data.count;
  },

  /**
   * Add item to cart
   */
  addItem: async (data: AddToCartRequest): Promise<CartItem> => {
    const response = await axiosInstance.post<ApiResponse<CartItem>>(
      "/cart/items",
      data
    );
    return response.data.data;
  },

  /**
   * Update cart item quantity
   */
  updateItem: async (
    productId: string,
    data: UpdateCartItemRequest
  ): Promise<CartItem> => {
    const response = await axiosInstance.put<ApiResponse<CartItem>>(
      `/cart/items/${productId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Remove item from cart
   */
  removeItem: async (productId: string): Promise<void> => {
    await axiosInstance.delete(`/cart/items/${productId}`);
  },

  /**
   * Clear entire cart
   */
  clear: async (): Promise<void> => {
    await axiosInstance.delete("/cart");
  },
};

// ==================== Orders API ====================

export const ordersApi = {
  /**
   * Get all orders (with filters for admin)
   */
  getAll: async (filters?: OrderFilters): Promise<Order[]> => {
    const response = await axiosInstance.get<any>("/orders", {
      params: filters,
    });
    // Backend returns data directly in response.data, not nested
    return Array.isArray(response.data)
      ? response.data
      : response.data.data || [];
  },

  /**
   * Get user's orders
   * Backend automatically filters by user role
   */
  getMyOrders: async (): Promise<Order[]> => {
    const response = await axiosInstance.get<ApiResponse<Order[]>>("/orders");
    return response.data.data;
  },

  /**
   * Get single order by ID
   */
  getById: async (id: string): Promise<Order> => {
    const response = await axiosInstance.get<any>(`/orders/${id}`);
    // Backend returns response with order nested inside
    // Check if response.data has an 'order' property and extract it
    if (
      response.data &&
      typeof response.data === "object" &&
      "order" in response.data
    ) {
      return response.data.order;
    }
    // Fallback to other structures
    return response.data.data || response.data;
  },

  /**
   * Create new order (checkout)
   */
  create: async (data: CreateOrderRequest): Promise<Order> => {
    const response = await axiosInstance.post<ApiResponse<Order>>(
      "/orders",
      data
    );
    return response.data.data;
  },

  /**
   * Update order status (Admin only)
   */
  updateStatus: async (
    id: string,
    data: UpdateOrderStatusRequest
  ): Promise<Order> => {
    const response = await axiosInstance.patch<ApiResponse<Order>>(
      `/orders/${id}/status`,
      data
    );
    return response.data.data;
  },

  /**
   * Cancel order
   */
  cancel: async (id: string): Promise<Order> => {
    const response = await axiosInstance.post<any>(`/orders/${id}/cancel`, {});
    // Handle different response structures
    if (
      response.data &&
      typeof response.data === "object" &&
      "order" in response.data
    ) {
      return response.data.order;
    }
    return response.data.data || response.data;
  },
};

// ==================== Staff API ====================

export const staffApi = {
  /**
   * Get all staff members (Admin only)
   */
  getAll: async (): Promise<Staff[]> => {
    const response = await axiosInstance.get<ApiResponse<Staff[]>>("/staff");
    return response.data.data;
  },

  /**
   * Get single staff member by ID
   */
  getById: async (id: string): Promise<Staff> => {
    const response = await axiosInstance.get<ApiResponse<Staff>>(
      `/staff/${id}`
    );
    return response.data.data;
  },

  /**
   * Create new staff member (Admin only)
   */
  create: async (data: CreateStaffRequest): Promise<Staff> => {
    const response = await axiosInstance.post<ApiResponse<Staff>>(
      "/staff",
      data
    );
    return response.data.data;
  },

  /**
   * Update staff member (Admin only)
   */
  update: async (id: string, data: UpdateStaffRequest): Promise<Staff> => {
    const response = await axiosInstance.put<ApiResponse<Staff>>(
      `/staff/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete staff member (Admin only)
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/staff/${id}`);
  },

  /**
   * Get payroll summary (Admin only)
   */
  getPayrollSummary: async (): Promise<{
    totalPayroll: number;
    staffCount: number;
  }> => {
    const response = await axiosInstance.get<
      ApiResponse<{
        totalStaff: number;
        activeStaff: number;
        totalSalary: number;
        totalOvertimePayment: number;
        totalTax: number;
        totalNetPay: number;
      }>
    >("/staff/payroll/summary");
    console.log("Raw payroll response:", response.data);

    const data = response.data.data;

    // Map backend response to frontend expected format
    return {
      staffCount: data?.totalStaff || 0,
      totalPayroll: data?.totalNetPay || 0,
    };
  },
};

// ==================== Inventory API ====================

export const inventoryApi = {
  /**
   * Get inventory logs for a product
   */
  getProductHistory: async (productId: string): Promise<InventoryLog[]> => {
    const response = await axiosInstance.get<ApiResponse<InventoryLog[]>>(
      `/inventory/product/${productId}`
    );
    return response.data.data;
  },

  /**
   * Get inventory summary
   */
  getSummary: async (): Promise<any> => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      "/inventory/summary"
    );
    return response.data.data;
  },

  /**
   * Create inventory log (Admin only)
   */
  createLog: async (data: CreateInventoryLogRequest): Promise<InventoryLog> => {
    const response = await axiosInstance.post<ApiResponse<InventoryLog>>(
      "/inventory",
      data
    );
    return response.data.data;
  },

  /**
   * Get inventory change history (Admin only)
   */
  getChanges: async (): Promise<InventoryLog[]> => {
    const response = await axiosInstance.get<ApiResponse<InventoryLog[]>>(
      "/inventory/changes"
    );
    return response.data.data;
  },
};

// ==================== Export All APIs ====================

const api = {
  auth: authApi,
  products: productsApi,
  cart: cartApi,
  orders: ordersApi,
  staff: staffApi,
  inventory: inventoryApi,
};

export default api;
