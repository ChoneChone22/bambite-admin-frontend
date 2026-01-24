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
  PaymentSummary,
  PaymentSummaryFilters,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryFilters,
  Option,
  CreateOptionRequest,
  UpdateOptionRequest,
  PlaceTag,
  CreatePlaceTagRequest,
  UpdatePlaceTagRequest,
  PlaceTagFilters,
  JobPost,
  CreateJobPostRequest,
  UpdateJobPostRequest,
  JobPostFilters,
  JobApplication,
  CreateJobApplicationRequest,
  UpdateJobApplicationStatusRequest,
  SendEmailToApplicantRequest,
  JobApplicationFilters,
  Interview,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  InterviewFilters,
  Contact,
  CreateContactRequest,
  ContactFilters,
  ContactReason,
  PaginationParams,
  GuestTokenResponse,
  BillingAddress,
  BillingAddressListResponse,
  BillingAddressPrefillResponse,
  CreateBillingAddressRequest,
  UpdateBillingAddressRequest,
  Favourite,
  FavouriteCheckResponse,
  FavouritesListResponse,
  Review,
  ProductReviewsResponse,
  ReviewPrefillResponse,
  CreateReviewRequest,
  ReviewFilters,
  UpdateReviewStatusRequest,
  ReviewStatus,
  ReviewSortBy,
  FAQ,
  FAQsListResponse,
  CreateFAQRequest,
  UpdateFAQRequest,
  UpdateFAQOrderRequest,
  FAQFilters,
  Theme,
  ThemesListResponse,
  SelectedThemeResponse,
  CreateThemeRequest,
  UpdateThemeRequest,
  Animation,
  AnimationsListResponse,
  SelectedAnimationResponse,
  CreateAnimationRequest,
  UpdateAnimationRequest,
  AnimationTriggerResponse,
  UpdateAnimationTriggerRequest,
} from "@/src/types/api";

// ==================== Auth API ====================

export const authApi = {
      /**
       * Login user
       * Backend supports both authentication methods:
       * 1. Cookies (Priority 1 - Chrome): Sets role-specific cookies (accessToken_user, refreshToken_user)
       * 2. Authorization header (Priority 2 - Safari/iOS): Returns tokens in response body
       * Response includes: { tokens: { accessToken, refreshToken }, user: {...} }
       * Multiple simultaneous logins are supported - user cookies won't interfere with admin/staff cookies
       */
      login: async (data: LoginRequest, guestToken?: string): Promise<AuthResponse> => {
        const requestData: any = { ...data };
        if (guestToken) {
          requestData.guestToken = guestToken; // Merge guest cart/orders on login
        }
        
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
          "/auth/user/login",
          requestData
        );
        // Backend returns tokens in response body (for Safari/iOS) and sets cookies (for Chrome)
        const authData = response.data.data;
        
        // Store tokens in localStorage for Safari/iOS compatibility
        if (authData.tokens?.accessToken) {
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken_user", authData.tokens.accessToken);
            localStorage.setItem("refreshToken_user", authData.tokens.refreshToken);
          }
        }
        
        return authData;
      },

  /**
   * Register new user
   * Supports guest token to merge cart/orders
   */
  register: async (data: RegisterRequest, guestToken?: string): Promise<AuthResponse> => {
    const requestData: any = { ...data };
    if (guestToken) {
      requestData.guestToken = guestToken; // Merge guest cart/orders on register
    }
    
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/user/register",
      requestData
    );
    const authData = response.data.data;
    
    // Store tokens in localStorage for Safari/iOS compatibility
    if (authData.tokens?.accessToken) {
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken_user", authData.tokens.accessToken);
        localStorage.setItem("refreshToken_user", authData.tokens.refreshToken);
      }
    }
    
    return authData;
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
       * Backend supports both authentication methods:
       * 1. Cookies (Priority 1 - Chrome): Backend reads from role-specific httpOnly cookie
       * 2. Authorization header with refreshToken in body (Priority 2 - Safari/iOS)
       * Backend returns tokens in response body: { tokens: { accessToken, refreshToken } }
       * Tokens are also set in cookies (for Chrome compatibility)
       */
      refreshToken: async (refreshToken?: string): Promise<AuthResponse> => {
        // If refreshToken provided, use it (Safari/iOS fallback)
        // Otherwise, backend reads from role-specific httpOnly cookie (Chrome)
        // Backend automatically detects which method to use
        const body = refreshToken ? { refreshToken } : {};
        const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
          "/auth/refresh",
          body
        );
        // Backend returns tokens in response body (for Safari/iOS) and sets cookies (for Chrome)
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
        
        // Clear tokens from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken_user");
          localStorage.removeItem("refreshToken_user");
          localStorage.removeItem("accessToken_admin");
          localStorage.removeItem("refreshToken_admin");
          localStorage.removeItem("accessToken_staff");
          localStorage.removeItem("refreshToken_staff");
        }
      },

  /**
   * Get user profile
   */
  getUserProfile: async (): Promise<User> => {
    const response = await axiosInstance.get<ApiResponse<{ user: User }>>(
      "/auth/user/profile"
    );
    return response.data.data?.user || response.data.data || response.data;
  },

  /**
   * Upload user profile image
   */
  uploadProfileImage: async (image: File): Promise<{ profileImageUrl: string }> => {
    const formData = new FormData();
    formData.append("image", image);

    const response = await axiosInstance.put<ApiResponse<{ profileImageUrl: string }>>(
      "/auth/user/profile/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data || response.data;
  },

  /**
   * Delete user profile image
   */
  deleteProfileImage: async (): Promise<void> => {
    await axiosInstance.delete("/auth/user/profile/image");
  },

  /**
   * Admin login
   * Backend supports both authentication methods:
   * 1. Cookies (Priority 1 - Chrome): Sets role-specific cookies (accessToken_admin, refreshToken_admin)
   * 2. Authorization header (Priority 2 - Safari/iOS): Returns tokens in response body
   * Response includes: { tokens: { accessToken, refreshToken }, admin: {...} }
   * Multiple simultaneous logins are supported - admin cookies won't interfere with staff/user cookies
   */
  adminLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/auth/admin/login",
      data
    );
    // Backend returns tokens in response body (for Safari/iOS) and sets cookies (for Chrome)
    const authData = response.data.data;
    
    // Store tokens in localStorage for Safari/iOS compatibility
    if (authData.tokens?.accessToken) {
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken_admin", authData.tokens.accessToken);
        localStorage.setItem("refreshToken_admin", authData.tokens.refreshToken);
      }
    }
    
    return authData;
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
   * Backend supports both authentication methods:
   * 1. Cookies (Priority 1 - Chrome): Sets role-specific cookies (accessToken_staff, refreshToken_staff)
   * 2. Authorization header (Priority 2 - Safari/iOS): Returns tokens in response body
   * Response includes: { tokens: { accessToken, refreshToken }, staffAccount: {...} }
   * Multiple simultaneous logins are supported - staff cookies won't interfere with admin/user cookies
   * To verify cookies: Check DevTools → Application → Cookies → http://localhost:3000
   */
  staffLogin: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
      "/staff-accounts/login",
      data
      // withCredentials is already set at instance level (axios.ts)
      // This ensures cookies are sent/received automatically (for Chrome)
    );
    
    // Backend returns tokens in response body (for Safari/iOS) and sets cookies (for Chrome)
    const authData = response.data.data;
    
    // Store tokens in localStorage for Safari/iOS compatibility
    if (authData.tokens?.accessToken) {
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken_staff", authData.tokens.accessToken);
        localStorage.setItem("refreshToken_staff", authData.tokens.refreshToken);
      }
    }
    
    return authData;
  },

  /**
   * Logout from all devices
   * Revokes all refresh tokens for the authenticated user/admin/staff
   */
  logoutAll: async (): Promise<void> => {
    await axiosInstance.post("/auth/logout-all", {});
  },
};

// ==================== Categories API ====================

export const categoriesApi = {
  /**
   * Get active categories (Public - for dropdowns)
   */
  getActive: async (): Promise<Category[]> => {
    const response = await axiosInstance.get<ApiResponse<Category[]>>(
      "/categories/active"
    );
    return response.data.data || [];
  },

  /**
   * Get all categories (Admin)
   */
  getAll: async (filters?: CategoryFilters): Promise<Category[]> => {
    const response = await axiosInstance.get<ApiResponse<Category[]>>(
      "/categories",
      { params: filters }
    );
    return response.data.data || [];
  },

  /**
   * Get category by ID (Admin)
   */
  getById: async (id: string): Promise<Category> => {
    const response = await axiosInstance.get<ApiResponse<Category>>(
      `/categories/${id}`
    );
    return response.data.data;
  },

  /**
   * Create category (Admin)
   */
  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await axiosInstance.post<ApiResponse<Category>>(
      "/categories",
      data
    );
    return response.data.data;
  },

  /**
   * Update category (Admin)
   */
  update: async (
    id: string,
    data: UpdateCategoryRequest
  ): Promise<Category> => {
    const response = await axiosInstance.put<ApiResponse<Category>>(
      `/categories/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Update category status only (Admin)
   */
  updateStatus: async (
    id: string,
    status: "active" | "inactive"
  ): Promise<Category> => {
    const response = await axiosInstance.patch<ApiResponse<Category>>(
      `/categories/${id}/status`,
      { status }
    );
    return response.data.data;
  },

  /**
   * Delete category (Admin)
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/categories/${id}`);
  },
};

// ==================== Options API ====================

export const optionsApi = {
  /**
   * Get all options (Admin)
   */
  getAll: async (): Promise<Option[]> => {
    const response = await axiosInstance.get<ApiResponse<Option[]>>("/options");
    return response.data.data || [];
  },

  /**
   * Get option by ID (Admin)
   */
  getById: async (id: string): Promise<Option> => {
    const response = await axiosInstance.get<ApiResponse<Option>>(
      `/options/${id}`
    );
    return response.data.data;
  },

  /**
   * Create option (Admin)
   */
  create: async (data: CreateOptionRequest): Promise<Option> => {
    const response = await axiosInstance.post<ApiResponse<Option>>(
      "/options",
      data
    );
    return response.data.data;
  },

  /**
   * Update option (Admin)
   */
  update: async (
    id: string,
    data: UpdateOptionRequest
  ): Promise<Option> => {
    const response = await axiosInstance.put<ApiResponse<Option>>(
      `/options/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete option (Admin)
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/options/${id}`);
  },
};

// ==================== Products API ====================

export const productsApi = {
  /**
   * Get all products with filters and pagination
   */
  getAll: async (filters?: ProductFilters): Promise<{
    data: Product[];
    meta?: {
      page: number;
      limit: number;
      total: number;
    };
  }> => {
    const response = await axiosInstance.get<any>("/products", {
      params: filters,
    });
    
    // Handle paginated response
    if (response.data?.data && Array.isArray(response.data.data)) {
      return {
        data: response.data.data,
        meta: response.data.meta,
      };
    }
    
    // Handle non-paginated response
    return {
      data: Array.isArray(response.data) ? response.data : response.data.data || [],
    };
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
   * Create new product with images (Admin only)
   * Uses multipart/form-data for image uploads
   */
  create: async (data: CreateProductRequest): Promise<Product> => {
    const formData = new FormData();
    
    // Add text fields
    formData.append("name", data.name);
    formData.append("categoryId", data.categoryId);
    formData.append("price", data.price.toString());
    formData.append("stockQuantity", data.stockQuantity.toString());
    
    // Add optional fields
    if (data.thaiName) {
      formData.append("thaiName", data.thaiName);
    }
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.ingredients) {
      formData.append("ingredients", data.ingredients);
    }
    
    // Add optionIds as array
    if (data.optionIds && data.optionIds.length > 0) {
      data.optionIds.forEach((id) => {
        formData.append("optionIds[]", id);
      });
    }
    
    // Add image files (required, at least 1)
    data.images.forEach((file) => {
      formData.append("images", file);
    });
    
    const response = await axiosInstance.post<ApiResponse<Product>>(
      "/products",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  /**
   * Update product with optional images (Admin only)
   * Uses multipart/form-data for image uploads
   * Supports: adding new images, removing specific images, replacing all images
   */
  update: async (
    id: string,
    data: UpdateProductRequest
  ): Promise<Product> => {
    const formData = new FormData();
    
    // Add text fields if provided
    if (data.name) formData.append("name", data.name);
    if (data.thaiName) {
      formData.append("thaiName", data.thaiName);
    }
    if (data.categoryId) formData.append("categoryId", data.categoryId);
    if (data.price !== undefined) {
      formData.append("price", data.price.toString());
    }
    if (data.stockQuantity !== undefined) {
      formData.append("stockQuantity", data.stockQuantity.toString());
    }
    if (data.description) {
      formData.append("description", data.description);
    }
    if (data.ingredients) {
      formData.append("ingredients", data.ingredients);
    }
    
    // Add optionIds as array if provided
    if (data.optionIds) {
      data.optionIds.forEach((id) => {
        formData.append("optionIds[]", id);
      });
    }
    
    // Add new image files if provided
    if (data.images && data.images.length > 0) {
      data.images.forEach((file) => {
        formData.append("images", file);
      });
    }
    
    // Add removeImageUrls if provided (array of URLs to remove)
    if (data.removeImageUrls && data.removeImageUrls.length > 0) {
      formData.append("removeImageUrls", JSON.stringify(data.removeImageUrls));
    }
    
    // Add imageUrls if provided (final list of URLs to keep)
    if (data.imageUrls && data.imageUrls.length > 0) {
      formData.append("imageUrls", JSON.stringify(data.imageUrls));
    }
    
    // Build URL with query params for deleteOldImages
    let url = `/products/${id}`;
    if (data.deleteOldImages !== undefined) {
      url += `?deleteOldImages=${data.deleteOldImages}`;
    }
    
    const response = await axiosInstance.put<ApiResponse<Product>>(
      url,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
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
   * Get user's cart (supports guest tokens)
   */
  get: async (guestToken?: string): Promise<{ items: CartItem[]; totalItems: number; totalPrice: number; guestToken?: string }> => {
    const headers: any = {};
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    
    const response = await axiosInstance.get<
      ApiResponse<{ items: CartItem[]; totalItems: number; totalPrice: number } & GuestTokenResponse>
    >("/cart", { headers });
    
    const data = response.data.data || response.data;
    return {
      items: data.items || [],
      totalItems: data.totalItems || 0,
      totalPrice: data.totalPrice || 0,
      guestToken: data.guestToken,
    };
  },

  /**
   * Get cart item count (supports guest tokens)
   */
  getCount: async (guestToken?: string): Promise<number> => {
    const headers: any = {};
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    
    const response = await axiosInstance.get<ApiResponse<{ count: number }>>(
      "/cart/count",
      { headers }
    );
    return response.data.data.count;
  },

  /**
   * Add item to cart (supports guest tokens)
   * Returns guestToken if provided or created
   */
  addItem: async (data: AddToCartRequest, guestToken?: string): Promise<CartItem & GuestTokenResponse> => {
    const headers: any = {};
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    
    const response = await axiosInstance.post<ApiResponse<CartItem & GuestTokenResponse>>(
      "/cart/items",
      data,
      { headers }
    );
    return response.data.data;
  },

  /**
   * Update cart item quantity (supports guest tokens)
   */
  updateItem: async (
    productId: string,
    data: UpdateCartItemRequest,
    guestToken?: string
  ): Promise<CartItem> => {
    const headers: any = {};
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    
    const response = await axiosInstance.put<ApiResponse<CartItem>>(
      `/cart/items/${productId}`,
      data,
      { headers }
    );
    return response.data.data;
  },

  /**
   * Remove item from cart (supports guest tokens)
   */
  removeItem: async (productId: string, guestToken?: string): Promise<void> => {
    const headers: any = {};
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    
    await axiosInstance.delete(`/cart/items/${productId}`, { headers });
  },

  /**
   * Clear entire cart (supports guest tokens)
   */
  clear: async (guestToken?: string): Promise<void> => {
    const headers: any = {};
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    
    await axiosInstance.delete("/cart", { headers });
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
   * Supports guest users with guestToken, email, phoneNumber, and billingAddress
   */
  create: async (data: CreateOrderRequest, guestToken?: string): Promise<Order> => {
    const headers: any = {};
    if (guestToken) {
      headers["X-Guest-Token"] = guestToken;
    }
    
    const response = await axiosInstance.post<ApiResponse<Order>>(
      "/orders",
      data,
      { headers }
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
   * Get payment summary (Admin or Staff with staff_payment_management permission)
   * @param filters Optional filters: staffId, startDate, endDate
   * - If no filters: Returns summary for all staff
   * - If staffId provided: Returns summary for specific staff member
   * - If date range provided: Filters payments within date range
   */
  getSummary: async (filters?: PaymentSummaryFilters): Promise<PaymentSummary> => {
    const response = await axiosInstance.get<ApiResponse<PaymentSummary>>(
      "/payments/summary",
      { params: filters }
    );
    
    // Handle different response structures
    // API returns: { data: { summary: { totalPayments, totalAmount, ... } }, status: "success" }
    let data: any = response.data;
    if (data?.data) {
      data = data.data;
    }
    
    // Check if summary is nested under 'summary' property
    const summaryData = data?.summary || data;
    
    // Ensure all numeric fields are numbers (API might return strings)
    const summary: PaymentSummary = {
      totalPayments: typeof summaryData?.totalPayments === "string" 
        ? parseInt(summaryData.totalPayments, 10) 
        : (summaryData?.totalPayments ?? 0),
      totalAmount: typeof summaryData?.totalAmount === "string" 
        ? parseFloat(summaryData.totalAmount) 
        : (summaryData?.totalAmount ?? 0),
      totalBonus: typeof summaryData?.totalBonus === "string" 
        ? parseFloat(summaryData.totalBonus) 
        : (summaryData?.totalBonus ?? 0),
      totalTax: typeof summaryData?.totalTax === "string" 
        ? parseFloat(summaryData.totalTax) 
        : (summaryData?.totalTax ?? 0),
      averagePayment: typeof summaryData?.averagePayment === "string" 
        ? parseFloat(summaryData.averagePayment) 
        : (summaryData?.averagePayment ?? 0),
    };
    
    return summary;
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

// ==================== Place Tags API ====================

export const placeTagsApi = {
  /**
   * Get all place tags
   */
  getAll: async (filters?: PlaceTagFilters): Promise<PlaceTag[]> => {
    const response = await axiosInstance.get<ApiResponse<PlaceTag[]>>(
      "/place-tags",
      { params: filters }
    );
    return response.data.data || [];
  },

  /**
   * Get active place tags only
   */
  getActive: async (): Promise<PlaceTag[]> => {
    const response = await axiosInstance.get<ApiResponse<PlaceTag[]>>(
      "/place-tags/active"
    );
    return response.data.data || [];
  },

  /**
   * Get place tag by ID
   */
  getById: async (id: string): Promise<PlaceTag> => {
    const response = await axiosInstance.get<ApiResponse<PlaceTag>>(
      `/place-tags/${id}`
    );
    return response.data.data || response.data;
  },

  /**
   * Create place tag
   */
  create: async (data: CreatePlaceTagRequest): Promise<PlaceTag> => {
    const response = await axiosInstance.post<ApiResponse<{ placeTag: PlaceTag }>>(
      "/place-tags",
      data
    );
    return response.data.data?.placeTag || response.data.data || response.data;
  },

  /**
   * Update place tag
   */
  update: async (
    id: string,
    data: UpdatePlaceTagRequest
  ): Promise<PlaceTag> => {
    const response = await axiosInstance.put<ApiResponse<PlaceTag>>(
      `/place-tags/${id}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update place tag status
   */
  updateStatus: async (
    id: string,
    status: "active" | "inactive"
  ): Promise<PlaceTag> => {
    const response = await axiosInstance.patch<ApiResponse<PlaceTag>>(
      `/place-tags/${id}/status`,
      { status }
    );
    return response.data.data || response.data;
  },

  /**
   * Delete place tag
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/place-tags/${id}`);
  },
};

// ==================== Job Posts API ====================

export const jobPostsApi = {
  /**
   * Get all job posts
   */
  getAll: async (filters?: JobPostFilters): Promise<JobPost[]> => {
    const response = await axiosInstance.get<ApiResponse<JobPost[]>>(
      "/job-posts",
      { params: filters }
    );
    return response.data.data || [];
  },

  /**
   * Get job post by ID
   */
  getById: async (id: string): Promise<JobPost> => {
    const response = await axiosInstance.get<ApiResponse<JobPost>>(
      `/job-posts/${id}`
    );
    return response.data.data || response.data;
  },

  /**
   * Create job post
   */
  create: async (data: CreateJobPostRequest): Promise<JobPost> => {
    const response = await axiosInstance.post<ApiResponse<{ jobPost: JobPost }>>(
      "/job-posts",
      data
    );
    return response.data.data?.jobPost || response.data.data || response.data;
  },

  /**
   * Update job post
   */
  update: async (
    id: string,
    data: UpdateJobPostRequest
  ): Promise<JobPost> => {
    const response = await axiosInstance.put<ApiResponse<JobPost>>(
      `/job-posts/${id}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete job post
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/job-posts/${id}`);
  },
};

// ==================== Job Applications API ====================

export const jobApplicationsApi = {
  /**
   * Get all job applications
   */
  getAll: async (filters?: JobApplicationFilters): Promise<JobApplication[]> => {
    const response = await axiosInstance.get<ApiResponse<JobApplication[]>>(
      "/apply-jobs",
      { params: filters }
    );
    return response.data.data || [];
  },

  /**
   * Get job application by ID
   */
  getById: async (id: string): Promise<JobApplication> => {
    const response = await axiosInstance.get<any>(`/apply-jobs/${id}`);
    const data = response.data;

    // Handle different response structures
    if (data?.data?.application) {
      return data.data.application as JobApplication;
    }
    if (data?.application) {
      return data.application as JobApplication;
    }
    if (data?.data) {
      return data.data as JobApplication;
    }
    return data as JobApplication;
  },

  /**
   * Create job application (public endpoint)
   */
  create: async (data: CreateJobApplicationRequest): Promise<JobApplication> => {
    const formData = new FormData();
    formData.append("jobPostId", data.jobPostId);
    formData.append("name", data.name);
    formData.append("email", data.email);
    if (data.joiningReason) {
      formData.append("joiningReason", data.joiningReason);
    }
    if (data.additionalQuestion) {
      formData.append("additionalQuestion", data.additionalQuestion);
    }
    if (data.coverLetter) {
      formData.append("coverLetter", data.coverLetter);
    }
    if (data.uploadedFile) {
      formData.append("uploadedFile", data.uploadedFile);
    }

    const response = await axiosInstance.post<ApiResponse<{ application: JobApplication }>>(
      "/apply-jobs",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data?.application || response.data.data || response.data;
  },

  /**
   * Update job application status
   */
  updateStatus: async (
    id: string,
    data: UpdateJobApplicationStatusRequest
  ): Promise<JobApplication> => {
    const response = await axiosInstance.patch<ApiResponse<JobApplication>>(
      `/apply-jobs/${id}/status`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Send email to applicant
   */
  sendEmail: async (
    id: string,
    data: SendEmailToApplicantRequest
  ): Promise<void> => {
    await axiosInstance.post(`/apply-jobs/${id}/send-email`, data);
  },

  /**
   * Delete job application
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/apply-jobs/${id}`);
  },
};

// ==================== Interviews API ====================

export const interviewsApi = {
  /**
   * Get all interviews
   */
  getAll: async (filters?: InterviewFilters): Promise<Interview[]> => {
    const response = await axiosInstance.get<ApiResponse<Interview[]>>(
      "/interviews",
      { params: filters }
    );
    return response.data.data || [];
  },

  /**
   * Get interview by ID
   */
  getById: async (id: string): Promise<Interview> => {
    const response = await axiosInstance.get<ApiResponse<Interview>>(
      `/interviews/${id}`
    );
    return response.data.data || response.data;
  },

  /**
   * Get interview by apply job ID
   */
  getByApplyJobId: async (applyJobId: string): Promise<Interview | null> => {
    try {
      const response = await axiosInstance.get<ApiResponse<Interview>>(
        `/interviews/by-apply-job/${applyJobId}`
      );
      return response.data.data || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create interview
   */
  create: async (data: CreateInterviewRequest): Promise<Interview> => {
    const response = await axiosInstance.post<ApiResponse<{ interview: Interview }>>(
      "/interviews",
      data
    );
    return response.data.data?.interview || response.data.data || response.data;
  },

  /**
   * Update interview
   */
  update: async (
    id: string,
    data: UpdateInterviewRequest
  ): Promise<Interview> => {
    const response = await axiosInstance.put<ApiResponse<Interview>>(
      `/interviews/${id}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete interview
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/interviews/${id}`);
  },
};

// ==================== Contacts API ====================

export const contactsApi = {
  /**
   * Get all contacts
   */
  getAll: async (filters?: ContactFilters): Promise<Contact[]> => {
    const response = await axiosInstance.get<ApiResponse<Contact[]>>(
      "/contacts",
      { params: filters }
    );
    return response.data.data || [];
  },

  /**
   * Get contact by ID
   */
  getById: async (id: string): Promise<Contact> => {
    const response = await axiosInstance.get<any>(
      `/contacts/${id}`
    );
    const data = response.data;
    // Handle various response structures
    if (data?.data?.contact) {
      return data.data.contact as Contact;
    }
    if ((data as any)?.contact) {
      return (data as any).contact as Contact;
    }
    if (data?.data) {
      return data.data as Contact;
    }
    return data as Contact;
  },

  /**
   * Create contact (public endpoint)
   */
  create: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await axiosInstance.post<ApiResponse<{ contact: Contact }>>(
      "/contacts",
      data
    );
    return response.data.data?.contact || response.data.data || response.data;
  },

  /**
   * Delete contact
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/contacts/${id}`);
  },
};

// ==================== Billing Addresses API ====================

export const billingAddressesApi = {
  /**
   * Get all billing addresses
   */
  getAll: async (): Promise<BillingAddressListResponse> => {
    const response = await axiosInstance.get<ApiResponse<BillingAddressListResponse>>(
      "/billing-addresses"
    );
    return response.data.data || response.data;
  },

  /**
   * Get prefill data
   */
  getPrefill: async (): Promise<BillingAddressPrefillResponse> => {
    const response = await axiosInstance.get<ApiResponse<BillingAddressPrefillResponse>>(
      "/billing-addresses/prefill"
    );
    return response.data.data || response.data;
  },

  /**
   * Create billing address
   */
  create: async (data: CreateBillingAddressRequest): Promise<BillingAddress> => {
    const response = await axiosInstance.post<ApiResponse<BillingAddress>>(
      "/billing-addresses",
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update billing address
   */
  update: async (
    id: string,
    data: UpdateBillingAddressRequest
  ): Promise<BillingAddress> => {
    const response = await axiosInstance.put<ApiResponse<BillingAddress>>(
      `/billing-addresses/${id}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete billing address
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/billing-addresses/${id}`);
  },

  /**
   * Set default address
   */
  setDefault: async (id: string): Promise<BillingAddress> => {
    const response = await axiosInstance.patch<ApiResponse<BillingAddress>>(
      `/billing-addresses/${id}/default`
    );
    return response.data.data || response.data;
  },
};

// ==================== Favourites API ====================

export const favouritesApi = {
  /**
   * Get user's favourites
   */
  getAll: async (params?: PaginationParams): Promise<FavouritesListResponse> => {
    const response = await axiosInstance.get<ApiResponse<FavouritesListResponse>>(
      "/favourites",
      { params }
    );
    return response.data.data || response.data;
  },

  /**
   * Add to favourites
   */
  add: async (productId: string): Promise<Favourite> => {
    const response = await axiosInstance.post<ApiResponse<Favourite>>(
      "/favourites",
      { productId }
    );
    return response.data.data || response.data;
  },

  /**
   * Remove from favourites
   */
  remove: async (productId: string): Promise<void> => {
    await axiosInstance.delete(`/favourites/${productId}`);
  },

  /**
   * Check if product is favorited
   */
  check: async (productId: string): Promise<FavouriteCheckResponse> => {
    const response = await axiosInstance.get<ApiResponse<FavouriteCheckResponse>>(
      `/favourites/check/${productId}`
    );
    return response.data.data || response.data;
  },
};

// ==================== Reviews API ====================

export const reviewsApi = {
  /**
   * Get reviews for product
   */
  getByProduct: async (
    productId: string,
    filters?: ReviewFilters
  ): Promise<ProductReviewsResponse> => {
    const response = await axiosInstance.get<ApiResponse<ProductReviewsResponse>>(
      `/reviews/product/${productId}`,
      { params: filters }
    );
    return response.data.data || response.data;
  },

  /**
   * Get prefill data
   */
  getPrefill: async (productId: string, guestEmail?: string): Promise<ReviewPrefillResponse> => {
    const response = await axiosInstance.get<ApiResponse<ReviewPrefillResponse>>(
      "/reviews/prefill",
      { params: { productId, guestEmail } }
    );
    return response.data.data || response.data;
  },

  /**
   * Create review
   */
  create: async (data: CreateReviewRequest): Promise<Review> => {
    const response = await axiosInstance.post<ApiResponse<Review>>(
      "/reviews",
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Vote helpful
   */
  voteHelpful: async (id: string): Promise<Review> => {
    const response = await axiosInstance.post<ApiResponse<Review>>(
      `/reviews/${id}/helpful`
    );
    return response.data.data || response.data;
  },

  /**
   * Get all reviews (admin)
   */
  getAll: async (filters?: ReviewFilters & PaginationParams): Promise<Review[]> => {
    const response = await axiosInstance.get<ApiResponse<Review[]>>(
      "/reviews/admin/all",
      { params: filters }
    );
    return response.data.data || [];
  },

  /**
   * Update review status (admin)
   */
  updateStatus: async (
    id: string,
    data: UpdateReviewStatusRequest
  ): Promise<Review> => {
    const response = await axiosInstance.patch<ApiResponse<Review>>(
      `/reviews/admin/${id}/status`,
      data
    );
    return response.data.data || response.data;
  },
};

// ==================== FAQs API ====================

export const faqsApi = {
  /**
   * Get all FAQs
   */
  getAll: async (filters?: FAQFilters): Promise<FAQsListResponse> => {
    const response = await axiosInstance.get<ApiResponse<FAQsListResponse>>(
      "/faqs",
      { params: filters }
    );
    return response.data.data || response.data;
  },

  /**
   * Get FAQ by ID
   */
  getById: async (id: string): Promise<FAQ> => {
    const response = await axiosInstance.get<ApiResponse<FAQ>>(
      `/faqs/${id}`
    );
    return response.data.data || response.data;
  },

  /**
   * Create FAQ
   */
  create: async (data: CreateFAQRequest): Promise<FAQ> => {
    const response = await axiosInstance.post<ApiResponse<FAQ>>(
      "/faqs",
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update FAQ
   */
  update: async (id: string, data: UpdateFAQRequest): Promise<FAQ> => {
    const response = await axiosInstance.put<ApiResponse<FAQ>>(
      `/faqs/${id}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update FAQ order
   */
  updateOrder: async (id: string, data: UpdateFAQOrderRequest): Promise<FAQ> => {
    const response = await axiosInstance.patch<ApiResponse<FAQ>>(
      `/faqs/${id}/order`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Toggle FAQ status
   */
  toggleStatus: async (id: string, isActive: boolean): Promise<FAQ> => {
    const response = await axiosInstance.patch<ApiResponse<FAQ>>(
      `/faqs/${id}/status`,
      { isActive }
    );
    return response.data.data || response.data;
  },

  /**
   * Delete FAQ
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/faqs/${id}`);
  },
};

// ==================== Themes API ====================

export const themesApi = {
  /**
   * Get all themes
   */
  getAll: async (): Promise<ThemesListResponse> => {
    const response = await axiosInstance.get<ApiResponse<ThemesListResponse>>(
      "/themes"
    );
    return response.data.data || response.data;
  },

  /**
   * Get selected theme
   */
  getSelected: async (): Promise<SelectedThemeResponse> => {
    const response = await axiosInstance.get<ApiResponse<SelectedThemeResponse>>(
      "/themes/selected"
    );
    return response.data.data || response.data;
  },

  /**
   * Create theme
   */
  create: async (data: CreateThemeRequest): Promise<Theme> => {
    const response = await axiosInstance.post<ApiResponse<Theme>>(
      "/themes",
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update theme
   */
  update: async (id: string, data: UpdateThemeRequest): Promise<Theme> => {
    const response = await axiosInstance.put<ApiResponse<Theme>>(
      `/themes/${id}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Select theme
   */
  select: async (id: string): Promise<Theme> => {
    const response = await axiosInstance.patch<ApiResponse<Theme>>(
      `/themes/${id}/select`
    );
    return response.data.data || response.data;
  },

  /**
   * Unselect theme
   */
  unselect: async (id: string): Promise<Theme> => {
    const response = await axiosInstance.patch<ApiResponse<Theme>>(
      `/themes/${id}/unselect`
    );
    return response.data.data || response.data;
  },

  /**
   * Delete theme
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/themes/${id}`);
  },
};

// ==================== Animations API ====================

export const animationsApi = {
  /**
   * Get all animations
   */
  getAll: async (): Promise<AnimationsListResponse> => {
    const response = await axiosInstance.get<ApiResponse<AnimationsListResponse>>(
      "/animations"
    );
    return response.data.data || response.data;
  },

  /**
   * Get selected animation
   */
  getSelected: async (): Promise<SelectedAnimationResponse> => {
    const response = await axiosInstance.get<ApiResponse<SelectedAnimationResponse>>(
      "/animations/selected"
    );
    return response.data.data || response.data;
  },

  /**
   * Create animation
   */
  create: async (data: CreateAnimationRequest): Promise<Animation> => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("image", data.image);

    const response = await axiosInstance.post<ApiResponse<Animation>>(
      "/animations",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data || response.data;
  },

  /**
   * Update animation
   */
  update: async (id: string, data: UpdateAnimationRequest): Promise<Animation> => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.image) formData.append("image", data.image);

    const response = await axiosInstance.put<ApiResponse<Animation>>(
      `/animations/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data || response.data;
  },

  /**
   * Select animation
   */
  select: async (id: string): Promise<Animation> => {
    const response = await axiosInstance.patch<ApiResponse<Animation>>(
      `/animations/${id}/select`
    );
    return response.data.data || response.data;
  },

  /**
   * Unselect animation
   */
  unselect: async (id: string): Promise<Animation> => {
    const response = await axiosInstance.patch<ApiResponse<Animation>>(
      `/animations/${id}/unselect`
    );
    return response.data.data || response.data;
  },

  /**
   * Delete animation
   */
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/animations/${id}`);
  },
};

// ==================== Animation Trigger API ====================

export const animationTriggerApi = {
  /**
   * Get trigger state
   */
  get: async (): Promise<AnimationTriggerResponse> => {
    const response = await axiosInstance.get<ApiResponse<AnimationTriggerResponse>>(
      "/animation-trigger"
    );
    return response.data.data || response.data;
  },

  /**
   * Update trigger state
   */
  update: async (data: UpdateAnimationTriggerRequest): Promise<AnimationTriggerResponse> => {
    const response = await axiosInstance.patch<ApiResponse<AnimationTriggerResponse>>(
      "/animation-trigger",
      data
    );
    return response.data.data || response.data;
  },
};

// ==================== Real-Time Polling API ====================

export const realtimeApi = {
  /**
   * Poll order status
   */
  getOrderStatus: async (orderId: string): Promise<Order> => {
    const response = await axiosInstance.get<ApiResponse<Order>>(
      `/realtime/order/${orderId}`
    );
    return response.data.data || response.data;
  },

  /**
   * Poll product inventory
   */
  getProductInventory: async (productId: string): Promise<Product> => {
    const response = await axiosInstance.get<ApiResponse<Product>>(
      `/realtime/product/${productId}/inventory`
    );
    return response.data.data || response.data;
  },

  /**
   * Poll cart updates
   */
  getCart: async (): Promise<{ items: CartItem[]; totalItems: number; totalPrice: number }> => {
    const response = await axiosInstance.get<ApiResponse<{
      items: CartItem[];
      totalItems: number;
      totalPrice: number;
    }>>("/realtime/cart");
    return response.data.data || response.data;
  },

  /**
   * Poll admin orders
   */
  getAdminOrders: async (): Promise<Order[]> => {
    const response = await axiosInstance.get<ApiResponse<Order[]>>(
      "/realtime/admin/orders"
    );
    return response.data.data || [];
  },
};

// ==================== Export All APIs ====================

const api = {
  auth: authApi,
  categories: categoriesApi,
  options: optionsApi,
  products: productsApi,
  cart: cartApi,
  orders: ordersApi,
  staff: staffApi,
  departments: departmentsApi,
  inventory: inventoryApi,
  staffAccounts: staffAccountsApi,
  permissions: permissionsApi,
  payments: paymentsApi,
  placeTags: placeTagsApi,
  jobPosts: jobPostsApi,
  jobApplications: jobApplicationsApi,
  interviews: interviewsApi,
  contacts: contactsApi,
  billingAddresses: billingAddressesApi,
  favourites: favouritesApi,
  reviews: reviewsApi,
  faqs: faqsApi,
  themes: themesApi,
  animations: animationsApi,
  animationTrigger: animationTriggerApi,
  realtime: realtimeApi,
};

export default api;
