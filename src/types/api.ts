/**
 * API Types for Bambite E-commerce Backend
 * Base URL: http://localhost:3000/api/v1
 */

// ==================== Enums ====================

// ProductCategory enum is deprecated - use Category model instead
// Keeping for backward compatibility during migration
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

// ==================== Category Model ====================

export interface Category {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

// ==================== Option Model ====================

export interface Option {
  id: string;
  name: string; // unique identifier (lowercase, no spaces)
  displayName: string; // user-friendly display name
  optionLists: string[]; // array of option values
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    products: number;
  };
}

// ==================== Product Model ====================

export interface Product {
  id: string;
  name: string;
  thaiName?: string | null; // Thai name (optional)
  description?: string;
  categoryId: string; // Changed from category enum to categoryId UUID
  category?: Category; // Nested category object
  ingredients?: string;
  price: number;
  stockQuantity: number;
  imageUrls?: string[]; // Changed from imageUrl to imageUrls array
  productOptions?: Array<{
    id: string;
    option: Option;
  }>;
  optionIds?: string[]; // Array of option UUIDs
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
  category?: Category; // Category object: { id, name, status } - optional for backward compatibility
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
  product?: Product; // Product includes category as object
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
  thaiName?: string; // Thai name (optional)
  description?: string;
  categoryId: string; // UUID of category
  ingredients?: string;
  price: number;
  stockQuantity: number;
  optionIds?: string[]; // Array of option UUIDs
  images: File[]; // Array of image files (required, at least 1)
}

export interface UpdateProductRequest {
  name?: string;
  thaiName?: string; // Thai name (optional)
  description?: string;
  categoryId?: string; // UUID of category
  ingredients?: string;
  price?: number;
  stockQuantity?: number;
  optionIds?: string[]; // Array of option UUIDs
  images?: File[]; // New images to add
  deleteOldImages?: boolean; // If true, replace all images; if false, add to existing (default: false)
  removeImageUrls?: string[]; // Array of image URLs to remove (NEW)
  imageUrls?: string[]; // Array of image URLs to keep (final list) (NEW)
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
  category?: string; // categoryId (UUID) instead of enum
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== Category API Types ====================

export interface CreateCategoryRequest {
  name: string;
  status?: "active" | "inactive";
}

export interface UpdateCategoryRequest {
  name?: string;
  status?: "active" | "inactive";
}

export interface CategoryFilters {
  status?: "active" | "inactive";
}

// ==================== Option API Types ====================

export interface CreateOptionRequest {
  name: string; // unique identifier (lowercase, no spaces)
  displayName: string; // user-friendly display name
  optionLists: string[]; // array of option values
}

export interface UpdateOptionRequest {
  name?: string;
  displayName?: string;
  optionLists?: string[];
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

// ==================== Place Tag Model ====================

export interface PlaceTag {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    jobPosts: number;
  };
}

export interface CreatePlaceTagRequest {
  name: string;
  status?: "active" | "inactive";
}

export interface UpdatePlaceTagRequest {
  name?: string;
  status?: "active" | "inactive";
}

export interface PlaceTagFilters {
  status?: "active" | "inactive";
}

// ==================== Job Post Model ====================

export interface JobPost {
  id: string;
  title: string;
  placeTagId: string;
  placeTag?: PlaceTag;
  tasks: {
    title: string;
    descriptions: string[];
  };
  requiredQualifications: {
    title: string;
    descriptions: string[];
  };
  jobDetails: {
    workingHours: string;
    contract: boolean;
    salary: string;
    closeDate: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobPostRequest {
  title: string;
  placeTagId: string;
  tasks: {
    title: string;
    descriptions: string[];
  };
  requiredQualifications: {
    title: string;
    descriptions: string[];
  };
  jobDetails: {
    workingHours: string;
    contract: boolean;
    salary: string;
    closeDate: string; // ISO 8601 date string
  };
}

export interface UpdateJobPostRequest {
  title?: string;
  placeTagId?: string;
  tasks?: {
    title: string;
    descriptions: string[];
  };
  requiredQualifications?: {
    title: string;
    descriptions: string[];
  };
  jobDetails?: {
    workingHours?: string;
    contract?: boolean;
    salary?: string;
    closeDate?: string;
  };
}

export interface JobPostFilters {
  placeTagId?: string;
  search?: string;
}

// ==================== Job Application Model ====================

export interface JobApplication {
  id: string;
  jobPostId: string;
  jobPost?: JobPost;
  name: string;
  email: string;
  joiningReason?: string;
  additionalQuestion?: string;
  coverLetter?: string;
  uploadedFileUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobApplicationRequest {
  jobPostId: string;
  name: string;
  email: string;
  joiningReason?: string;
  additionalQuestion?: string;
  coverLetter?: string;
  uploadedFile?: File;
}

export interface UpdateJobApplicationStatusRequest {
  status: "pending" | "approved" | "rejected";
}

export interface SendEmailToApplicantRequest {
  message: string;
  notes?: string;
}

export interface JobApplicationFilters {
  jobPostId?: string;
  status?: "pending" | "approved" | "rejected";
  email?: string;
}

// ==================== Interview Model ====================

export interface Interview {
  id: string;
  applyJobId: string;
  applyJob?: JobApplication;
  meetingUrl: string;
  meetingDate: string; // YYYY-MM-DD format
  meetingTime: string; // HH:MM:SS or HH:MM format (UTC)
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInterviewRequest {
  applyJobId: string;
  meetingUrl: string;
  meetingDate: string; // YYYY-MM-DD format
  meetingTime: string; // HH:MM:SS or HH:MM format (UTC)
  notes?: string;
}

export interface UpdateInterviewRequest {
  meetingUrl?: string;
  meetingDate?: string;
  meetingTime?: string;
  notes?: string;
}

export interface InterviewFilters {
  applyJobId?: string;
  meetingDate?: string; // YYYY-MM-DD format
}

// ==================== Contact Model ====================

export type ContactReason =
  | "general_inquiry"
  | "product_question"
  | "collaboration"
  | "feedback"
  | "other";

export interface Contact {
  id: string;
  name: string;
  email: string;
  reason: ContactReason;
  message: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  reason: ContactReason;
  message: string;
}

export interface ContactFilters {
  reason?: ContactReason;
  email?: string;
}
