"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/src/components/theme-toggle";
import axiosInstance from "@/src/lib/axios";
import { tokenManager } from "@/src/lib/tokenManager";
import { loginSchema } from "@/src/lib/validations";
import { LoginFormValues } from "@/src/types";
import { ApiResponse, AuthResponse, UserRole } from "@/src/types/api";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { getErrorMessage } from "@/src/lib/utils";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";

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
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Toast Alerts */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert variant={toast.type === "error" ? "destructive" : "default"} className="shadow-lg">
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{toast.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the admin dashboard
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values, handleChange, handleBlur, touched, errors }) => (
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Enter your credentials to continue</CardDescription>
              </CardHeader>
              <CardContent>
                <Form className="space-y-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Admin Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@bambite.com"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.email && errors.email ? "border-destructive" : ""}
                    />
                    {touched.email && errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={touched.password && errors.password ? "border-destructive" : ""}
                    />
                    {touched.password && errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Admin Sign In
                      </>
                    )}
                  </Button>

                  {/* Forgot Password Link */}
                  <div className="text-center pt-2">
                    <Link
                      href="/admin/forgot-password"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </Form>
              </CardContent>
            </Card>
          )}
        </Formik>
      </div>
    </div>
  );
}
