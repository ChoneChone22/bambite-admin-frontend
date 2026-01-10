/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Order Management Page
 * View all orders and update order status
 */

"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/src/services/api";
import { Order, OrderStatus } from "@/src/types/api";
import { formatPrice, formatDateTime, getStatusColor } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const modal = useModal();

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
      await modal.alert(
        err.message || "Failed to update order status",
        "Error",
        "error"
      );
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered =
      filter === "ALL"
        ? orders
        : orders.filter((order) => order.status === filter);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const orderId = order.id?.toLowerCase() || "";
        const email = order.user?.email?.toLowerCase() || "";
        const phone = order.user?.phoneNumber?.toLowerCase() || "";
        const netPrice = order.netPrice?.toString() || "";
        const status = order.status?.toLowerCase() || "";
        const date = order.orderedDate || order.createdAt || "";
        return (
          orderId.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          netPrice.includes(query) ||
          status.includes(query) ||
          date.includes(query)
        );
      });
    }

    return filtered;
  }, [orders, filter, searchQuery]);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(filteredOrders, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  return (
    <div>
      {modal.ModalComponent}
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

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search orders by ID, customer email, phone, amount, status, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full max-w-md"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm"
                    style={{ color: "#6b7280" }}
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedData.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50">
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
                  <div className="text-sm" style={{ color: "#6b7280" }}>
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
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#6b7280" }}
                >
                  {formatDateTime(order.orderedDate || order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    {expandedOrderId === order.id ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#16a34a", cursor: "pointer" }}
                  >
                    Update Status
                  </button>
                </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr key={`${order.id}-details`}>
                  <td colSpan={7} className="px-6 py-4 bg-gray-50">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold mb-4" style={{ color: "#000000" }}>
                        Order Items
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Unit Price
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {((order.orderItems || order.items) || []).length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "#6b7280" }}>
                                  No items found
                                </td>
                              </tr>
                            ) : (
                              (order.orderItems || order.items || []).map((item) => {
                                const unitPrice = item.price || parseFloat(item.priceAtTime || item.netPrice || "0");
                                const subtotal = unitPrice * (item.quantity || 0);
                                return (
                                  <tr key={item.id || item.productId} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        {item.product?.imageUrls && item.product.imageUrls.length > 0 ? (
                                          <img
                                            src={item.product.imageUrls[0]}
                                            alt={item.product.name}
                                            className="h-12 w-12 rounded object-cover mr-3"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = "/file.svg";
                                            }}
                                          />
                                        ) : (
                                          <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center mr-3">
                                            <span className="text-xs" style={{ color: "#6b7280" }}>No Image</span>
                                          </div>
                                        )}
                                        <div>
                                          <div className="text-sm font-medium" style={{ color: "#000000" }}>
                                            {item.product?.name || "Unknown Product"}
                                          </div>
                                          {item.product?.thaiName && (
                                            <div className="text-xs" style={{ color: "#6b7280" }}>
                                              {item.product.thaiName}
                                            </div>
                                          )}
                                          {item.product?.category && (
                                            <div className="text-xs" style={{ color: "#9ca3af" }}>
                                              {item.product.category.name}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium" style={{ color: "#000000" }}>
                                        {item.quantity || 0}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm" style={{ color: "#000000" }}>
                                        {formatPrice(unitPrice)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                      <div className="text-sm font-semibold" style={{ color: "#000000" }}>
                                        {formatPrice(subtotal)}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "#000000" }}>
                                Total:
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: "#000000" }}>
                                {formatPrice(parseFloat(order.netPrice || "0"))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </td>
                </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredOrders.length > 0 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            minRowsPerPage={10}
            maxRowsPerPage={50}
          />
        )}
      </div>

      {/* Status Update Modal */}
      <FormModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Update Order Status"
        maxWidth="md"
      >
        {selectedOrder && (
          <>
            <div className="mb-6">
              <p className="text-sm mb-2" style={{ color: "#4b5563" }}>Order ID</p>
              <p className="font-semibold" style={{ color: "#6b7280" }}>
                #{selectedOrder.id.slice(0, 8)}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm mb-2" style={{ color: "#4b5563" }}>Current Status</p>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                  selectedOrder.status
                )}`}
              >
                {selectedOrder.status}
              </span>
            </div>

            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#374151" }}
              >
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
          </>
        )}
      </FormModal>
    </div>
  );
}
