/**
 * Custom React Hooks for Bambite E-commerce
 */

"use client";

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
import {
  User,
  Product,
  LoginRequest,
  RegisterRequest,
  ProductFilters,
} from "@/src/types/api";

// ==================== Auth Hook ====================

export const useAuth = () => {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    const token = getAuthToken();
    if (token) {
      // Get user data from localStorage (saved during login)
      const userJson = getUser();
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          setUserState(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Invalid user data, clear auth
          clearAuth();
          setUserState(null);
          setIsAuthenticated(false);
        }
      } else {
        // Token exists but no user data, clear auth
        clearAuth();
        setUserState(null);
        setIsAuthenticated(false);
      }
    } else {
      // No token
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
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, [checkAuth]);

  const login = async (credentials: LoginRequest) => {
    const response = await api.auth.login(credentials);
    setAuthToken(response.token);
    setUser(JSON.stringify(response.user));
    setUserState(response.user);
    setIsAuthenticated(true);
    // Notify other components
    window.dispatchEvent(new Event("auth-change"));
    return response;
  };

  const register = async (data: RegisterRequest) => {
    const response = await api.auth.register(data);
    setAuthToken(response.token);
    setUser(JSON.stringify(response.user));
    setUserState(response.user);
    setIsAuthenticated(true);
    // Notify other components
    window.dispatchEvent(new Event("auth-change"));
    return response;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      clearAuth();
      setUserState(null);
      setIsAuthenticated(false);
      // Notify other components
      window.dispatchEvent(new Event("auth-change"));
      router.push("/admin/login");
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
      setProducts(response);
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

