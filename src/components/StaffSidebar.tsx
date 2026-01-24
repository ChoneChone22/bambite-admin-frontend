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
 * - PRODUCT_MANAGEMENT → Products
 * - PRODUCT_CATEGORY_MANAGEMENT → Categories
 * - PRODUCT_OPTIONS_MANAGEMENT → Options
 * - ORDERS_MANAGEMENT → Orders
 * - STAFF_MANAGEMENT → Staff
 * - STAFF_ACCOUNT_MANAGEMENT → Staff Accounts
 * - STAFF_PAYMENT_MANAGEMENT → Payments
 * - DEPARTMENT_MANAGEMENT → Departments
 * - INVENTORY_MANAGEMENT → Inventory
 * - RECRUITMENT_MANAGEMENT → Job Posts, Place Tags, Applications, Interviews
 * - CONTACT_MANAGEMENT → Contacts
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/src/lib/axios";
import { tokenManager } from "@/src/lib/tokenManager";
import api from "@/src/services/api";
import { Permission } from "@/src/types/api";

interface NavItem {
  name: string;
  href: string;
  permission: string | null; // Permission required, null = always visible, "ANY" = show if has any permission
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// Define navigation groups with their required permissions
// Staff uses /staff/dashboard/* routes (separate from admin routes)
const navigationGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "My Profile", href: "/staff/profile", permission: null }, // Always visible
      { name: "Dashboard", href: "/staff/dashboard", permission: "ANY" }, // Show if has any permission
    ],
  },
  {
    title: "Products",
    items: [
      {
        name: "Products",
        href: "/staff/dashboard/products",
        permission: "PRODUCT_MANAGEMENT",
      },
      {
        name: "Categories",
        href: "/staff/dashboard/categories",
        permission: "PRODUCT_CATEGORY_MANAGEMENT",
      },
      {
        name: "Options",
        href: "/staff/dashboard/options",
        permission: "PRODUCT_OPTIONS_MANAGEMENT",
      },
    ],
  },
  {
    title: "Orders",
    items: [
      {
        name: "Orders",
        href: "/staff/dashboard/orders",
        permission: "ORDERS_MANAGEMENT",
      },
    ],
  },
  {
    title: "Staff Management",
    items: [
      {
        name: "Staff",
        href: "/staff/dashboard/staff",
        permission: "STAFF_MANAGEMENT",
      },
      {
        name: "Staff Accounts",
        href: "/staff/dashboard/staff-accounts",
        permission: "STAFF_ACCOUNT_MANAGEMENT",
      },
      {
        name: "Payments",
        href: "/staff/dashboard/payments",
        permission: "STAFF_PAYMENT_MANAGEMENT",
      },
      {
        name: "Departments",
        href: "/staff/dashboard/departments",
        permission: "DEPARTMENT_MANAGEMENT",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        name: "Inventory",
        href: "/staff/dashboard/inventory",
        permission: "INVENTORY_MANAGEMENT",
      },
    ],
  },
  {
    title: "Recruitment",
    items: [
      {
        name: "Job Posts",
        href: "/staff/dashboard/job-posts",
        permission: "RECRUITMENT_MANAGEMENT",
      },
      {
        name: "Place Tags",
        href: "/staff/dashboard/place-tags",
        permission: "RECRUITMENT_MANAGEMENT",
      },
      {
        name: "Applications",
        href: "/staff/dashboard/job-applications",
        permission: "RECRUITMENT_MANAGEMENT",
      },
      {
        name: "Interviews",
        href: "/staff/dashboard/interviews",
        permission: "RECRUITMENT_MANAGEMENT",
      },
    ],
  },
  {
    title: "Communications",
    items: [
      {
        name: "Contacts",
        href: "/staff/dashboard/contacts",
        permission: "CONTACT_MANAGEMENT",
      },
      {
        name: "FAQs",
        href: "/staff/dashboard/faqs",
        permission: "CONTENT_MANAGEMENT",
      },
    ],
  },
  {
    title: "Content & Design",
    items: [
      {
        name: "Themes",
        href: "/staff/dashboard/themes",
        permission: "THEME_AND_ANIMATION",
      },
      {
        name: "Animations",
        href: "/staff/dashboard/animations",
        permission: "THEME_AND_ANIMATION",
      },
      {
        name: "Reviews",
        href: "/staff/dashboard/reviews",
        permission: "REVIEW_MANAGEMENT",
      },
    ],
  },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = tokenManager.getUser();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch staff profile to get permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const profile = await api.staffAccounts.getProfile();
        // Handle all cases: null, undefined, empty array, or array with permissions
        const fetchedPermissions = profile?.permissions || [];
        // Filter out any invalid permissions (null, undefined, or empty code)
        const validPermissions = fetchedPermissions.filter(
          (p) =>
            p &&
            p.code &&
            typeof p.code === "string" &&
            p.code.trim().length > 0
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

  // Get permission codes (normalize to uppercase for comparison)
  // Backend returns codes like "staff_management", we compare with "STAFF_MANAGEMENT"
  const getPermissionCodes = () => {
    if (isLoading) return [];

    return permissions
      .map((p) => {
        const code = p?.code || "";
        return typeof code === "string"
          ? code.toUpperCase().replace(/\s+/g, "_").trim()
          : "";
      })
      .filter((code) => code.length > 0);
  };

  // Check if a route item should be visible based on permissions
  const isRouteVisible = (
    item: NavItem,
    permissionCodes: string[],
    isAdmin: boolean
  ): boolean => {
    // Always show items with no permission requirement
    if (!item.permission) return true;

    // If admin, show all routes (admin bypasses permission checks)
    if (isAdmin) return true;

    // Special case: Dashboard shows if staff has ANY permission
    if (item.permission === "ANY") {
      return permissionCodes.length > 0;
    }

    // Check if user has the required permission
    const normalizedRoutePermission = item.permission.toUpperCase().trim();
    return permissionCodes.includes(normalizedRoutePermission);
  };

  // Filter navigation groups to only show groups with visible items
  const getVisibleGroups = () => {
    if (isLoading) {
      // Show only Overview group with My Profile while loading
      return navigationGroups.filter((group) => group.title === "Overview");
    }

    const permissionCodes = getPermissionCodes();
    const isAdmin = user?.role?.toLowerCase() === "admin";

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          isRouteVisible(item, permissionCodes, isAdmin)
        ),
      }))
      .filter((group) => group.items.length > 0); // Only show groups with at least one visible item
  };

  const visibleGroups = getVisibleGroups();

  // Auto-expand groups that contain the current path
  useEffect(() => {
    const activeGroups = new Set<string>();
    navigationGroups.forEach((group) => {
      const hasActiveItem = group.items.some((item) => {
        if (item.name === "Dashboard") {
          return pathname === item.href;
        }
        return pathname === item.href || pathname.startsWith(item.href + "/");
      });
      if (hasActiveItem) {
        activeGroups.add(group.title);
      }
    });
    setExpandedGroups(activeGroups);
  }, [pathname]);

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return newSet;
    });
  };

  const handleLogout = async () => {
    try {
      // Get refreshToken before clearing
      const refreshToken = typeof window !== "undefined" 
        ? localStorage.getItem("refreshToken") 
        : null;
      
      // Import api dynamically to avoid circular dependencies
      const api = (await import("@/src/services/api")).default;
      // Backend supports both: cookies (Priority 1) and refreshToken in body (Priority 2)
      await api.auth.logout(refreshToken || undefined);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear user data and tokens
      clearAuth();
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
      }
      router.push("/staff/login");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 pt-6">
        {visibleGroups.length > 0 ? (
          visibleGroups.map((group) => {
            const hasActiveItem = group.items.some((item) => {
              if (item.name === "Dashboard") {
                return pathname === item.href;
              }
              return (
                pathname === item.href || pathname.startsWith(item.href + "/")
              );
            });
            const isExpanded = expandedGroups.has(group.title);

            return (
              <div key={group.title} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all font-semibold text-sm"
                  style={
                    hasActiveItem
                      ? { backgroundColor: "#2C5BBB", color: "#ffffff" }
                      : { color: "#374151", backgroundColor: "transparent" }
                  }
                  onMouseEnter={(e) => {
                    if (!hasActiveItem) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasActiveItem) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <span
                    style={{ color: hasActiveItem ? "#ffffff" : "#374151" }}
                  >
                    {group.title}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isExpanded ? "transform rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{
                      minWidth: "16px",
                      color: hasActiveItem ? "#ffffff" : "#374151",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      let isActive = false;
                      if (item.name === "Dashboard") {
                        isActive = pathname === item.href;
                      } else {
                        isActive =
                          pathname === item.href ||
                          pathname.startsWith(item.href + "/");
                      }
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2 rounded-lg transition-all text-sm"
                          style={
                            isActive
                              ? {
                                  backgroundColor: "#2C5BBB",
                                  color: "#ffffff",
                                  fontWeight: "500",
                                }
                              : {
                                  color: "#6b7280",
                                  backgroundColor: "transparent",
                                }
                          }
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = "#f9fafb";
                              e.currentTarget.style.color = "#374151";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor =
                                "transparent";
                              e.currentTarget.style.color = "#6b7280";
                            }
                          }}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Fallback: Should never happen since "My Profile" is always visible
          // But handle edge case gracefully
          <div className="px-4 py-3 text-sm" style={{ color: "#6b7280" }}>
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
