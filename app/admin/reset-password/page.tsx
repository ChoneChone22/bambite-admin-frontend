/**
 * Admin Reset Password Page
 * Reset password using OTP code received via email
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { getErrorMessage } from "@/src/lib/utils";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";
import OTPInput from "@/src/components/OTPInput";
import PasswordStrength from "@/src/components/PasswordStrength";

const resetPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  otp: Yup.string()
    .length(6, "OTP must be exactly 6 digits")
    .matches(/^\d+$/, "OTP must contain only numbers")
    .required("OTP is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/\d/, "Password must contain at least one number")
    .matches(/[@$!%*?&]/, "Password must contain at least one special character (@$!%*?&)")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your password"),
});

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Pre-fill email from query params if available
  const initialEmail = searchParams?.get("email") || "";

  useEffect(() => {
    // Clear OTP error when OTP changes
    setOtpError("");
  }, [searchParams]);

  const handleSubmit = async (values: {
    email: string;
    otp: string;
    newPassword: string;
  }) => {
    try {
      setIsSubmitting(true);
      setToast(null);
      setOtpError("");

      if (values.otp.length !== 6) {
        setOtpError("OTP must be exactly 6 digits");
        return;
      }

      await api.auth.adminResetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
      });

      setSuccess(true);
      setToast({
        message:
          "Password reset successful. You can now login with your new password.",
        type: "success",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/admin/login?passwordReset=success");
      }, 2000);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage.includes("OTP") ||
        errorMessage.includes("otp") ||
        errorMessage.includes("Invalid") ||
        errorMessage.includes("expired")
      ) {
        setOtpError(errorMessage);
      } else {
        setToast({
          message: errorMessage || "Failed to reset password. Please try again.",
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
            <h2 className="text-2xl font-bold text-gray-900">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been reset successfully. Redirecting to login...
            </p>
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
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter the 6-digit OTP code sent to your email
          </p>
        </div>

        <Formik
          initialValues={{
            email: initialEmail,
            otp: "",
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={resetPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, errors, touched }) => (
            <Form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-xl">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code (6 digits)
                </label>
                <OTPInput
                  value={values.otp}
                  onChange={(otp) => setFieldValue("otp", otp)}
                  error={otpError || (touched.otp && errors.otp ? errors.otp : undefined)}
                  disabled={isSubmitting}
                  autoFocus={!!initialEmail}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the 6-digit code sent to your email. Expires in 15 minutes.
                </p>
                <Link
                  href={`/admin/forgot-password?email=${encodeURIComponent(
                    values.email
                  )}`}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 transition-colors inline-block"
                >
                  Request New OTP
                </Link>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <Field
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Enter new password"
                  disabled={isSubmitting}
                />
                <ErrorMessage
                  name="newPassword"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
                <PasswordStrength password={values.newPassword} />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <Field
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                />
                <ErrorMessage
                  name="confirmPassword"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
                {values.confirmPassword &&
                  values.newPassword !== values.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      Passwords do not match
                    </p>
                  )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    values.otp.length !== 6 ||
                    values.newPassword !== values.confirmPassword
                  }
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Resetting...</span>
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>

              <div className="text-center space-y-2">
                <Link
                  href={`/admin/forgot-password?email=${encodeURIComponent(
                    values.email
                  )}`}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors block"
                >
                  Request New OTP
                </Link>
                <Link
                  href="/admin/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors block"
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
