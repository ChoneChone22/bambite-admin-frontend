/**
 * Main Types Export
 * Centralized type definitions for the Bambite frontend
 */

export * from "./api";

// ==================== Component Props Types ====================

// ==================== Form Types ====================

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface ProductFormValues {
  name: string;
  description?: string;
  categoryId: string; // Changed from category enum to categoryId UUID
  ingredients?: string;
  price: number;
  stockQuantity: number;
  optionIds?: string[];
  images?: File[];
}

// ==================== State Types ====================

export interface AuthState {
  user: import("./api").User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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

// PRODUCT_CATEGORIES is deprecated - use dynamic categories from API instead
// Keeping for backward compatibility during migration
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
