"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Formik, Form } from "formik";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/src/components/theme-toggle";
import api from "@/src/services/api";
import { tokenManager } from "@/src/lib/tokenManager";
import { loginSchema } from "@/src/lib/validations";
import { LoginFormValues } from "@/src/types";
import { UserRole } from "@/src/types/api";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { getErrorMessage } from "@/src/lib/utils";
import { AlertCircle, CheckCircle, Lock, Users } from "lucide-react";

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
      // Backend sets cookies (for Chrome) AND returns tokens in response body (for Safari/iOS)
      const authData = await api.auth.staffLogin(values);
      
      // Extract tokens from response (for Safari/iOS support)
      // Backend returns tokens in data.tokens object
      if (authData.tokens) {
        localStorage.setItem("accessToken", authData.tokens.accessToken);
        localStorage.setItem("refreshToken", authData.tokens.refreshToken);
        localStorage.setItem("userRole", "staff");
      }
      
      // Response contains staff account data
      const staffAccount = authData.staffAccount || authData.user;

      if (!staffAccount) {
        throw new Error("No staff account data received from server");
      }

      // Check if password change is required
      // When mustChangePassword=true, login succeeds but tokens are NOT set
      // User must change password first before getting tokens
      // Type guard: check if it's a StaffAccount (has mustChangePassword property)
      if ('mustChangePassword' in staffAccount && staffAccount.mustChangePassword) {
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

      // Normal login flow
      // Backend sets cookies (for Chrome) and we store tokens in localStorage (for Safari/iOS)
      // Add role to staff account object
      const staffWithRole = { ...staffAccount, role: UserRole.STAFF };

      // Store user data
      tokenManager.setUser(staffWithRole);

      // Dispatch auth change event
      window.dispatchEvent(new Event("auth-change"));

      setToast({ message: "Staff login successful!", type: "success" });
      
      // Redirect after short delay to allow cookies to be set
      // Backend automatically sets accessToken_staff and refreshToken_staff cookies (Chrome)
      // Tokens are also stored in localStorage (Safari/iOS)
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
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Toast Alerts */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert 
            variant={toast.type === "error" ? "destructive" : "default"} 
            className="shadow-lg"
          >
            {toast.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : toast.type === "info" ? (
              <AlertCircle className="h-4 w-4" />
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
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Staff Portal
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the staff dashboard
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
                    <Label htmlFor="email">Staff Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="staff@bambite.com"
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
                        Staff Sign In
                      </>
                    )}
                  </Button>

                  {/* Forgot Password Link */}
                  <div className="text-center pt-2">
                    <Link
                      href="/staff/forgot-password"
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
