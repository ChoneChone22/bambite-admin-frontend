/**
 * Admin Dashboard Layout
 * Protected layout with sidebar navigation
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { tokenManager } from "@/src/lib/tokenManager";
import AdminSidebar from "@/src/components/AdminSidebar";
import MobileNavBar from "@/src/components/MobileNavBar";
import MobileSidebar from "@/src/components/MobileSidebar";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated as admin (ONLY admin, not staff)
      const user = tokenManager.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      // Check if user is admin (role can be "admin" or "ADMIN")
      const role = user.role?.toLowerCase();
      if (role !== "admin") {
        // If staff tries to access admin routes, redirect to staff dashboard
        if (role === "staff") {
          router.push("/staff/dashboard");
        } else {
          router.push("/admin/login");
        }
        return;
      }

      // Verify authentication with backend by fetching profile
      // Backend automatically prioritizes accessToken_admin cookie for admin endpoints
      // When multiple roles are logged in, backend correctly selects the appropriate cookie
      try {
        const api = (await import("@/src/services/api")).default;
        // Use getAdminProfile() which is specifically for admin viewing their own profile
        // Backend automatically detects and uses accessToken_admin cookie for this endpoint
        await api.auth.getAdminProfile();
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error: any) {
        // Profile fetch failed - cookies invalid or expired
        console.error("Admin profile fetch failed:", error);
        tokenManager.clearUser();
        router.push("/admin/login");
        return;
      }
    };

    checkAuth();

    // Listen for auth changes from other components (e.g., login)
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  const user = tokenManager.getUser();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Navigation Bar */}
      <MobileNavBar
        onMenuClick={() => setIsMobileMenuOpen(true)}
        title="Bambite Admin"
        userEmail={user?.email}
      />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <AdminSidebar />
      </MobileSidebar>

      {/* Desktop Sidebar - Admin only */}
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <AdminSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
