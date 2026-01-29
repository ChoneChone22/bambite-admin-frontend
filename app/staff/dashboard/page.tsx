/**
 * Staff Dashboard Home Page
 * Overview and statistics (permission-based access) with real-time updates.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import api from "@/src/services/api";
import { tokenManager } from "@/src/lib/tokenManager";
import { getErrorMessage } from "@/src/lib/utils";
import { useRealtime } from "@/src/hooks/useRealtime";
import LoadingSpinner from "@/src/components/LoadingSpinner";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalStaff: number;
  totalPayroll: number;
}

const DASHBOARD_POLL_INTERVAL_MS = 60_000;

export default function StaffDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalStaff: 0,
    totalPayroll: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  const applyStats = useCallback((dashboardStats: Awaited<ReturnType<typeof api.dashboard.getStats>>, permissionCodes: string[]) => {
    const newStats: Stats = {
      totalProducts: 0,
      totalOrders: 0,
      totalStaff: 0,
      totalPayroll: 0,
    };
    if (permissionCodes.includes("PRODUCT_MANAGEMENT")) {
      newStats.totalProducts = dashboardStats.products?.total || 0;
    }
    if (permissionCodes.includes("ORDERS_MANAGEMENT")) {
      newStats.totalOrders = dashboardStats.orders?.total || 0;
    }
    if (permissionCodes.includes("STAFF_MANAGEMENT")) {
      newStats.totalStaff = dashboardStats.staff?.total || 0;
    }
    return newStats;
  }, []);

  const fetchStats = useCallback(async (permissionCodes: string[]) => {
    try {
      setError(null);
      const dashboardStats = await api.dashboard.getStats();
      setStats(applyStats(dashboardStats, permissionCodes));
    } catch (err: unknown) {
      console.error("Failed to fetch dashboard data:", err);
      const errorMessage = getErrorMessage(err);
      const axiosError = err as { response?: { status?: number } };
      if (axiosError?.response?.status === 401) {
        setError("Authentication required. Please login again.");
      } else if (axiosError?.response?.status === 403) {
        setError("Access denied. Admin or Staff accounts only.");
      } else {
        setError(
          errorMessage || "Failed to load dashboard statistics. Please ensure the backend is running."
        );
      }
    }
  }, [applyStats]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profile = await api.staffAccounts.getProfile();
        const permissionCodes = (profile.permissions || [])
          .map((p) => (p.code || "").toUpperCase().replace(/\s+/g, "_"))
          .filter((code) => code.length > 0);
        setPermissions(permissionCodes);
        await fetchStats(permissionCodes);
      } catch (err: unknown) {
        console.error("Failed to fetch dashboard data:", err);
        setError(getErrorMessage(err) || "Failed to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [fetchStats]);

  const permissionsRef = useRef(permissions);
  permissionsRef.current = permissions;

  const refetchStats = useCallback(() => {
    fetchStats(permissionsRef.current);
  }, [fetchStats]);

  const { connected } = useRealtime({
    onNewOrder: refetchStats,
    onOrderUpdate: refetchStats,
    onInventoryUpdate: refetchStats,
    subscribeToOrdersList: true,
    enabled: true,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (connected || permissions.length === 0) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(() => fetchStats(permissionsRef.current), DASHBOARD_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [connected, permissions.length, fetchStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  const user = tokenManager.getUser();
  const hasAnyPermission = permissions.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 text-foreground">
          Staff Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.staff?.name || user?.email || "Staff Member"}
        </p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* No Permissions Message */}
      {!hasAnyPermission && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-2">
            No Permissions Assigned
          </h2>
          <p className="text-sm">
            You don&apos;t have any management permissions assigned yet. You can
            still view your profile. Contact your administrator to request
            access to specific features.
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      {hasAnyPermission && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {permissions.includes("PRODUCT_MANAGEMENT") && (
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                  <p
                    className="text-3xl font-bold"
                  >
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>
          )}

          {permissions.includes("ORDERS_MANAGEMENT") && (
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p
                    className="text-3xl font-bold"
                  >
                    {stats.totalOrders}
                  </p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>
          )}

          {permissions.includes("STAFF_MANAGEMENT") && (
            <>
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Staff</p>
                    <p
                      className="text-3xl font-bold"
                    >
                      {stats.totalStaff}
                    </p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              {/* <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Payroll</p>
                    <p className="text-3xl font-bold text-foreground">
                      {typeof stats.totalPayroll === "number"
                        ? new Intl.NumberFormat("th-TH", {
                            style: "currency",
                            currency: "THB",
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(stats.totalPayroll)
                        : "—"}
                    </p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div> */}
            </>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {hasAnyPermission && (
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            className="text-xl font-semibold mb-4"
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissions.includes("PRODUCT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/products"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
                style={{ "--hover-border": "#2C5BBB" } as React.CSSProperties}
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Products
                </p>
              </a>
            )}

            {permissions.includes("ORDERS_MANAGEMENT") && (
              <a
                href="/staff/dashboard/orders"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Orders
                </p>
              </a>
            )}

            {permissions.includes("INVENTORY_MANAGEMENT") && (
              <a
                href="/staff/dashboard/inventory"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Update Inventory
                </p>
              </a>
            )}

            {permissions.includes("DEPARTMENT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/departments"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Departments
                </p>
              </a>
            )}

            {permissions.includes("STAFF_MANAGEMENT") && (
              <a
                href="/staff/dashboard/staff"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Staff
                </p>
              </a>
            )}

            {permissions.includes("STAFF_ACCOUNT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/staff-accounts"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Staff Accounts
                </p>
              </a>
            )}

            {permissions.includes("STAFF_PAYMENT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/payments"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Payments
                </p>
              </a>
            )}

            {permissions.includes("PRODUCT_CATEGORY_MANAGEMENT") && (
              <a
                href="/staff/dashboard/categories"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Categories
                </p>
              </a>
            )}

            {permissions.includes("PRODUCT_OPTIONS_MANAGEMENT") && (
              <a
                href="/staff/dashboard/options"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Options
                </p>
              </a>
            )}

            {permissions.includes("RECRUITMENT_MANAGEMENT") && (
              <>
                <a
                  href="/staff/dashboard/job-posts"
                  className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
                >
                  <p
                    className="font-semibold text-lg"
                  >
                    Manage Job Posts
                  </p>
                </a>
                <a
                  href="/staff/dashboard/job-applications"
                  className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
                >
                  <p
                    className="font-semibold text-lg"
                  >
                    Manage Applications
                  </p>
                </a>
                <a
                  href="/staff/dashboard/interviews"
                  className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
                >
                  <p
                    className="font-semibold text-lg"
                  >
                    Manage Interviews
                  </p>
                </a>
              </>
            )}

            {permissions.includes("CONTACT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/contacts"
                className="p-6 border-2 border-border rounded-lg hover:shadow-md transition-all text-center bg-card"
              >
                <p
                  className="font-semibold text-lg"
                >
                  Manage Contacts
                </p>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Profile Link (Always Available) */}
      <div className="mt-6 bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Account
        </h2>
        <a
          href="/staff/profile"
          className="inline-block px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-semibold"
        >
          View My Profile
        </a>
      </div>
    </div>
  );
}
