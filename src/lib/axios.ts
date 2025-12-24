/**
 * Axios Configuration for Bambite E-commerce API
 * Production-ready with httpOnly cookie support and automatic token refresh
 * 
 * Security features:
 * - withCredentials: true to send/receive httpOnly cookies
 * - Automatic token refresh on 401 errors
 * - Request queuing during token refresh
 * - Proper error handling and redirects
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/src/types/api";
import { tokenManager } from "./tokenManager";

// Base API URL
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Flag to prevent multiple simultaneous refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Retry the request - cookies will be sent automatically
      prom.resolve(axiosInstance(prom.config));
    }
  });
  failedQueue = [];
};

/**
 * Create axios instance with default configuration
 * withCredentials: true enables httpOnly cookie support
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // CRITICAL: Enable httpOnly cookie support
});

/**
 * Request interceptor
 * Note: Authorization header is optional - cookies are primary auth method
 * Some backends may still accept Bearer tokens as fallback
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip Authorization header for auth endpoints (cookies handle auth)
    const isAuthEndpoint =
      config.url?.includes("/auth/") ||
      config.url?.includes("/staff-accounts/login") ||
      config.url?.includes("/staff-accounts/change-password");

    // For non-auth endpoints, we could add Authorization header as fallback
    // but since we're using httpOnly cookies, it's not necessary
    // The backend will read tokens from cookies automatically

    // Ensure withCredentials is set for all requests (REQUIRED for cookies)
    // This ensures cookies are sent with every request
    config.withCredentials = true;

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

    /**
     * Response interceptor for error handling and automatic token refresh
     */
    axiosInstance.interceptors.response.use(
      (response) => {
        // Note: Set-Cookie headers are NOT accessible to JavaScript (browser security feature)
        // Cookies are automatically set by the browser when Set-Cookie headers are present
        // To verify cookies are set, check:
        // 1. DevTools → Application → Cookies → http://localhost:3000
        // 2. DevTools → Network → Request Headers → Cookie (on subsequent requests)
        if (response.config.url?.includes("/login") || response.config.url?.includes("/staff-accounts/login")) {
          if (response.status === 200 || response.status === 201) {
            console.log("✅ Login successful - cookies should be set automatically by browser");
            console.log("📍 Verify cookies in: DevTools → Application → Cookies → http://localhost:3000");
          }
        }
        return response;
      },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints (login, register, etc.)
      const isAuthEndpoint =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/admin/login") ||
        originalRequest.url?.includes("/auth/admin/register") ||
        originalRequest.url?.includes("/staff-accounts/login") ||
        originalRequest.url?.includes("/staff-accounts/change-password");

      if (isAuthEndpoint) {
        // Auth endpoint failed (login/register failed)
        // Don't redirect - let the login page handle the error
        // The login page will show the error message to the user
        tokenManager.clearUser();
        return Promise.reject(error);
      }

      // Prevent multiple simultaneous refresh attempts
      if (isRefreshing) {
        // Queue this request to retry after refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token - cookies are sent automatically
        // Backend reads refresh token from httpOnly cookie
        // Empty body or no body - backend uses cookie
        // Use axiosInstance instead of axios to ensure withCredentials is set
        const refreshResponse = await axiosInstance.post(
          "/auth/refresh",
          {} // Empty body - refresh token comes from cookie
          // withCredentials is already set at instance level
        );

        // Refresh successful - new tokens are in httpOnly cookies
        // No need to store tokens - they're in cookies

        // Process queued requests
        processQueue(null, null);
        isRefreshing = false;

        // Retry original request - cookies will be sent automatically
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear user data and redirect
        tokenManager.clearUser();
        processQueue(refreshError, null);
        isRefreshing = false;

        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (!["/login", "/register", "/admin/login", "/staff/login"].includes(currentPath)) {
            const isAdminPath = currentPath.startsWith("/admin");
            const isStaffPath = currentPath.startsWith("/staff");
            if (isAdminPath) {
              window.location.href = "/admin/login";
            } else if (isStaffPath) {
              window.location.href = "/staff/login";
            } else {
              window.location.href = "/login";
            }
          }
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other error status codes
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 403:
          console.error("Access forbidden:", data?.message);
          break;
        case 404:
          // Not found - handled by caller
          break;
        case 500:
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

// ==================== Legacy Auth Helper Functions (for backward compatibility) ====================

/**
 * Get authentication token
 * @deprecated Tokens are in httpOnly cookies, cannot be read
 */
export const getAuthToken = (): string | null => {
  return null;
};

/**
 * Set authentication token
 * @deprecated Tokens are set by backend in httpOnly cookies
 */
export const setAuthToken = (token: string): void => {
  // Tokens are in cookies - no action needed
};

/**
 * Get user data
 */
export const getUser = (): string | null => {
  const user = tokenManager.getUser();
  return user ? JSON.stringify(user) : null;
};

/**
 * Set user data
 */
export const setUser = (user: string): void => {
  try {
    const userObj = JSON.parse(user);
    tokenManager.setUser(userObj);
  } catch {
    // Invalid JSON - ignore
  }
};

/**
 * Clear authentication data
 */
export const clearAuth = (): void => {
  tokenManager.clearUser();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return tokenManager.hasUser();
};

// ==================== Export ====================

export default axiosInstance;
export { BASE_URL };
