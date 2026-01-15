/**
 * Staff Dashboard Layout
 * Protected layout for staff accounts with sidebar navigation
 * Separate from admin dashboard routes
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { tokenManager } from "@/src/lib/tokenManager";
import StaffSidebar from "@/src/components/StaffSidebar";
import MobileNavBar from "@/src/components/MobileNavBar";
import MobileSidebar from "@/src/components/MobileSidebar";

export default function StaffDashboardLayout({
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
      // Check if user is authenticated as staff (ONLY staff, not admin)
      const user = tokenManager.getUser();

      if (!user) {
        router.push("/staff/login");
        return;
      }

      // Check if user is staff (role can be "staff" or "STAFF")
      const role = user.role?.toLowerCase();
      if (role !== "staff") {
        // If admin tries to access staff routes, redirect to admin dashboard
        if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/staff/login");
        }
        return;
      }

      // Verify authentication with backend by fetching profile
      // Backend automatically prioritizes accessToken_staff cookie for staff endpoints
      // When multiple roles are logged in, backend correctly selects the appropriate cookie
      try {
        const api = (await import("@/src/services/api")).default;
        // Use getProfile() which is specifically for staff viewing their own profile
        // Backend automatically detects and uses accessToken_staff cookie for this endpoint
        await api.staffAccounts.getProfile();
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (error: any) {
        // Profile fetch failed - cookies invalid or expired
        console.error("Staff profile fetch failed:", error);
        tokenManager.clearUser();
        router.push("/staff/login");
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
        title="Bambite Staff"
        userEmail={user?.email}
        userName={user?.staff?.name}
      />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      >
        <StaffSidebar />
      </MobileSidebar>

      {/* Desktop Sidebar - Staff only */}
      <aside className="w-64 flex-shrink-0 hidden md:block">
        <StaffSidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

