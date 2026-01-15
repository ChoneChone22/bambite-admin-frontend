/**
 * Admin Sidebar Navigation Component
 * Professional grouped navigation with collapsible sections
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/src/lib/axios";

interface NavItem {
  name: string;
  href: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ name: "Dashboard", href: "/admin/dashboard" }],
  },
  {
    title: "Products",
    items: [
      { name: "Products", href: "/admin/dashboard/products" },
      { name: "Categories", href: "/admin/dashboard/categories" },
      { name: "Options", href: "/admin/dashboard/options" },
    ],
  },
  {
    title: "Orders",
    items: [{ name: "Orders", href: "/admin/dashboard/orders" }],
  },
  {
    title: "Staff Management",
    items: [
      { name: "Staff", href: "/admin/dashboard/staff" },
      { name: "Staff Accounts", href: "/admin/dashboard/staff-accounts" },
      { name: "Payments", href: "/admin/dashboard/payments" },
      { name: "Departments", href: "/admin/dashboard/departments" },
    ],
  },
  {
    title: "Operations",
    items: [{ name: "Inventory", href: "/admin/dashboard/inventory" }],
  },
  {
    title: "Recruitment",
    items: [
      { name: "Job Posts", href: "/admin/dashboard/job-posts" },
      { name: "Place Tags", href: "/admin/dashboard/place-tags" },
      { name: "Applications", href: "/admin/dashboard/job-applications" },
      { name: "Interviews", href: "/admin/dashboard/interviews" },
    ],
  },
  {
    title: "Communications",
    items: [{ name: "Contacts", href: "/admin/dashboard/contacts" }],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Auto-expand groups that contain the current path
  useEffect(() => {
    const activeGroups = new Set<string>();
    navigationGroups.forEach((group) => {
      const hasActiveItem = group.items.some((item) => pathname === item.href);
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
      router.push("/admin/login");
    }
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => pathname === item.href);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold" style={{ color: "#2C5BBB" }}>
          Bambite Admin
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigationGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.title);
          const hasActiveItem = isGroupActive(group);

          return (
            <div key={group.title} className="mb-1">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.title)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all font-semibold text-sm ${
                  hasActiveItem
                    ? "text-white"
                    : "hover:bg-gray-50"
                }`}
                style={
                  hasActiveItem
                    ? { backgroundColor: "#2C5BBB", color: "#ffffff" }
                    : { color: "#374151" }
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
                <span>{group.title}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? "transform rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ minWidth: "16px" }}
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
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block px-4 py-2 rounded-lg transition-all text-sm ${
                          isActive
                            ? "text-white shadow-sm font-medium"
                            : "hover:bg-gray-50"
                        }`}
                        style={
                          isActive
                            ? { backgroundColor: "#2C5BBB", color: "#ffffff" }
                            : { color: "#6b7280" }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                            e.currentTarget.style.color = "#374151";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.backgroundColor = "transparent";
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
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
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
