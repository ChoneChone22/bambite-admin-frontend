/**
 * Admin Sidebar Navigation Component
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth } from "@/src/lib/axios";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Products", href: "/admin/dashboard/products" },
  { name: "Orders", href: "/admin/dashboard/orders" },
  { name: "Staff", href: "/admin/dashboard/staff" },
  { name: "Inventory", href: "/admin/dashboard/inventory" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/admin/login");
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
