/**
 * Admin Dashboard Home Page
 * Overview and statistics
 */

"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalStaff: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalStaff: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch each stat independently to handle individual errors
        const results = await Promise.allSettled([
          api.products.getAll({}),
          api.orders.getAll({}),
          api.staff.getPayrollSummary(),
        ]);

        console.log("Dashboard stats results:", results);

        const products =
          results[0].status === "fulfilled" ? results[0].value : [];
        const orders =
          results[1].status === "fulfilled" ? results[1].value : [];
        const payroll =
          results[2].status === "fulfilled"
            ? results[2].value
            : { staffCount: 0, totalPayroll: 0 };

        console.log("Payroll data for dashboard:", payroll);

        setStats({
          totalProducts: Array.isArray(products) ? products.length : 0,
          totalOrders: Array.isArray(orders) ? orders.length : 0,
          totalStaff: payroll.staffCount || 0,
        });

        // Check if any requests failed
        const failedRequests = results.filter((r) => r.status === "rejected");
        if (failedRequests.length > 0) {
          console.error("Failed requests:", failedRequests);
          setError(
            "Some statistics could not be loaded. Please check if the backend is running and has data."
          );
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setError(
          "Failed to load dashboard statistics. Please ensure the backend is running."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8" style={{ color: "#000000" }}>
        Dashboard Overview
      </h1>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-2">
            Total Products
          </p>
          <p className="text-3xl font-bold" style={{ color: "#000000" }}>
            {stats.totalProducts}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Orders</p>
          <p className="text-3xl font-bold" style={{ color: "#000000" }}>
            {stats.totalOrders}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Staff</p>
          <p className="text-3xl font-bold" style={{ color: "#000000" }}>
            {stats.totalStaff}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4" style={{ color: "#000000" }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/dashboard/products"
            className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
            style={{ "--hover-border": "#2C5BBB" } as React.CSSProperties}
          >
            <p className="font-semibold text-lg" style={{ color: "#000000" }}>
              Add Product
            </p>
          </a>
          <a
            href="/admin/dashboard/orders"
            className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
          >
            <p className="font-semibold text-lg" style={{ color: "#000000" }}>
              Manage Orders
            </p>
          </a>
          <a
            href="/admin/dashboard/inventory"
            className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
          >
            <p className="font-semibold text-lg" style={{ color: "#000000" }}>
              Update Inventory
            </p>
          </a>
          <a
            href="/admin/dashboard/departments"
            className="p-6 border-2 border-gray-200 rounded-lg hover:shadow-md transition-all text-center bg-white"
          >
            <p className="font-semibold text-lg" style={{ color: "#000000" }}>
              Manage Departments
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
