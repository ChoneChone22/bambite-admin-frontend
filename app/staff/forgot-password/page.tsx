/**
 * Staff Forgot Password Page
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

export default function StaffForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pre-fill email from query params if available
  const initialEmail = searchParams?.get("email") || "";

  const handleSubmit = async (values: { email: string }) => {
    try {
      setIsSubmitting(true);
      setToast(null);

      await api.staffAccounts.forgotPassword({ email: values.email });

      setSuccess(true);
      setToast({
        message:
          "If an account exists with this email, a password reset OTP has been sent. Please check your email.",
        type: "success",
      });
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              If an account exists with this email, a password reset OTP has been sent.
              Please check your email.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              The OTP code will expire in 15 minutes.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href={`/staff/reset-password?email=${encodeURIComponent(
                searchParams?.get("email") || ""
              )}`}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Enter OTP Code
            </Link>
            <Link
              href="/staff/login"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter your email address to receive a password reset OTP
          </p>
        </div>

        <Formik
          initialValues={{ email: initialEmail }}
          validationSchema={forgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-xl">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="staff@bambite.com"
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
                  href="/staff/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
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
