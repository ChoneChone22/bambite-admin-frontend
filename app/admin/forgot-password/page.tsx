/**
 * Admin Forgot Password Page
 * Request password reset OTP via email
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { getErrorMessage } from "@/src/lib/utils";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill email from query params if available
  const initialEmail = searchParams?.get("email") || "";

  const handleSubmit = async (values: { email: string }) => {
    try {
      setIsSubmitting(true);
      setToast(null);

      await api.auth.adminForgotPassword({ email: values.email });

      // Show success toast and auto-redirect to reset-password page
      setToast({
        message:
          "If an account exists with this email, a password reset OTP has been sent. Please check your email.",
        type: "success",
      });

      // Auto-redirect after a brief delay to show the success message
      setTimeout(() => {
        router.push(`/admin/reset-password?email=${encodeURIComponent(values.email)}`);
      }, 1500);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      if (error?.response?.status === 429) {
        setToast({
          message:
            "Too many password reset requests. Please wait before requesting another OTP.",
          type: "error",
        });
      } else {
        setToast({
          message: errorMessage || "Failed to send OTP. Please try again.",
          type: "error",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email address to receive a password reset OTP
          </p>
        </div>

        <Formik
          initialValues={{ email: initialEmail }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="mt-8 space-y-6 bg-card p-8 rounded-lg shadow-xl">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Admin Email
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="admin@bambite.com"
                  disabled={isSubmitting}
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Sending...</span>
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/admin/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
