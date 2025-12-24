/**
 * Staff Sidebar Navigation Component
 * Navigation for staff accounts
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/src/lib/axios";
import { tokenManager } from "@/src/lib/tokenManager";

const navigation = [
  { name: "My Profile", href: "/staff/profile" },
];

export default function StaffSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = tokenManager.getUser();

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
        {navigation.map((item) => {
          const isActive = pathname === item.href;
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
        })}
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

