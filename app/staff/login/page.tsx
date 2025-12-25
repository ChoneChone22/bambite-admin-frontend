"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import api from "@/src/services/api";
import { tokenManager } from "@/src/lib/tokenManager";
import { loginSchema } from "@/src/lib/validations";
import { LoginFormValues } from "@/src/types";
import { UserRole } from "@/src/types/api";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";
import { getErrorMessage } from "@/src/lib/utils";

export default function StaffLoginPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  const handleSubmit = async (values: LoginFormValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      // Use API service method for consistency
      // Cookies are automatically set by backend via Set-Cookie headers
      const authData = await api.auth.staffLogin(values);
      
      // Tokens are now in httpOnly cookies (set by backend automatically)
      // Response contains staff account data only
      const staffAccount = authData.staffAccount || authData.user;

      if (!staffAccount) {
        throw new Error("No staff account data received from server");
      }

      // Check if password change is required
      // When mustChangePassword=true, login succeeds but tokens are NOT set
      // User must change password first before getting tokens
      if (staffAccount.mustChangePassword) {
        // Store user data temporarily (without tokens, as they weren't set)
        const staffWithRole = { ...staffAccount, role: UserRole.STAFF };
        tokenManager.setUser(staffWithRole);
        
        // Redirect to password change page
        setToast({ 
          message: "Password change required. Please set a new password.", 
          type: "info"
        });
        setTimeout(() => router.push("/staff/change-password"), 1000);
        return;
      }

      // Normal login flow - tokens are in httpOnly cookies
      // Add role to staff account object
      const staffWithRole = { ...staffAccount, role: UserRole.STAFF };

      // Store user data only (tokens are in httpOnly cookies, not accessible via JS)
      tokenManager.setUser(staffWithRole);

      // Dispatch auth change event
      window.dispatchEvent(new Event("auth-change"));

      setToast({ message: "Staff login successful!", type: "success" });
      
      // Redirect after short delay to allow cookies to be set
      // Backend automatically sets accessToken_staff and refreshToken_staff cookies
      // Redirect to staff dashboard (separate from admin dashboard)
      setTimeout(() => {
        router.push("/staff/dashboard");
      }, 1000);
    } catch (error: any) {
      console.error("Staff login error:", error);
      const errorMessage = getErrorMessage(error);
      setToast({ message: errorMessage, type: "error" });
      setSubmitting(false); // Ensure form is not stuck in submitting state
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
            Staff Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Sign in to access your staff account
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setSubmitting }) => (
            <Form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-xl">
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Staff Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="input-field"
                    placeholder="staff@bambite.com"
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
                    "🔐 Staff Sign In"
                  )}
                </button>
              </div>

            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

