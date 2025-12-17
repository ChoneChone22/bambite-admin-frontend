/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Order Management Page
 * View all orders and update order status
 */

"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";
import { Order, OrderStatus } from "@/src/types/api";
import { formatPrice, formatDateTime, getStatusColor } from "@/src/lib/utils";

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.orders.getAll();
      setOrders(response);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      await api.orders.updateStatus(orderId, { status: newStatus });
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    }
  };

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter((order) => order.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4" style={{ color: "#000000" }}>
          Order Management
        </h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer ${
              filter === "ALL"
                ? "text-white"
                : "bg-white border border-gray-300 hover:bg-gray-50"
            }`}
            style={
              filter === "ALL"
                ? { backgroundColor: "#2C5BBB" }
                : { color: "#000000" }
            }
          >
            All Orders ({orders.length})
          </button>
          {Object.values(OrderStatus).map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer ${
                  filter === status
                    ? "text-white"
                    : "bg-white border border-gray-300 hover:bg-gray-50"
                }`}
                style={
                  filter === status
                    ? { backgroundColor: "#2C5BBB" }
                    : { color: "#000000" }
                }
              >
                {status} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    #{order.id.slice(0, 8)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm" style={{ color: "#000000" }}>
                    {order.user?.email || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {order.user?.phoneNumber || ""}
                  </div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {(order.orderItems || order.items)?.length || 0} item(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "#000000" }}
                  >
                    {formatPrice(parseFloat(order.netPrice || "0"))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(order.orderedDate || order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="font-semibold hover:underline"
                    style={{ color: "#2C5BBB" }}
                  >
                    Update Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "#000000" }}
            >
              Update Order Status
            </h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Order ID</p>
              <p className="font-semibold">#{selectedOrder.id.slice(0, 8)}</p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Current Status</p>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status}
              </span>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <div className="space-y-2">
                {Object.values(OrderStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedOrder.id, status)}
                    disabled={status === selectedOrder.status}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                      status === selectedOrder.status
                        ? "border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed"
                        : "border-gray-200 hover:border-[--primary] hover:bg-blue-50 cursor-pointer"
                    }`}
                  >
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full mr-2 ${getStatusColor(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
