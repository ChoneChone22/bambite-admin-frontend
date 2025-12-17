"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useOrders } from "@/src/hooks";
import { formatPrice, formatDateTime, getStatusColor } from "@/src/lib/utils";
import LoadingSpinner from "@/src/components/LoadingSpinner";

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { orders, isLoading } = useOrders();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            No orders yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start shopping and your orders will appear here
          </p>
          <button
            onClick={() => router.push("/products")}
            className="btn-primary"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Order #{order.id?.substring(0, 8).toUpperCase() || "N/A"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(order.orderedDate || order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 md:mt-0 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">
                      {(order.orderItems || order.items)?.length || 0}{" "}
                      {(order.orderItems || order.items)?.length === 1
                        ? "item"
                        : "items"}
                    </span>
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "#2C5BBB" }}
                    >
                      {formatPrice(parseFloat(order.netPrice || "0"))}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {(order.orderItems || order.items)
                      ?.slice(0, 3)
                      .map((item, index) => (
                        <span key={index}>
                          {item.product?.name || "Product"}
                          {index <
                            Math.min(
                              2,
                              ((order.orderItems || order.items)?.length || 0) -
                                1
                            ) && ", "}
                        </span>
                      ))}
                    {((order.orderItems || order.items)?.length || 0) > 3 &&
                      ` and ${
                        ((order.orderItems || order.items)?.length || 0) - 3
                      } more...`}
                  </div>
                </div>

                <div
                  className="mt-4 flex items-center font-semibold text-sm"
                  style={{ color: "#2C5BBB" }}
                >
                  View Details →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
