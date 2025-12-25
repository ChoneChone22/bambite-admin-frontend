/**
 * API Types for Bambite E-commerce Backend
 * Base URL: http://localhost:3000/api/v1
 */

// ==================== Enums ====================

export enum ProductCategory {
  SOUP = "SOUP",
  SALAD = "SALAD",
  NOODLE = "NOODLE",
  SNACK = "SNACK",
}

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum InventoryReason {
  PURCHASE = "PURCHASE",
  RESTOCK = "RESTOCK",
  DAMAGE = "DAMAGE",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum UserRole {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  STAFF = "STAFF",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CHECK = "CHECK",
}

// ==================== Models ====================

export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  ingredients: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  price: string;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
  category: ProductCategory;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  quantity: number;
  priceAtTime?: string;
  netPrice?: string;
  price?: number;
  product?: Product;
  createdAt?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  orderItems: OrderItem[];
  items?: OrderItem[]; // Alias for compatibility
  netPrice: string;
  total?: number; // Computed value
  userId?: string;
  user?: User;
  orderedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Department model (from Department Management API)
export interface Department {
  id: string;
  name: string;
  shortName: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface Staff {
  id: string;
  // Core HR fields
  employeeId?: string;
  name?: string;
  position: string;
  salary: number;
  totalBonus?: number;
  tax?: number;
  status?: "active" | "on_leave" | "quit";
  // Relations
  departmentId?: string;
  department?: Department;
  userId?: string;
  user?: User;
  // Payroll-calculated fields (legacy / read-only from backend)
  overtimePayment?: number;
  netPay?: number;
  paymentMethod?: PaymentMethod;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  product?: Product;
  reason: InventoryReason;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  notes?: string;
  createdAt?: string;
}

// Staff account & permissions
export interface Permission {
  id: string;
  code: string; // Permission code from database (e.g., "staff_management")
  permName?: string; // Optional permission name (not used for display)
  // staffAccount relation exists in backend but not needed for frontend display
}

export interface StaffAccount {
  id: string;
  email: string;
  isActive?: boolean; // Optional - backend may not return this, use staff?.status instead
  mustChangePassword: boolean;
  staff?: Staff;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  staffId: string;
  staff?: Staff;
  bonus: number;
  tax: number;
  note?: string;
  paymentMethod: "mobile_banking" | "cash";
  paidMonth: string; // YYYY-MM
  isPaid: boolean;
  totalPayment: number;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== API Request Types ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
}

export interface CreateProductRequest {
  name: string;
  category: ProductCategory;
  ingredients: string;
  price: number;
  stockQuantity: number;
}

export interface UpdateProductRequest {
  name?: string;
  category?: ProductCategory;
  ingredients?: string;
  price?: number;
  stockQuantity?: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface CreateStaffRequest {
  name: string;
  position: string;
  salary: number;
  tax?: number;
  totalBonus?: number;
  status?: "active" | "on_leave" | "quit";
  departmentId: string;
}

export interface UpdateStaffRequest {
  name?: string;
  position?: string;
  salary?: number;
  tax?: number;
  totalBonus?: number;
  status?: "active" | "on_leave" | "quit";
  departmentId?: string;
}

export interface CreateInventoryLogRequest {
  productId: string;
  reason: InventoryReason;
  quantityChange: number;
  notes?: string;
}

export interface CreateStaffAccountRequest {
  staffId: string;
  email: string;
  password?: string;
  permissionIds?: string[];
}

export interface UpdateStaffAccountRequest {
  email?: string;
  password?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface CreatePaymentRequest {
  staffId: string;
  bonus?: number;
  tax?: number;
  note?: string;
  paymentMethod?: "mobile_banking" | "cash";
  paidMonth: string; // YYYY-MM
}

export interface UpdatePaymentRequest {
  bonus?: number;
  tax?: number;
  note?: string;
  paymentMethod?: "mobile_banking" | "cash";
  isPaid?: boolean;
}

// ==================== API Response Types ====================

export interface AuthResponse {
  // Tokens are now in httpOnly cookies, not in response body
  // These fields are kept for backward compatibility but may be empty
  accessToken?: string;
  refreshToken?: string;
  // Legacy support - some endpoints might still return 'token'
  token?: string;
  // User login returns 'user'
  user?: User;
  // Admin login returns 'admin'
  admin?: User;
  // Staff account login returns 'staffAccount'
  staffAccount?: StaffAccount;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== Query Parameters ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProductFilters extends PaginationParams {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface OrderFilters extends PaginationParams {
  status?: OrderStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaymentFilters extends PaginationParams {
  paidMonth?: string;
  isPaid?: boolean;
}
