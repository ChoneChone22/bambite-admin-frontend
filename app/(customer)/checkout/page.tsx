"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useAuth, useCart } from "@/src/hooks";
import api from "@/src/services/api";
import { checkoutSchema } from "@/src/lib/validations";
import { CheckoutFormValues } from "@/src/types";
import { formatPrice, getErrorMessage } from "@/src/lib/utils";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, total, clearCart, isLoading: cartLoading } = useCart();
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    // Only redirect if cart is not loading and is actually empty
    if (!authLoading && !cartLoading && (!items || items.length === 0)) {
      router.push("/cart");
    }
  }, [isAuthenticated, authLoading, items, cartLoading, router]);

  const initialValues: CheckoutFormValues = {
    phoneNumber: user?.phoneNumber || "",
    address: user?.address || "",
    notes: "",
  };

  const handleSubmit = async (values: CheckoutFormValues) => {
    try {
      const orderItems = (items || []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const order = await api.orders.create({ items: orderItems });

      setToast({ message: "Order placed successfully!", type: "success" });
      await clearCart();

      setTimeout(() => {
        router.push(`/orders/${order.id}`);
      }, 1500);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setToast({
        message: errorMessage.includes("stock")
          ? "Not enough stock for one or more items"
          : errorMessage,
        type: "error",
      });
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container-custom max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <Formik
          initialValues={initialValues}
          validationSchema={checkoutSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Delivery Information */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Delivery Information
                    </h2>

                    <div className="space-y-4">
                      {/* Phone Number */}
                      <div>
                        <label
                          htmlFor="phoneNumber"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Phone Number
                        </label>
                        <Field
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          className="input-field"
                          placeholder="+1 (555) 000-0000"
                        />
                        <ErrorMessage
                          name="phoneNumber"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Delivery Address
                        </label>
                        <Field
                          id="address"
                          name="address"
                          as="textarea"
                          rows={4}
                          className="input-field"
                          placeholder="123 Main St, Apt 4B, City, State, ZIP"
                        />
                        <ErrorMessage
                          name="address"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label
                          htmlFor="notes"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Delivery Notes (Optional)
                        </label>
                        <Field
                          id="notes"
                          name="notes"
                          as="textarea"
                          rows={3}
                          className="input-field"
                          placeholder="e.g., Ring doorbell, Leave at door, etc."
                        />
                        <ErrorMessage
                          name="notes"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Order Items
                    </h2>
                    <div className="space-y-3">
                      {(items || []).map((item) => (
                        <div
                          key={item.productId}
                          className="flex justify-between items-center py-2 border-b"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(
                              parseFloat(item.price) * item.quantity
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Order Summary
                    </h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery</span>
                        <span className="text-green-600">FREE</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax</span>
                        <span>{formatPrice(0)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span
                          className="font-bold"
                          style={{ color: "#2C5BBB" }}
                        >
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary text-lg py-3 flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Placing order...</span>
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center mt-4">
                      By placing your order, you agree to our terms and
                      conditions
                    </p>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
