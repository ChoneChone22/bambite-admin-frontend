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
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  isGuest: boolean;
  guestToken?: string | null;
  expiresAt?: string | null;
  emailVerified: boolean;
  emailVerifiedAt?: string | null;
  role?: UserRole; // For admin/staff authentication (staff.user context), not for customer users
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    orderHistories: number;
    favourites: number;
    reviews: number;
  };
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
  description?: string; // Optional - can be omitted
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
  averageRating?: number; // Cached average rating
  totalReviews?: number; // Cached total review count
  createdAt?: string;
  updatedAt?: string;
}

/** Product option metadata for display (cart/order items) */
export interface ProductOptionDisplay {
  id: string;
  name: string;
  displayName: string;
  optionLists: string[];
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
  /** User's chosen options (optionId -> selected value) */
  selectedOptions?: Record<string, string> | null;
  /** Option metadata for display (Size, Color, etc.) */
  productOptions?: ProductOptionDisplay[];
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
  /** Options the customer chose at order time (optionId -> selected value) */
  selectedOptionsSnapshot?: Record<string, string> | null;
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
  /** Top-level contact from API (order confirmation) */
  email?: string;
  phoneNumber?: string;
  billingRegion?: string | null;
  billingStreetAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostcode?: string | null;
  billingPhone?: string | null;
  billingEmail?: string | null;
  billingAddressId?: string | null;
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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
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
  /** Required for products with options. { optionId: selectedValue } */
  selectedOptions?: Record<string, string>;
}

export interface UpdateCartItemRequest {
  quantity: number;
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

// User Management (Customer accounts only)
export interface UserFilters {
  isGuest?: boolean; // Filter by guest status
  emailVerified?: boolean; // Filter by email verification status
  search?: string; // Search by email, phone, or name
  page?: number;
  limit?: number;
}

export interface CreateUserRequest {
  name?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profileImageUrl?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  // Note: Password updates should use separate change-password endpoint for security
}

export interface UserStats {
  totalUsers: number;
  guestUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
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
  // Tokens object from backend response (for Safari/iOS support)
  // Backend now returns tokens in response body in addition to setting cookies
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  // Legacy token fields (kept for backward compatibility)
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
  details?: any; // Additional error details (e.g., validation errors)
  retryAfter?: number; // Retry after seconds (for rate limiting)
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

export interface PaymentSummaryFilters {
  staffId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface PaymentSummary {
  totalPayments: number; // Total count of paid payments
  totalAmount: number; // Sum of all total payments
  totalBonus: number; // Sum of all bonuses
  totalTax: number; // Sum of all taxes
  averagePayment: number; // Average payment amount
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

// ==================== Guest Token ====================

export interface GuestTokenResponse {
  guestToken: string;
}

// ==================== Billing Address Model ====================

export interface BillingAddress {
  id: string;
  userId?: string;
  user?: User;
  region: string;
  streetAddress: string;
  city: string;
  state: string;
  postcode: string;
  phone?: string;
  email?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingAddressListResponse {
  addresses: BillingAddress[];
  defaultAddress: BillingAddress | null;
  count: number;
  remainingSlots: number;
}

export interface BillingAddressPrefillResponse {
  email: string;
  phone: string;
  addressCount: number;
  remainingSlots: number;
}

export interface CreateBillingAddressRequest {
  region: string;
  streetAddress: string;
  city: string;
  state: string;
  postcode: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

export interface UpdateBillingAddressRequest {
  region?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

// ==================== Favourite Model ====================

export interface Favourite {
  id: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
  createdAt?: string;
}

export interface FavouriteCheckResponse {
  isFavorited: boolean;
  favouriteId: string | null;
}

export interface FavouritesListResponse extends PaginatedResponse<Favourite> {
  favourites: Favourite[];
  total: number;
  page: number;
  limit: number;
}

// ==================== Review Model ====================

export enum ReviewStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum ReviewSortBy {
  NEWEST = "newest",
  HIGHEST = "highest",
  HELPFUL = "helpful",
}

export interface Review {
  id: string;
  productId: string;
  product?: Product;
  userId?: string | null;
  user?: User | null;
  guestName?: string | null;
  guestEmail?: string | null;
  rating: number; // 1-5
  message?: string | null;
  status: ReviewStatus;
  helpfulVotes: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  averageRating: number;
  totalReviews: number;
}

export interface ReviewPrefillResponse {
  name: string;
  email: string;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number; // 1-5, required
  message?: string;
  guestName?: string; // Required for guests
  guestEmail?: string; // Required for guests
}

export interface ReviewFilters extends PaginationParams {
  sortBy?: ReviewSortBy;
  status?: ReviewStatus | "ALL";
}

export interface UpdateReviewStatusRequest {
  status: ReviewStatus.APPROVED | ReviewStatus.REJECTED;
}

// ==================== FAQ Model ====================

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FAQsListResponse {
  faqs: FAQ[];
  total: number;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  isActive?: boolean;
}

export interface UpdateFAQOrderRequest {
  order: number;
}

export interface BulkUpdateFAQOrdersRequest {
  updates: Array<{
    id: string;
    order: number;
  }>;
}

export interface FAQFilters {
  activeOnly?: boolean;
}

// ==================== Theme Model ====================
// Backend theme colors: exactly 5 fields (primary, foreground, background, logo, card).
// Do not use or send: secondary, accent, text.

export interface ThemeColors {
  primary: string;
  foreground: string;
  background: string;
  logo: string;
  card: string;
}

/** Default theme colors for new themes (5-color schema) */
export const DEFAULT_THEME_COLORS: ThemeColors = {
  primary: "#3b82f6",
  foreground: "#0f172a",
  background: "#ffffff",
  logo: "#1e293b",
  card: "#f8fafc",
};

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  selected: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemesListResponse {
  themes: Theme[];
}

export interface SelectedThemeResponse {
  theme: Theme | null;
}

export interface CreateThemeRequest {
  name: string;
  colors: ThemeColors;
}

export interface UpdateThemeRequest {
  name?: string;
  colors?: ThemeColors;
  selected?: boolean;
}

// ==================== Animation Model ====================

export interface Animation {
  id: string;
  name: string;
  imageUrl: string;
  selected: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnimationsListResponse {
  animations: Animation[];
}

export interface SelectedAnimationResponse {
  animation: Animation | null;
}

export interface CreateAnimationRequest {
  name: string;
  image: File;
}

export interface UpdateAnimationRequest {
  name?: string;
  image?: File;
  selected?: boolean;
}

export interface AnimationTriggerResponse {
  enabled: boolean;
}

export interface UpdateAnimationTriggerRequest {
  enabled: boolean;
}

// ==================== Real-Time Updates ====================

export interface OrderUpdateEvent {
  orderId: string;
  status: OrderStatus;
  netPrice: string;
  orderedDate: string;
}

export interface NewOrderEvent {
  id: string;
  userId: string;
  status: OrderStatus;
  netPrice: string;
  orderedDate: string;
  itemCount: number;
}

export interface InventoryUpdateEvent {
  productId: string;
  stockQuantity: number;
  quantityChange: number;
  reason: string;
}

export interface CartUpdateEvent {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// ==================== Updated Order Request ====================

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  /** Required for products with options. { optionId: selectedValue } */
  selectedOptions?: Record<string, string>;
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  email?: string; // Required for guest users
  phoneNumber?: string; // Required for guest users
  billingAddress?: CreateBillingAddressRequest; // Required for guest users
  billingAddressId?: string; // Use saved address
  guestToken?: string; // For guest users
}
