/**
 * Axios Configuration for Bambite E-commerce API
 * Production-ready with httpOnly cookie support and automatic token refresh
 * 
 * Security features:
 * - withCredentials: true to send/receive httpOnly cookies
 * - Role-specific cookie names (accessToken_user, accessToken_admin, accessToken_staff)
 * - Automatic token refresh on 401 errors
 * - Request queuing during token refresh
 * - Proper error handling and redirects
 * 
 * Cookie Names (set by backend, httpOnly):
 * - User: accessToken_user, refreshToken_user
 * - Admin: accessToken_admin, refreshToken_admin
 * - Staff: accessToken_staff, refreshToken_staff
 * 
 * Note: JavaScript cannot read httpOnly cookies. The browser automatically
 * sends the correct cookies based on the request context. The backend
 * automatically detects which role's cookies to use.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/src/types/api";
import { tokenManager } from "./tokenManager";
import { guestTokenManager } from "./guestTokenManager";
import { showErrorToast } from "./toastManager";

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
 * Adds Authorization header from localStorage for Safari/iOS support
 * Backend supports both methods: Cookies (Priority 1 - Chrome) and Authorization header (Priority 2 - Safari/iOS)
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip Authorization header for auth endpoints (login, register, change-password)
    const isAuthEndpoint =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/admin/login") ||
      config.url?.includes("/staff-accounts/login") ||
      config.url?.includes("/staff-accounts/change-password");

    // For non-auth endpoints, add Authorization header from localStorage (Safari/iOS support)
    // Cookies are still sent automatically (for Chrome compatibility)
    if (!isAuthEndpoint && typeof window !== "undefined") {
      // Check for role-specific tokens (priority order: admin > staff > user)
      let accessToken: string | null = null;
      let guestToken: string | null = null;
      
      // Determine which token to use based on URL path
      if (config.url?.includes("/admin/") || config.url?.includes("/auth/admin/")) {
        accessToken = localStorage.getItem("accessToken_admin");
      } else if (config.url?.includes("/staff") || config.url?.includes("/staff-accounts")) {
        accessToken = localStorage.getItem("accessToken_staff");
      } else {
        accessToken = localStorage.getItem("accessToken_user");
      }
      
      // If no access token, check for guest token
      if (!accessToken) {
        guestToken = guestTokenManager.get();
      }
      
      // Add Authorization header
      if (accessToken && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else if (guestToken && !config.headers.Authorization && !config.headers["X-Guest-Token"]) {
        // Guest token can be sent as Authorization header or X-Guest-Token header
        config.headers.Authorization = `Guest ${guestToken}`;
        config.headers["X-Guest-Token"] = guestToken;
      }
    }

    // Ensure withCredentials is set for all requests (REQUIRED for cookies)
    // This ensures cookies are sent with every request (Chrome compatibility)
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
        // Role-specific cookies are set based on the login endpoint:
        // - /auth/user/login → accessToken_user, refreshToken_user
        // - /auth/admin/login → accessToken_admin, refreshToken_admin
        // - /staff-accounts/login → accessToken_staff, refreshToken_staff
        // To verify cookies are set, check:
        // 1. DevTools → Application → Cookies → http://localhost:3000
        // 2. DevTools → Network → Request Headers → Cookie (on subsequent requests)
        const isLoginEndpoint = 
          response.config.url?.includes("/login") || 
          response.config.url?.includes("/staff-accounts/login") ||
          response.config.url?.includes("/auth/admin/login");
        
        if (isLoginEndpoint) {
          if (response.status === 200 || response.status === 201) {
            console.log("✅ Login successful - role-specific cookies should be set automatically by browser");
            console.log("📍 Verify cookies in: DevTools → Application → Cookies → http://localhost:3000");
            console.log("📍 Cookie names: accessToken_user/admin/staff, refreshToken_user/admin/staff");
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
        originalRequest.url?.includes("/staff-accounts/change-password") ||
        originalRequest.url?.includes("/auth/refresh");

      if (isAuthEndpoint) {
        // Auth endpoint failed (login/register/refresh failed)
        // If it's a refresh endpoint failure, show toast and redirect
        if (originalRequest.url?.includes("/auth/refresh")) {
          // Refresh endpoint failed - tokens are invalid/expired
          const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
          const isAdminPath = currentPath.startsWith("/admin");
          const isStaffPath = currentPath.startsWith("/staff");
          
          tokenManager.clearUser();
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("accessToken_admin");
            localStorage.removeItem("refreshToken_admin");
            localStorage.removeItem("accessToken_staff");
            localStorage.removeItem("refreshToken_staff");
            localStorage.removeItem("accessToken_user");
            localStorage.removeItem("refreshToken_user");
            
            if (!["/login", "/register", "/admin/login", "/staff/login"].includes(currentPath)) {
              showErrorToast("Your session has expired. Please login again.", 5000);
              setTimeout(() => {
                if (isAdminPath) {
                  window.location.href = "/admin/login";
                } else if (isStaffPath) {
                  window.location.href = "/staff/login";
                } else {
                  window.location.href = "/login";
                }
              }, 1000);
            }
          }
        }
        // Don't redirect for other auth endpoints - let the login page handle the error
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
        // Attempt to refresh token
        // Backend supports both methods:
        // 1. Cookies (Priority 1 - Chrome) - sent automatically via withCredentials
        // 2. Authorization header with refreshToken in body (Priority 2 - Safari/iOS)
        const refreshTokenValue = typeof window !== "undefined" 
          ? localStorage.getItem("refreshToken") 
          : null;

        // Try refresh with refreshToken from localStorage (Safari/iOS fallback)
        // Backend will try cookies first, then use body refreshToken if cookies unavailable
        const refreshBody = refreshTokenValue ? { refreshToken: refreshTokenValue } : {};
        
        const refreshResponse = await axiosInstance.post(
          "/auth/refresh",
          refreshBody
          // withCredentials is already set at instance level (for Chrome cookies)
        );

        // Refresh successful - backend returns tokens in response body
        // Store tokens in localStorage for Safari/iOS (Authorization header)
        // Handle both response structures: { data: { tokens: {...} } } or { tokens: {...} }
        const responseData = refreshResponse.data?.data || refreshResponse.data;
        if (responseData?.tokens) {
          const { accessToken, refreshToken } = responseData.tokens;
          if (typeof window !== "undefined" && accessToken && refreshToken) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
          }
        }

        // Backend also sets new cookies (for Chrome compatibility)
        // Both methods now work: cookies (Chrome) and Authorization header (Safari/iOS)

        // Process queued requests
        processQueue(null, null);
        isRefreshing = false;

        // Retry original request with new token in Authorization header
        // Cookies are also sent automatically (Chrome compatibility)
        const newAccessToken = typeof window !== "undefined" 
          ? localStorage.getItem("accessToken") 
          : null;
        if (newAccessToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Get user role before clearing (needed for redirect)
        const userRole = typeof window !== "undefined" 
          ? localStorage.getItem("userRole") 
          : null;
        
        // Refresh failed - clear user data and tokens
        tokenManager.clearUser();
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userRole");
          // Clear role-specific tokens
          localStorage.removeItem("accessToken_admin");
          localStorage.removeItem("refreshToken_admin");
          localStorage.removeItem("accessToken_staff");
          localStorage.removeItem("refreshToken_staff");
          localStorage.removeItem("accessToken_user");
          localStorage.removeItem("refreshToken_user");
        }
        processQueue(refreshError, null);
        isRefreshing = false;

        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (!["/login", "/register", "/admin/login", "/staff/login"].includes(currentPath)) {
            // Determine login page based on current path
            const isAdminPath = currentPath.startsWith("/admin");
            const isStaffPath = currentPath.startsWith("/staff");
            
            // Show toast message
            showErrorToast("Your session has expired. Please login again.", 5000);
            
            // Redirect after a short delay to allow toast to be visible
            setTimeout(() => {
              if (isAdminPath) {
                window.location.href = "/admin/login";
              } else if (isStaffPath) {
                window.location.href = "/staff/login";
              } else {
                // Fallback to userRole or default to login
                const loginPaths: Record<string, string> = {
                  staff: "/staff/login",
                  admin: "/admin/login",
                  user: "/login",
                };
                window.location.href = loginPaths[userRole || ""] || "/login";
              }
            }, 1000);
          }
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other error status codes
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          // Bad Request - Order limits, duplicate orders, etc.
          const errorMessage400 = data?.message || "Bad request";
          const errorDetails = data?.details;
          
          // Check for specific order-related errors
          if (
            errorMessage400.includes("maximum value") ||
            errorMessage400.includes("maximum limit") ||
            errorMessage400.includes("Duplicate order") ||
            errorMessage400.includes("maximum quantity")
          ) {
            console.error("Order validation error", {
              message: errorMessage400,
              details: errorDetails,
            });
          }
          
          return Promise.reject({
            message: errorMessage400,
            statusCode: status,
            error: data?.error,
            details: errorDetails,
          } as ApiError);
        case 403:
          console.error("Access forbidden:", data?.message);
          break;
        case 404:
          // Not found - handled by caller
          break;
        case 429:
          // Rate Limit - Too Many Requests
          const errorMessage429 = data?.message || "Too many requests. Please try again later.";
          const retryAfter = error.response?.headers?.["retry-after"];
          
          console.error("Rate limit exceeded", {
            message: errorMessage429,
            retryAfter,
          });
          
          return Promise.reject({
            message: errorMessage429,
            statusCode: status,
            error: "RATE_LIMIT_EXCEEDED",
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : undefined,
          } as ApiError);
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
