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
    items: [
      { name: "Dashboard", href: "/admin/dashboard" },
    ],
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
    title: "User Management",
    items: [{ name: "Users", href: "/admin/dashboard/users" }],
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
    items: [
      { name: "Contacts", href: "/admin/dashboard/contacts" },
      { name: "FAQs", href: "/admin/dashboard/faqs" },
    ],
  },
  {
    title: "Content & Design",
    items: [
      { name: "Themes", href: "/admin/dashboard/themes" },
      { name: "Animations", href: "/admin/dashboard/animations" },
      { name: "Reviews", href: "/admin/dashboard/reviews" },
    ],
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
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 pt-6">
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
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
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
                            ? "bg-primary text-primary-foreground shadow-sm font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
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

      {/* Account Settings */}
      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/admin/change-password"
          className="w-full px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-semibold text-left flex items-center text-foreground"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Change Password
        </Link>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all font-semibold text-left cursor-pointer flex items-center text-foreground"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
