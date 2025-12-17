"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useAuth } from "@/src/hooks";
import { loginSchema } from "@/src/lib/validations";
import { LoginFormValues } from "@/src/types";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";
import { getErrorMessage } from "@/src/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const initialValues: LoginFormValues = {
    email: "",
    password: "",
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/products");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      setToast({ message: "Login successful!", type: "success" });
      // useEffect will handle redirect when isAuthenticated changes
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to Bambite
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md">
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
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
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Signing in...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/register"
                  className="font-semibold"
                  style={{ color: "#2C5BBB" }}
                >
                  Create an account
                </Link>
                <Link
                  href="/admin/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Admin Login →
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
