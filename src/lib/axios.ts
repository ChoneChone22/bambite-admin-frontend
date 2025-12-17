/**
 * Axios Configuration for Bambite E-commerce API
 * Centralized HTTP client with authentication interceptors
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/src/types/api";

// Base API URL
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Token storage keys
const TOKEN_KEY = "bambite_auth_token";
const USER_KEY = "bambite_user";

/**
 * Create axios instance with default configuration
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor to inject Bearer token
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = getAuthToken();

    // Inject Bearer token if available
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
axiosInstance.interceptors.response.use(
  (response) => {
    // Return the response data directly
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          clearAuth();
          if (typeof window !== "undefined") {
            // Only redirect if not already on an auth page
            const currentPath = window.location.pathname;
            if (
              !["/login", "/register", "/admin/login"].includes(currentPath)
            ) {
              // Redirect to admin login if on admin path, otherwise to user login
              const isAdminPath = currentPath.startsWith("/admin");
              window.location.href = isAdminPath ? "/admin/login" : "/login";
            }
          }
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error("Access forbidden:", data?.message);
          break;
        case 404:
          // Not found
          break;
        case 500:
          // Server error
          console.error("Server error:", data?.message);
          break;
        default:
          break;
      }

      // Return formatted error
      let errorMessage =
        data?.message || data?.error || error.message || "An error occurred";

      // If backend returns HTML error page, try to extract the error message
      const dataAsString = data as unknown as string;
      if (typeof dataAsString === "string" && dataAsString.includes("<html")) {
        const match = dataAsString.match(/Error: ([^<]+)</);
        if (match && match[1]) {
          errorMessage = match[1].trim();
        }
      }

      return Promise.reject({
        message: errorMessage,
        statusCode: status,
        error: data?.error,
      } as ApiError);
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject({
        message: "No response from server. Please check your connection.",
        statusCode: 0,
        error: "NETWORK_ERROR",
      } as ApiError);
    } else {
      // Something happened in setting up the request
      return Promise.reject({
        message: error.message || "Request setup error",
        statusCode: 0,
        error: "REQUEST_ERROR",
      } as ApiError);
    }
  }
);

// ==================== Auth Helper Functions ====================

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set authentication token in localStorage
 */
export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get user data from localStorage
 */
export const getUser = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
};

/**
 * Set user data in localStorage
 */
export const setUser = (user: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, user);
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuth = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// ==================== Export ====================

export default axiosInstance;
export { BASE_URL, TOKEN_KEY, USER_KEY };
