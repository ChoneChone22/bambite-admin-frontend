/**
 * Staff Layout
 * Protected layout for staff accounts with sidebar navigation
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { tokenManager } from "@/src/lib/tokenManager";
import StaffSidebar from "@/src/components/StaffSidebar";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Skip authentication check for login and change-password pages
  const isLoginPage = pathname === "/staff/login";
  const isChangePasswordPage = pathname === "/staff/change-password";

  useEffect(() => {
    // If on login or change-password page, skip auth check and just render
    if (isLoginPage || isChangePasswordPage) {
      setIsLoading(false);
      setIsAuthenticated(false); // Not authenticated on these pages
      return;
    }

    const checkAuth = async () => {
      // Check if user is authenticated as staff
      const user = tokenManager.getUser();

      if (!user) {
        router.push("/staff/login");
        return;
      }

      // Check if user is staff (role can be "staff" or "STAFF")
      const role = user.role?.toLowerCase();
      if (role !== "staff") {
        router.push("/staff/login");
        return;
      }

      // Verify authentication with backend by fetching profile
      // This ensures cookies are valid
      try {
        const api = (await import("@/src/services/api")).default;
        await api.staffAccounts.getProfile();
        setIsAuthenticated(true);
      } catch (error) {
        // Profile fetch failed - cookies invalid or expired
        tokenManager.clearUser();
        router.push("/staff/login");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, isLoginPage, isChangePasswordPage]);

  // If on login or change-password page, render without layout (no sidebar)
  if (isLoginPage || isChangePasswordPage) {
    return <>{children}</>;
  }

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
        <StaffSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

