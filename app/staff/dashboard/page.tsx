/**
 * Staff Dashboard Home Page
 * Overview and statistics (permission-based access)
 */

"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";
import { tokenManager } from "@/src/lib/tokenManager";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalStaff: number;
  totalPayroll: number;
}

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch staff profile to get permissions
        const profile = await api.staffAccounts.getProfile();
        const permissionCodes = (profile.permissions || [])
          .map((p) => (p.code || "").toUpperCase().replace(/\s+/g, "_"))
          .filter((code) => code.length > 0);
        setPermissions(permissionCodes);

        // Fetch stats based on permissions
        const statsPromises: Promise<any>[] = [];

        // Products stat (requires PRODUCT_MANAGEMENT)
        if (permissionCodes.includes("PRODUCT_MANAGEMENT")) {
          statsPromises.push(
            api.products.getAll({}).then((productsResponse) => {
              // Extract products array from response object { data: Product[], meta?: {...} }
              const productsArray = Array.isArray(productsResponse)
                ? productsResponse
                : productsResponse.data || [];
              return {
                type: "products",
                value: productsArray.length,
              };
            })
          );
        }

        // Orders stat (requires ORDERS_MANAGEMENT)
        if (permissionCodes.includes("ORDERS_MANAGEMENT")) {
          statsPromises.push(
            api.orders.getAll({}).then((orders) => ({
              type: "orders",
              value: Array.isArray(orders) ? orders.length : 0,
            }))
          );
        }

        // Staff and Payroll stats (requires STAFF_MANAGEMENT)
        if (permissionCodes.includes("STAFF_MANAGEMENT")) {
          statsPromises.push(
            api.staff.getPayrollSummary().then((payroll) => ({
              type: "payroll",
              value: payroll,
            }))
          );
        }

        // Wait for all permission-based stats
        const results = await Promise.allSettled(statsPromises);

        // Update stats based on results
        const newStats: Stats = {
          totalProducts: 0,
          totalOrders: 0,
          totalStaff: 0,
          totalPayroll: 0,
        };

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            const { type, value } = result.value;
            if (type === "products") {
              newStats.totalProducts = value;
            } else if (type === "orders") {
              newStats.totalOrders = value;
            } else if (type === "payroll") {
              newStats.totalStaff = value.staffCount || 0;
              newStats.totalPayroll = value.totalPayroll || 0;
            }
          }
        });

        setStats(newStats);

        // Check if any requests failed
        const failedRequests = results.filter((r) => r.status === "rejected");
        if (failedRequests.length > 0) {
          console.error("Failed requests:", failedRequests);
          setError(
            "Some statistics could not be loaded. Please check if the backend is running and you have the required permissions."
          );
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError(
          "Failed to load dashboard statistics. Please ensure the backend is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  const user = tokenManager.getUser();
  const hasAnyPermission = permissions.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#000000" }}>
          Staff Dashboard
        </h1>
        <p className="text-sm text-gray-600">
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
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Products</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "#000000" }}
                  >
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>
          )}

          {permissions.includes("ORDERS_MANAGEMENT") && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p
                    className="text-3xl font-bold"
                    style={{ color: "#000000" }}
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
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: "#000000" }}
                    >
                      {stats.totalStaff}
                    </p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              {/* <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Payroll</p>
                    <p className="text-3xl font-bold" style={{ color: "#000000" }}>
                      {typeof stats.totalPayroll === "number"
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#000000" }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {permissions.includes("PRODUCT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/products"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
                style={{ "--hover-border": "#2C5BBB" } as React.CSSProperties}
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Products
                </p>
              </a>
            )}

            {permissions.includes("ORDERS_MANAGEMENT") && (
              <a
                href="/staff/dashboard/orders"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Orders
                </p>
              </a>
            )}

            {permissions.includes("INVENTORY_MANAGEMENT") && (
              <a
                href="/staff/dashboard/inventory"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Update Inventory
                </p>
              </a>
            )}

            {permissions.includes("DEPARTMENT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/departments"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Departments
                </p>
              </a>
            )}

            {permissions.includes("STAFF_MANAGEMENT") && (
              <a
                href="/staff/dashboard/staff"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Staff
                </p>
              </a>
            )}

            {permissions.includes("STAFF_ACCOUNT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/staff-accounts"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Staff Accounts
                </p>
              </a>
            )}

            {permissions.includes("STAFF_PAYMENT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/payments"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Payments
                </p>
              </a>
            )}

            {permissions.includes("PRODUCT_CATEGORY_MANAGEMENT") && (
              <a
                href="/staff/dashboard/categories"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Categories
                </p>
              </a>
            )}

            {permissions.includes("PRODUCT_OPTIONS_MANAGEMENT") && (
              <a
                href="/staff/dashboard/options"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Options
                </p>
              </a>
            )}

            {permissions.includes("RECRUITMENT_MANAGEMENT") && (
              <>
                <a
                  href="/staff/dashboard/job-posts"
                  className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
                >
                  <p
                    className="font-semibold text-lg"
                    style={{ color: "#000000" }}
                  >
                    Manage Job Posts
                  </p>
                </a>
                <a
                  href="/staff/dashboard/job-applications"
                  className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
                >
                  <p
                    className="font-semibold text-lg"
                    style={{ color: "#000000" }}
                  >
                    Manage Applications
                  </p>
                </a>
                <a
                  href="/staff/dashboard/interviews"
                  className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
                >
                  <p
                    className="font-semibold text-lg"
                    style={{ color: "#000000" }}
                  >
                    Manage Interviews
                  </p>
                </a>
              </>
            )}

            {permissions.includes("CONTACT_MANAGEMENT") && (
              <a
                href="/staff/dashboard/contacts"
                className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
              >
                <p
                  className="font-semibold text-lg"
                  style={{ color: "#000000" }}
                >
                  Manage Contacts
                </p>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Profile Link (Always Available) */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4" style={{ color: "#000000" }}>
          Account
        </h2>
        <a
          href="/staff/profile"
          className="inline-block px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-semibold"
          style={{ color: "#000000" }}
        >
          View My Profile
        </a>
      </div>
    </div>
  );
}
