"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { tokenManager } from "@/src/lib/tokenManager";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";
import { getErrorMessage } from "@/src/lib/utils";

const changePasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .when("$requireEmail", {
      is: true,
      then: (schema) => schema.required("Email is required"),
      otherwise: (schema) => schema.optional(),
    }),
  currentPassword: Yup.string().required("Current password is required"),
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain an uppercase letter")
    .matches(/[a-z]/, "Password must contain a lowercase letter")
    .matches(/[0-9]/, "Password must contain a number")
    .matches(/[^A-Za-z0-9]/, "Password must contain a special character")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your new password"),
});

export default function ChangePasswordPage() {
  const router = useRouter();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);

  useEffect(() => {
    // Get email from stored user data (set during login)
    const user = tokenManager.getUser();
    if (user && user.email) {
      setUserEmail(user.email);
    }
    // Don't redirect - allow manual email entry if not found
    setIsLoadingEmail(false);
  }, []);

  const handleSubmit = async (
    values: {
      email?: string;
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    // Use email from form if provided, otherwise use stored email
    const emailToUse = values.email || userEmail;
    
    if (!emailToUse) {
      setToast({ message: "Email is required.", type: "error" });
      setSubmitting(false);
      return;
    }

    try {
      // Change password - can be used without authentication when mustChangePassword=true
      await api.staffAccounts.changePassword({
        email: emailToUse,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setToast({
        message: "Password changed successfully! Please login again.",
        type: "success",
      });

      // Clear user data and redirect to login
      tokenManager.clearUser();
      setTimeout(() => {
        router.push("/staff/login");
      }, 2000);
    } catch (error: any) {
      console.error("Change password error:", error);
      const errorMessage = getErrorMessage(error);
      setToast({ message: errorMessage, type: "error" });
      setSubmitting(false);
    }
  };

  if (isLoadingEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
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
            Change Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            You must change your password before continuing
          </p>
        </div>

        <Formik
          initialValues={{
            email: userEmail || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={changePasswordSchema}
          validationContext={{ requireEmail: !userEmail }}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-xl">
              <div className="space-y-4">
                {/* Email - only show if not already stored */}
                {!userEmail && (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email *
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
                )}

                {/* Current Password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password
                  </label>
                  <Field
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    className="input-field"
                    placeholder="Enter your current password"
                  />
                  <ErrorMessage
                    name="currentPassword"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                </div>

                {/* New Password */}
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
                    className="input-field"
                    placeholder="Enter your new password"
                  />
                  <ErrorMessage
                    name="newPassword"
                    component="div"
                    className="text-red-500 text-sm mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="input-field"
                    placeholder="Confirm your new password"
                  />
                  <ErrorMessage
                    name="confirmPassword"
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
                      <span className="ml-2">Changing password...</span>
                    </>
                  ) : (
                    "Change Password"
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

