/**
 * Main Types Export
 * Centralized type definitions for the Bambite frontend
 */

export * from "./api";

// ==================== Component Props Types ====================

export interface ProductCardProps {
  product: import("./api").Product;
  onAddToCart?: (productId: string, quantity: number) => void;
}

export interface CartItemProps {
  item: import("./api").CartItem;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
}

export interface OrderCardProps {
  order: import("./api").Order;
  onViewDetails?: (orderId: string) => void;
}

// ==================== Form Types ====================

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  address: string;
}

export interface ProductFormValues {
  name: string;
  category: import("./api").ProductCategory;
  ingredients: string;
  price: number;
  stockQuantity: number;
}

export interface CheckoutFormValues {
  phoneNumber: string;
  address: string;
  notes?: string;
}

// ==================== State Types ====================

export interface AuthState {
  user: import("./api").User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CartState {
  items: import("./api").CartItem[];
  total: number;
  itemCount: number;
}

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

// ==================== Utility Types ====================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

// ==================== Constants ====================

export const PLACEHOLDER_IMAGE = "https://placehold.co/600x400";

export const PRODUCT_CATEGORIES: SelectOption<
  import("./api").ProductCategory
>[] = [
  { label: "Soup", value: "SOUP" as import("./api").ProductCategory },
  { label: "Salad", value: "SALAD" as import("./api").ProductCategory },
  { label: "Noodle", value: "NOODLE" as import("./api").ProductCategory },
  { label: "Snack", value: "SNACK" as import("./api").ProductCategory },
];

export const ORDER_STATUSES: SelectOption<import("./api").OrderStatus>[] = [
  { label: "Pending", value: "PENDING" as import("./api").OrderStatus },
  { label: "Processing", value: "PROCESSING" as import("./api").OrderStatus },
  { label: "Shipped", value: "SHIPPED" as import("./api").OrderStatus },
  { label: "Delivered", value: "DELIVERED" as import("./api").OrderStatus },
  { label: "Cancelled", value: "CANCELLED" as import("./api").OrderStatus },
];
