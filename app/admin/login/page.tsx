"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import axiosInstance from "@/src/lib/axios";
import { tokenManager } from "@/src/lib/tokenManager";
import { loginSchema } from "@/src/lib/validations";
import { LoginFormValues } from "@/src/types";
import { ApiResponse, AuthResponse, UserRole } from "@/src/types/api";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";
import { getErrorMessage } from "@/src/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        "/auth/admin/login",
        values
      );

      const authData = response.data.data;
      
      // Extract tokens from response (for Safari/iOS support)
      // Backend returns tokens in data.tokens object
      if (authData.tokens) {
        localStorage.setItem("accessToken", authData.tokens.accessToken);
        localStorage.setItem("refreshToken", authData.tokens.refreshToken);
        localStorage.setItem("userRole", "admin");
      }
      
      // Response contains admin data
      const admin = authData.admin || authData.user;

      if (!admin) {
        throw new Error("No admin data received from server");
      }

      // Add role to admin object
      const adminWithRole = { ...admin, role: UserRole.ADMIN };

      // Store user data
      // Backend sets cookies (for Chrome) and we store tokens in localStorage (for Safari/iOS)
      tokenManager.setUser(adminWithRole);

      // Dispatch auth change event
      window.dispatchEvent(new Event("auth-change"));

      setToast({ message: "Admin login successful!", type: "success" });
      
      // Redirect after short delay to allow cookies to be set
      // Backend automatically sets accessToken_admin and refreshToken_admin cookies (Chrome)
      // Tokens are also stored in localStorage (Safari/iOS)
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Admin login error:", error);
      setToast({ message: getErrorMessage(error), type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            Admin Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Sign in to access the admin dashboard
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-xl">
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Admin Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="input-field"
                    placeholder="admin@bambite.com"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    className="input-field"
                    placeholder="Enter your password"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Signing in...</span>
                    </>
                  ) : (
                    "🔐 Admin Sign In"
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/admin/forgot-password"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
