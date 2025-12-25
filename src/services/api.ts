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
  Department,
  StaffAccount,
  Permission,
  CreateStaffAccountRequest,
  UpdateStaffAccountRequest,
  Payment,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  PaymentFilters,
} from "@/src/types/api";

// ==================== Auth API ====================

export const authApi = {
      /**
       * Login user
       * Sets role-specific cookies: accessToken_user, refreshToken_user
       * Cookies are automatically set by backend via Set-Cookie headers
       * Multiple simultaneous logins are supported - user cookies won't interfere with admin/staff cookies
       */
      login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
          "/auth/user/login",
          data
        );
        // Role-specific cookies (accessToken_user, refreshToken_user) are automatically set by backend
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
       * Refresh access token
       * Backend automatically detects which role's refresh token cookie to use:
       * - refreshToken_user (for user requests)
       * - refreshToken_admin (for admin requests)
       * - refreshToken_staff (for staff requests)
       * Refresh token comes from role-specific httpOnly cookie (preferred) or request body (backward compatibility)
       */
      refreshToken: async (refreshToken?: string): Promise<AuthResponse> => {
        // If refreshToken provided, use it (backward compatibility)
        // Otherwise, backend reads from role-specific httpOnly cookie
        // Backend automatically detects which role's cookie to use based on request context
        const body = refreshToken ? { refreshToken } : {};
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
          "/auth/refresh",
          body
        );
        // New role-specific tokens are in httpOnly cookies, response may not contain tokens
        return response.data.data || ({} as AuthResponse);
      },

      /**
       * Logout user
       * Backend automatically detects which role's refresh token cookie to use and clears:
       * - accessToken_user, refreshToken_user (for user logout)
       * - accessToken_admin, refreshToken_admin (for admin logout)
       * - accessToken_staff, refreshToken_staff (for staff logout)
       * Refresh token comes from role-specific httpOnly cookie (preferred) or request body (backward compatibility)
       */
      logout: async (refreshToken?: string): Promise<void> => {
        // If refreshToken provided, use it (backward compatibility)
        // Otherwise, backend reads from role-specific httpOnly cookie
        // Backend automatically detects which role's cookies to clear based on request context
        const body = refreshToken ? { refreshToken } : {};
        await axiosInstance.post("/auth/logout", body);
        // Backend clears role-specific cookies automatically
      },

  /**
   * Admin login
   * Sets role-specific cookies: accessToken_admin, refreshToken_admin
   * Cookies are automatically set by backend via Set-Cookie headers
   * Multiple simultaneous logins are supported - admin cookies won't interfere with staff/user cookies
   */
  adminLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/admin/login",
      data
    );
    // Role-specific cookies (accessToken_admin, refreshToken_admin) are automatically set by backend
    return response.data.data;
  },

  /**
   * Get admin profile
   */
  getAdminProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<User>>(
      "/auth/admin/profile"
    );
    return response.data.data;
  },

  /**
   * Staff Account Login
   * Sets role-specific cookies: accessToken_staff, refreshToken_staff
   * Cookies are automatically set by backend via Set-Cookie headers
   * Note: Set-Cookie headers are NOT accessible to JavaScript (browser security feature)
   * Cookies are automatically stored by the browser when Set-Cookie headers are present
   * Multiple simultaneous logins are supported - staff cookies won't interfere with admin/user cookies
   * To verify cookies: Check DevTools → Application → Cookies → http://localhost:3000
   */
  staffLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/staff-accounts/login",
      data
      // withCredentials is already set at instance level (axios.ts)
      // This ensures cookies are sent/received automatically
    );
    
    // Role-specific cookies (accessToken_staff, refreshToken_staff) are automatically set by backend
    // No need to manually store tokens - they're in httpOnly cookies
    // Cookies are set for the backend domain (localhost:3000), not frontend (localhost:3001)
    // Verify cookies in: DevTools → Application → Cookies → http://localhost:3000
    return response.data.data;
  },

  /**
   * Logout from all devices
   * Revokes all refresh tokens for the authenticated user/admin/staff
   */
  logoutAll: async (): Promise<void> => {
    await axiosInstance.post("/auth/logout-all", {});
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
   * Fetches all staff with a high limit for client-side pagination
   */
  getAll: async (): Promise<Staff[]> => {
    // Fetch with high limit to get all staff for client-side pagination
    const response = await axiosInstance.get<any>("/staff", {
      params: { page: 1, limit: 1000 }, // High limit to get all staff
    });
    const data = response.data;

    // Handle different envelope shapes:
    // - Array directly
    // - { data: Staff[] }
    // - { data: { staff: Staff[] } }
    // - { data: { staff: Staff[], pagination: {...} } } (paginated response)
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data?.data?.staff)) {
      return data.data.staff;
    }
    return [];
  },

  /**
   * Get single staff member by ID
   */
  getById: async (id: string): Promise<Staff> => {
    const response = await axiosInstance.get<any>(`/staff/${id}`);
    const data = response.data;

    // Handle different response shapes from backend
    if (data?.data?.staff) {
      return data.data.staff as Staff;
    }
    if (data?.staff) {
      return data.staff as Staff;
    }
    if (data?.data) {
      return data.data as Staff;
    }
    return data as Staff;
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

// ==================== Departments API ====================

export const departmentsApi = {
  /**
   * Get all departments (Admin only)
   * Note: Backend returns all departments - no pagination
   * @param status Optional filter: "active" | "inactive"
   */
  getAll: async (status?: "active" | "inactive"): Promise<Department[]> => {
    const params: any = {};
    if (status) {
      params.status = status;
    }
    
    const response = await axiosInstance.get<any>("/departments", { params });
    const data = response.data;

    // Possible shapes based on Postman collection:
    // - { data: Department[] }
    // - { data: { departments: Department[] } }
    if (Array.isArray(data?.data)) {
      return data.data as Department[];
    }
    if (Array.isArray(data?.data?.departments)) {
      return data.data.departments as Department[];
    }
    return [];
  },

  /**
   * Get only active departments (convenience method)
   */
  getActive: async (): Promise<Department[]> => {
    return departmentsApi.getAll("active");
  },

  /**
   * Get single department by ID (Admin only)
   */
  getById: async (id: string): Promise<Department> => {
    const response = await axiosInstance.get<any>(`/departments/${id}`);
    const data = response.data;

    if (data?.data?.department) {
      return data.data.department as Department;
    }
    if (data?.department) {
      return data.department as Department;
    }
    return (data?.data || data) as Department;
  },

  /**
   * Create department (Admin only)
   */
  create: async (payload: {
    name: string;
    shortName: string;
    status?: "active" | "inactive";
  }): Promise<Department> => {
    const response = await axiosInstance.post<any>("/departments", payload);
    const data = response.data;

    // Postman tests use response.data.department.id
    if (data?.data?.department) {
      return data.data.department as Department;
    }
    if (data?.department) {
      return data.department as Department;
    }
    return (data?.data || data) as Department;
  },

  /**
   * Update department (Admin only)
   */
  update: async (
    id: string,
    payload: { name?: string; shortName?: string }
  ): Promise<Department> => {
    const response = await axiosInstance.put<any>(
      `/departments/${id}`,
      payload
    );
    const data = response.data;

    if (data?.data?.department) {
      return data.data.department as Department;
    }
    if (data?.department) {
      return data.department as Department;
    }
    return (data?.data || data) as Department;
  },

  /**
   * Update department status only (Admin only)
   */
  updateStatus: async (
    id: string,
    status: "active" | "inactive"
  ): Promise<Department> => {
    const response = await axiosInstance.patch<any>(
      `/departments/${id}/status`,
      { status }
    );
    const data = response.data;

    if (data?.data?.department) {
      return data.data.department as Department;
    }
    if (data?.department) {
      return data.department as Department;
    }
    return (data?.data || data) as Department;
  },

  /**
   * Delete department (Admin only)
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/departments/${id}`);
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

// ==================== Payments API ====================

export const paymentsApi = {
  /**
   * Get all payments with optional filters (Admin only)
   */
  getAll: async (filters?: PaymentFilters): Promise<Payment[]> => {
    const response = await axiosInstance.get<any>("/payments", {
      params: filters,
    });
    const data = response.data;

    // Likely { data: payments[] } or { payments: [] }
    if (Array.isArray(data?.data)) {
      return data.data as Payment[];
    }
    if (Array.isArray(data?.data?.payments)) {
      return data.data.payments as Payment[];
    }
    if (Array.isArray(data?.payments)) {
      return data.payments as Payment[];
    }
    return Array.isArray(data) ? (data as Payment[]) : [];
  },

  /**
   * Get payment by ID (Admin only)
   */
  getById: async (id: string): Promise<Payment> => {
    const response = await axiosInstance.get<any>(`/payments/${id}`);
    const data = response.data;

    if (data?.data?.payment) {
      return data.data.payment as Payment;
    }
    if (data?.payment) {
      return data.payment as Payment;
    }
    return (data?.data || data) as Payment;
  },

  /**
   * Get payments by staff ID (Admin only)
   */
  getByStaffId: async (
    staffId: string,
    filters?: PaymentFilters
  ): Promise<Payment[]> => {
    const response = await axiosInstance.get<any>(
      `/payments/staff/${staffId}`,
      { params: filters }
    );
    const data = response.data;

    if (Array.isArray(data?.data)) {
      return data.data as Payment[];
    }
    if (Array.isArray(data?.data?.payments)) {
      return data.data.payments as Payment[];
    }
    return Array.isArray(data) ? (data as Payment[]) : [];
  },

  /**
   * Get payment summary (Admin only)
   */
  getSummary: async (): Promise<any> => {
    const response = await axiosInstance.get<ApiResponse<any>>(
      "/payments/summary"
    );
    return response.data.data;
  },

  /**
   * Create payment (Admin only)
   */
  create: async (payload: CreatePaymentRequest): Promise<Payment> => {
    const response = await axiosInstance.post<any>("/payments", payload);
    const data = response.data;

    if (data?.data?.payment) {
      return data.data.payment as Payment;
    }
    if (data?.payment) {
      return data.payment as Payment;
    }
    return (data?.data || data) as Payment;
  },

  /**
   * Update payment (Admin only)
   */
  update: async (
    id: string,
    payload: UpdatePaymentRequest
  ): Promise<Payment> => {
    const response = await axiosInstance.put<any>(
      `/payments/${id}`,
      payload
    );
    const data = response.data;

    if (data?.data?.payment) {
      return data.data.payment as Payment;
    }
    if (data?.payment) {
      return data.payment as Payment;
    }
    return (data?.data || data) as Payment;
  },

  /**
   * Delete payment (Admin only)
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/payments/${id}`);
  },
};

// ==================== Staff Accounts API ====================

export const staffAccountsApi = {
  /**
   * Get all staff accounts with permissions (Admin only)
   * Fetches all staff accounts with a high limit for client-side pagination
   */
  getAll: async (): Promise<StaffAccount[]> => {
    try {
      const response = await axiosInstance.get<any>("/staff-accounts", {
        params: { page: 1, limit: 1000 }, // High limit to get all accounts for client-side pagination
      });
      const data = response.data;

      // Handle response structure: { status: "success", data: { accounts: [...], pagination: {...} } }
      if (Array.isArray(data?.data?.accounts)) {
        return data.data.accounts as StaffAccount[];
      }
      // Handle alternative structure: { data: { staffAccounts: [...] } }
      if (Array.isArray(data?.data?.staffAccounts)) {
        return data.data.staffAccounts as StaffAccount[];
      }
      // Handle non-paginated response: { data: { staffAccounts: [...] } }
      if (Array.isArray(data?.staffAccounts)) {
        return data.staffAccounts as StaffAccount[];
      }
      // Handle direct array in data: { data: [...] }
      if (Array.isArray(data?.data)) {
        return data.data as StaffAccount[];
      }
      // Handle direct array response: [...]
      if (Array.isArray(data)) {
        return data as StaffAccount[];
      }
      // Handle paginated response with items: { data: { items: [...], total: ... } }
      if (Array.isArray(data?.data?.items)) {
        return data.data.items as StaffAccount[];
      }
      // Log for debugging if no data found
      console.warn("Unexpected staff accounts response structure:", JSON.stringify(data, null, 2));
      return [];
    } catch (error: any) {
      console.error("Error fetching staff accounts:", error);
      console.error("Error response:", error?.response?.data);
      throw error;
    }
  },

  /**
   * Get staff account by ID (Admin or Staff with staff_management permission)
   * Use this endpoint when admins need to view a staff account profile
   * DO NOT use getProfile() for admin viewing staff accounts - that's only for staff viewing their own profile
   */
  getById: async (id: string): Promise<StaffAccount> => {
    const response = await axiosInstance.get<any>(`/staff-accounts/${id}`);
    const data = response.data;

    if (data?.data?.staffAccount) {
      return data.data.staffAccount as StaffAccount;
    }
    if (data?.staffAccount) {
      return data.staffAccount as StaffAccount;
    }
    return (data?.data || data) as StaffAccount;
  },

  /**
   * Create staff account (Admin only)
   */
  create: async (
    payload: CreateStaffAccountRequest
  ): Promise<StaffAccount> => {
    const response = await axiosInstance.post<any>("/staff-accounts", payload);
    const data = response.data;

    if (data?.data?.staffAccount) {
      return data.data.staffAccount as StaffAccount;
    }
    if (data?.staffAccount) {
      return data.staffAccount as StaffAccount;
    }
    return (data?.data || data) as StaffAccount;
  },

  /**
   * Update staff account (email/password) (Admin only)
   */
  update: async (
    id: string,
    payload: UpdateStaffAccountRequest
  ): Promise<StaffAccount> => {
    const response = await axiosInstance.put<any>(
      `/staff-accounts/${id}`,
      payload
    );
    const data = response.data;

    if (data?.data?.staffAccount) {
      return data.data.staffAccount as StaffAccount;
    }
    if (data?.staffAccount) {
      return data.staffAccount as StaffAccount;
    }
    return (data?.data || data) as StaffAccount;
  },

  /**
   * Update permissions (PUT) for staff account (Admin only)
   */
  setPermissions: async (
    id: string,
    permissionIds: string[]
  ): Promise<StaffAccount> => {
    const response = await axiosInstance.put<any>(
      `/staff-accounts/${id}/permissions`,
      { permissionIds }
    );
    const data = response.data;

    if (data?.data?.staffAccount) {
      return data.data.staffAccount as StaffAccount;
    }
    if (data?.staffAccount) {
      return data.staffAccount as StaffAccount;
    }
    return (data?.data || data) as StaffAccount;
  },

  /**
   * Delete staff account (Admin only)
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/staff-accounts/${id}`);
  },

  /**
   * Get authenticated staff account profile with permissions
   * ONLY for staff to view their own profile - do NOT use for admin viewing staff profiles
   * For admin viewing staff profiles, use getById(id) instead
   */
  getProfile: async (): Promise<StaffAccount> => {
    const response = await axiosInstance.get<any>("/staff-accounts/profile");
    const data = response.data;

    if (data?.data?.staffAccount) {
      return data.data.staffAccount as StaffAccount;
    }
    if (data?.staffAccount) {
      return data.staffAccount as StaffAccount;
    }
    return (data?.data || data) as StaffAccount;
  },

  /**
   * Change staff account password
   * Can be used without authentication for first login (when mustChangePassword=true) by providing email
   * For authenticated users, provide accountId (from token) instead of email
   */
  changePassword: async (data: {
    email?: string;
    accountId?: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    await axiosInstance.post("/staff-accounts/change-password", data);
  },
};

// ==================== Permissions API ====================

export const permissionsApi = {
  /**
   * Get all permissions (Admin only)
   */
  getAll: async (): Promise<Permission[]> => {
    const response = await axiosInstance.get<any>("/permissions");
    const data = response.data;

    if (Array.isArray(data?.data?.permissions)) {
      return data.data.permissions as Permission[];
    }
    if (Array.isArray(data?.permissions)) {
      return data.permissions as Permission[];
    }
    if (Array.isArray(data?.data)) {
      return data.data as Permission[];
    }
    return [];
  },
};

// ==================== Export All APIs ====================

const api = {
  auth: authApi,
  products: productsApi,
  cart: cartApi,
  orders: ordersApi,
  staff: staffApi,
  departments: departmentsApi,
  inventory: inventoryApi,
  staffAccounts: staffAccountsApi,
  permissions: permissionsApi,
   payments: paymentsApi,
};

export default api;
