/**
 * Admin Dashboard Layout
 * Protected layout with sidebar navigation
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/src/lib/axios";
import AdminSidebar from "@/src/components/AdminSidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated with admin token
    const token = getAuthToken();
    const userStr =
      typeof window !== "undefined"
        ? localStorage.getItem("bambite_user")
        : null;

    if (!token) {
      router.push("/admin/login");
      return;
    }

    if (!userStr || userStr === "undefined") {
      router.push("/admin/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);

      if (user.role !== "admin") {
        router.push("/admin/login");
        return;
      }
      setIsAuthenticated(true);
    } catch (error) {
      router.push("/admin/login");
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
