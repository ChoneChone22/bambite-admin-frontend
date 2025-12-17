"use client";

import Link from "next/link";
import { useAuth, useCart } from "@/src/hooks";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold"
            style={{ color: "#2C5BBB" }}
          >
            Bambite
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/products"
              className={`transition-colors font-medium ${
                isActive("/products") ? "font-bold" : "text-gray-700"
              }`}
              style={isActive("/products") ? { color: "#2C5BBB" } : {}}
            >
              Menu
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  href="/orders"
                  className={`transition-colors font-medium ${
                    isActive("/orders") ? "font-bold" : "text-gray-700"
                  }`}
                  style={isActive("/orders") ? { color: "#2C5BBB" } : {}}
                >
                  My Orders
                </Link>
                <Link
                  href="/cart"
                  className="relative transition-colors font-medium text-gray-700"
                >
                  Cart
                  {itemCount > 0 && (
                    <span
                      className="ml-1 text-white text-xs rounded-full px-2 py-0.5"
                      style={{ backgroundColor: "#2C5BBB" }}
                    >
                      {itemCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="text-sm text-gray-700">Loading...</div>
            ) : isAuthenticated ? (
              <>
                <span className="text-sm text-gray-900 hidden md:inline font-semibold">
                  {user?.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="btn-secondary text-sm cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-secondary text-sm cursor-pointer"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary text-sm cursor-pointer"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {!isLoading && isAuthenticated && (
          <div className="md:hidden flex items-center justify-around py-3 border-t">
            <Link
              href="/products"
              className={`text-sm ${
                isActive("/products") ? "font-bold" : "text-gray-700"
              }`}
              style={isActive("/products") ? { color: "#2C5BBB" } : {}}
            >
              Menu
            </Link>
            <Link
              href="/orders"
              className={`text-sm ${
                isActive("/orders") ? "font-bold" : "text-gray-700"
              }`}
              style={isActive("/orders") ? { color: "#2C5BBB" } : {}}
            >
              Orders
            </Link>
            <Link
              href="/cart"
              className="text-sm text-gray-900 font-medium cursor-pointer"
            >
              Cart {itemCount > 0 && `(${itemCount})`}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
