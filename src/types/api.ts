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

export interface Staff {
  id: string;
  position: string;
  salary: number;
  overtimePayment: number;
  tax: number;
  netPay: number;
  paymentMethod: PaymentMethod;
  userId?: string;
  user?: User;
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
  position: string;
  salary: number;
  overtimePayment?: number;
  tax?: number;
  paymentMethod: PaymentMethod;
}

export interface UpdateStaffRequest {
  position?: string;
  salary?: number;
  overtimePayment?: number;
  tax?: number;
  paymentMethod?: PaymentMethod;
}

export interface CreateInventoryLogRequest {
  productId: string;
  reason: InventoryReason;
  quantityChange: number;
  notes?: string;
}

// ==================== API Response Types ====================

export interface AuthResponse {
  token: string;
  user: User;
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
