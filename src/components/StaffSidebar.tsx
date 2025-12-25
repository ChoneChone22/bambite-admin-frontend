/**
 * Staff Sidebar Navigation Component
 * Navigation for staff accounts - shows routes based on permissions
 * 
 * Permission Handling:
 * - No permissions: Shows only "My Profile"
 * - Single permission: Shows "My Profile" + routes for that permission
 * - Multiple permissions: Shows "My Profile" + routes for all permissions
 * - Admin role: Shows all routes (bypasses permission checks)
 * - Loading state: Shows only "My Profile" while fetching permissions
 * - Error state: Shows only "My Profile" if permission fetch fails
 * 
 * Permission Codes (from backend):
 * - STAFF_MANAGEMENT → Staff, Staff Accounts, Payments
 * - PRODUCT_MANAGEMENT → Products
 * - INVENTORY_MANAGEMENT → Inventory
 * - ORDER_MANAGEMENT → Orders
 * - DEPARTMENT_MANAGEMENT → Departments
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/src/lib/axios";
import { tokenManager } from "@/src/lib/tokenManager";
import api from "@/src/services/api";
import { StaffAccount, Permission } from "@/src/types/api";

// Define all possible routes with their required permissions
// Staff uses /staff/dashboard/* routes (separate from admin routes)
const allRoutes = [
  { name: "My Profile", href: "/staff/profile", permission: null }, // Always visible
  { name: "Dashboard", href: "/staff/dashboard", permission: "ANY" }, // Show if has any permission
  { name: "Products", href: "/staff/dashboard/products", permission: "PRODUCT_MANAGEMENT" },
  { name: "Orders", href: "/staff/dashboard/orders", permission: "ORDER_MANAGEMENT" },
  { name: "Staff", href: "/staff/dashboard/staff", permission: "STAFF_MANAGEMENT" },
  { name: "Staff Accounts", href: "/staff/dashboard/staff-accounts", permission: "STAFF_MANAGEMENT" },
  { name: "Payments", href: "/staff/dashboard/payments", permission: "STAFF_MANAGEMENT" },
  { name: "Departments", href: "/staff/dashboard/departments", permission: "DEPARTMENT_MANAGEMENT" },
  { name: "Inventory", href: "/staff/dashboard/inventory", permission: "INVENTORY_MANAGEMENT" },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = tokenManager.getUser();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch staff profile to get permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const profile = await api.staffAccounts.getProfile();
        // Handle all cases: null, undefined, empty array, or array with permissions
        const fetchedPermissions = profile?.permissions || [];
        // Filter out any invalid permissions (null, undefined, or empty code)
        const validPermissions = fetchedPermissions.filter(
          (p) => p && p.code && typeof p.code === "string" && p.code.trim().length > 0
        );
        setPermissions(validPermissions);
      } catch (error) {
        console.error("Failed to fetch staff permissions:", error);
        // If fetch fails, show only My Profile (no permissions)
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Filter routes based on permissions
  // Handles: no permissions, single permission, multiple permissions, admin role
  const getVisibleRoutes = () => {
    if (isLoading) {
      // Show only My Profile while loading
      return allRoutes.filter((route) => route.name === "My Profile");
    }

    // Get permission codes (normalize to uppercase for comparison)
    // Backend returns codes like "staff_management", we compare with "STAFF_MANAGEMENT"
    // Filter out empty/invalid codes and normalize
    const permissionCodes = permissions
      .map((p) => {
        const code = p?.code || "";
        return typeof code === "string" ? code.toUpperCase().replace(/\s+/g, "_").trim() : "";
      })
      .filter((code) => code.length > 0);

    // Check if user is admin (admin has all permissions)
    const isAdmin = user?.role?.toLowerCase() === "admin";

    // Filter routes based on permissions
    const filteredRoutes = allRoutes.filter((route) => {
      // Always show My Profile (even for staff with no permissions)
      if (route.name === "My Profile") return true;

      // If admin, show all routes (admin bypasses permission checks)
      if (isAdmin) return true;

      // If route has no permission requirement, show it
      if (!route.permission) return true;

      // Special case: Dashboard shows if staff has ANY permission
      if (route.permission === "ANY") {
        return permissionCodes.length > 0; // Show dashboard if has at least one permission
      }

      // For staff: check if they have the required permission
      // Handle empty permissions array (staff with no permissions)
      if (permissionCodes.length === 0) {
        return false; // No permissions = only "My Profile" visible
      }

      // Check if user has the required permission (case-insensitive comparison)
      const normalizedRoutePermission = route.permission.toUpperCase().trim();
      return permissionCodes.includes(normalizedRoutePermission);
    });

    // Ensure at least "My Profile" is always visible
    const hasMyProfile = filteredRoutes.some((route) => route.name === "My Profile");
    if (!hasMyProfile) {
      return allRoutes.filter((route) => route.name === "My Profile");
    }

    return filteredRoutes;
  };

  const visibleRoutes = getVisibleRoutes();

  const handleLogout = async () => {
    try {
      // Import api dynamically to avoid circular dependencies
      const api = (await import("@/src/services/api")).default;
      await api.auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuth();
      router.push("/staff/login");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold" style={{ color: "#2C5BBB" }}>
          Bambite Staff
        </h1>
        {user && (
          <p className="text-sm text-gray-600 mt-1">
            {user.email || "Staff Account"}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleRoutes.length > 0 ? (
          visibleRoutes.map((item) => {
            // Check if current path matches the route
            // For Dashboard, only match exact path (not sub-routes)
            // For other routes, match exact path or sub-routes
            let isActive = false;
            if (item.name === "Dashboard") {
              // Dashboard should only be active on exact match
              isActive = pathname === item.href;
            } else {
              // Other routes can be active on exact match or sub-routes
              isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            }
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-4 py-3 rounded-lg transition-all font-medium ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                style={isActive ? { backgroundColor: "#2C5BBB" } : {}}
              >
                {item.name}
              </Link>
            );
          })
        ) : (
          // Fallback: Should never happen since "My Profile" is always visible
          // But handle edge case gracefully
          <div className="px-4 py-3 text-sm text-gray-500">
            No routes available
          </div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {user?.staff && (
          <div className="px-4 py-2 text-sm">
            <p className="font-medium" style={{ color: "#000000" }}>
              {user.staff.name || "Staff Member"}
            </p>
            <p className="text-gray-600 text-xs">
              {user.staff.employeeId || ""}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-lg hover:bg-gray-50 transition-all font-semibold text-left cursor-pointer"
          style={{ color: "#000000" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

