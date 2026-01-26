/**
 * Custom React Hooks for Bambite E-commerce
 */

"use client";

export { useTableSort } from "./useTableSort";
export type { SortConfig, SortDirection } from "./useTableSort";
export { useTablePagination } from "./useTablePagination";
export type { PaginationConfig, UseTablePaginationOptions } from "./useTablePagination";
export { useModal } from "./useModal";
export type { ModalOptions } from "./useModal";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/services/api";
import {
  getAuthToken,
  setAuthToken,
  getUser,
  setUser,
  clearAuth,
} from "@/src/lib/axios";
import { tokenManager } from "@/src/lib/tokenManager";
import {
  User,
  StaffAccount,
  Product,
  LoginRequest,
  RegisterRequest,
  ProductFilters,
} from "@/src/types/api";

// ==================== Auth Hook ====================

export const useAuth = () => {
  const [user, setUserState] = useState<User | StaffAccount | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    // With httpOnly cookies, we can't check tokens directly
    // Check user data - if it exists, user might be authenticated
    // Actual authentication is validated by backend via cookies
    const user = tokenManager.getUser();
    
    if (user) {
      // User data exists - verify with backend by fetching profile
      try {
        // Try to fetch profile to verify cookies are valid
        // This will fail with 401 if cookies are invalid/expired
        // Determine which profile endpoint to use based on user role
        if (user.role === "ADMIN" || user.role === "admin") {
          await api.auth.getAdminProfile();
        } else if (user.role === "STAFF" || user.role === "staff") {
          await api.staffAccounts.getProfile();
        } else {
          await api.auth.getProfile();
        }
        setUserState(user);
        setIsAuthenticated(true);
      } catch (error) {
        // Profile fetch failed - cookies invalid or expired
        // Clear user data
        clearAuth();
        setUserState(null);
        setIsAuthenticated(false);
      }
    } else {
      // No user data
      setUserState(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes from other components
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("auth-change", handleAuthChange);

    // Note: Proactive token refresh is handled by axios interceptor
    // No need for interval-based refresh with httpOnly cookies

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [checkAuth]);

  const login = async (credentials: LoginRequest) => {
    const response = await api.auth.login(credentials);
    
    // Extract tokens from response (for Safari/iOS support)
    // Backend returns tokens in data.tokens object
    if (response.tokens) {
      localStorage.setItem("accessToken", response.tokens.accessToken);
      localStorage.setItem("refreshToken", response.tokens.refreshToken);
      localStorage.setItem("userRole", "user");
    }
    
    // Response contains user data
    const user = response.user || response.admin || response.staffAccount || null;
    
    if (!user) {
      throw new Error("No user data received from server");
    }
    
    // Store user data
    // Backend sets cookies (for Chrome) and we store tokens in localStorage (for Safari/iOS)
    tokenManager.setUser(user);
    setUserState(user);
    setIsAuthenticated(true);
    
    // Notify other components
    window.dispatchEvent(new Event("auth-change"));
    return response;
  };

  const register = async (data: RegisterRequest) => {
    const response = await api.auth.register(data);
    
    // Extract tokens from response (for Safari/iOS support)
    // Backend returns tokens in data.tokens object
    if (response.tokens) {
      localStorage.setItem("accessToken", response.tokens.accessToken);
      localStorage.setItem("refreshToken", response.tokens.refreshToken);
      localStorage.setItem("userRole", "user");
    }
    
    // Response contains user data
    const user = response.user || response.admin || response.staffAccount || null;
    
    if (!user) {
      throw new Error("No user data received from server");
    }
    
    // Store user data
    // Backend sets cookies (for Chrome) and we store tokens in localStorage (for Safari/iOS)
    tokenManager.setUser(user);
    setUserState(user);
    setIsAuthenticated(true);
    
    // Notify other components
    window.dispatchEvent(new Event("auth-change"));
    return response;
  };

  const logout = async () => {
    // Get user role and refreshToken before clearing (needed for API call and redirect)
    const userRole = typeof window !== "undefined" 
      ? localStorage.getItem("userRole") 
      : null;
    const refreshToken = typeof window !== "undefined" 
      ? localStorage.getItem("refreshToken") 
      : null;
    
    try {
      // Logout - backend clears cookies (Chrome) and we clear localStorage (Safari/iOS)
      // Backend supports both: cookies (Priority 1) and refreshToken in body (Priority 2)
      await api.auth.logout(refreshToken || undefined);
    } catch (error) {
      // Even if logout fails, clear local user data and tokens
      console.error("Logout error:", error);
    } finally {
      // Clear user data and tokens
      clearAuth();
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
      }
      setUserState(null);
      setIsAuthenticated(false);
      // Notify other components
      window.dispatchEvent(new Event("auth-change"));
      
      // Redirect to appropriate login page based on role
      const loginPaths: Record<string, string> = {
        staff: "/staff/login",
        admin: "/admin/login",
        user: "/login",
      };
      const loginPath = loginPaths[userRole || "admin"] || "/admin/login";
      router.push(loginPath);
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
};

// ==================== Products Hook ====================

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.products.getAll(filters);
      setProducts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
};

// ==================== Product Detail Hook ====================

export const useProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.products.getById(id);
        setProduct(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch product"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return {
    product,
    isLoading,
    error,
  };
};

