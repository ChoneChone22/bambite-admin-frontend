"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/src/services/api";
import { Order } from "@/src/types/api";
import { PLACEHOLDER_IMAGE } from "@/src/types";
import {
  formatPrice,
  formatDateTime,
  getStatusColor,
  getErrorMessage,
} from "@/src/lib/utils";
import { useAuth } from "@/src/hooks";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (params.id) {
      fetchOrder(params.id as string);
    }
  }, [params.id]);

  const fetchOrder = async (id: string) => {
    setIsLoading(true);
    try {
      let data = await api.orders.getById(id);
      // If data is wrapped in an 'order' property, extract it
      if (
        data &&
        typeof data === "object" &&
        "order" in data &&
        (data as any).order
      ) {
        data = (data as any).order;
      }
      setOrder(data);
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setIsCancelling(true);
    try {
      await api.orders.cancel(order.id);
      setToast({ message: "Order cancelled successfully", type: "success" });
      await fetchOrder(order.id);
    } catch (error) {
      setToast({ message: getErrorMessage(error), type: "error" });
    } finally {
      setIsCancelling(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Order not found
        </h2>
        <button onClick={() => router.push("/orders")} className="btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  const canCancel = ["PENDING", "PROCESSING"].includes(order.status);

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
        <button
          onClick={() => router.push("/orders")}
          className="mb-6 flex items-center font-semibold cursor-pointer"
          style={{ color: "#000000" }}
        >
          ← Back to Orders
        </button>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order.id?.substring(0, 8).toUpperCase() || "N/A"}
              </h1>
              <p className="text-gray-600">
                Placed on {formatDateTime(order.orderedDate || order.createdAt)}
              </p>
            </div>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mt-4 md:mt-0 ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          {canCancel && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="btn-secondary text-red-600 border-red-600 hover:bg-red-50"
            >
              {isCancelling ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Cancelling...</span>
                </>
              ) : (
                "Cancel Order"
              )}
            </button>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Items</h2>
          <div className="space-y-4">
            {(order.orderItems || order.items || []).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-4 border-b last:border-b-0"
              >
                <div className="relative h-20 w-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={PLACEHOLDER_IMAGE}
                    alt={item.product?.name || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.product?.name || "Product"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                  {(item.priceAtTime || item.price) && (
                    <p className="text-sm text-gray-600">
                      Price:{" "}
                      {formatPrice(
                        parseFloat(item.priceAtTime || String(item.price || 0))
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatPrice(
                      parseFloat(
                        item.netPrice ||
                          String(
                            (item.price || item.product?.price || 0) *
                              item.quantity
                          )
                      )
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Order Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(parseFloat(order.netPrice || "0"))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="text-green-600">FREE</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatPrice(0)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-2xl font-bold">
              <span style={{ color: "#000000" }}>Total</span>
              <span className="font-bold" style={{ color: "#2C5BBB" }}>
                {formatPrice(parseFloat(order.netPrice || "0"))}
              </span>
            </div>
          </div>

          {order.status === "DELIVERED" && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold text-center">
                ✓ This order has been delivered
              </p>
            </div>
          )}

          {order.status === "CANCELLED" && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold text-center">
                This order has been cancelled
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
