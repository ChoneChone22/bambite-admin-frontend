/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Order Management Page
 * View all orders and update order status
 */

"use client";

import React, { useEffect, useState, useMemo } from "react";
import api from "@/src/services/api";
import { Order, OrderStatus } from "@/src/types/api";
import { formatPrice, formatDateTime, getStatusColor, formatOrderItemOptions } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import { useRealtimeOrders } from "@/src/hooks/useRealtimeOrders";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [optionDisplayMap, setOptionDisplayMap] = useState<Map<string, string>>(new Map());
  const modal = useModal();

  const fetchOptions = async () => {
    try {
      const options = await api.options.getAll();
      const map = new Map<string, string>();
      (options || []).forEach((opt: { id: string; displayName: string }) => {
        map.set(opt.id, opt.displayName);
      });
      setOptionDisplayMap(map);
    } catch {
      // Options fetch is optional - fallback to raw values
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.orders.getAll();
      setOrders(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOptions();
  }, []);

  // Real-time: WebSocket (order:new, order:updated) + polling fallback when disconnected
  useRealtimeOrders({
    orders,
    setOrders,
    enabled: true,
    pollIntervalMs: 20_000,
  });

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
        const email = (order.email ?? order.user?.email)?.toLowerCase() || "";
        const phone = (order.phoneNumber ?? order.user?.phoneNumber)?.toLowerCase() || "";
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
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div>
      {modal.ModalComponent}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-foreground">
          Order Management
        </h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer ${
              filter === "ALL"
                ? ""
                : "bg-card border border-border hover:bg-accent hover:text-accent-foreground"
            }`}
            style={
              filter === "ALL"
                ? {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }
                : {
                    color: 'hsl(var(--foreground))'
                  }
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
                    ? ""
                    : "bg-card border border-border hover:bg-accent hover:text-accent-foreground"
                }`}
                style={
                  filter === status
                    ? {
                        backgroundColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))'
                      }
                    : {
                        color: 'hsl(var(--foreground))'
                      }
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
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-foreground"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedData.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="bg-card hover:bg-muted transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                  >
                    #{order.id.slice(0, 8)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">
                    {order.email ?? order.user?.email ?? "N/A"}
                  </div>
                  <div className="text-sm text-foreground">
                    {order.phoneNumber ?? order.user?.phoneNumber ?? ""}
                  </div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                >
                  {(order.orderItems || order.items)?.length || 0} item(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-semibold"
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
                  className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
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
                  <td colSpan={7} className="px-6 py-4 bg-muted">
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h3 className="text-lg font-semibold mb-4 text-foreground">
                        Order Items
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Options
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Unit Price
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-card divide-y divide-gray-200">
                            {((order.orderItems || order.items) || []).length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-foreground">
                                  No items found
                                </td>
                              </tr>
                            ) : (
                              (order.orderItems || order.items || []).map((item) => {
                                const unitPrice = item.price || parseFloat(item.priceAtTime || item.netPrice || "0");
                                const subtotal = unitPrice * (item.quantity || 0);
                                const optionsText =
                                  item.selectedOptionsSnapshot &&
                                  Object.keys(item.selectedOptionsSnapshot).length > 0
                                    ? formatOrderItemOptions(item.selectedOptionsSnapshot, optionDisplayMap)
                                    : null;
                                return (
                                  <tr key={item.id || item.productId} className="hover:bg-muted">
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
                                            <span className="text-xs text-foreground">No Image</span>
                                          </div>
                                        )}
                                        <div>
                                          <div className="text-sm font-medium text-foreground">
                                            {item.product?.name || "Unknown Product"}
                                          </div>
                                          {item.product?.thaiName && (
                                            <div className="text-xs text-foreground">
                                              {item.product.thaiName}
                                            </div>
                                          )}
                                          {item.product?.category && (
                                            <div className="text-xs text-foreground">
                                              {item.product.category.name}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <div className="text-sm text-muted-foreground max-w-[200px]">
                                        {optionsText ?? "—"}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-foreground">
                                        {item.quantity || 0}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-foreground">
                                        {formatPrice(unitPrice)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right">
                                      <div className="text-sm font-semibold text-foreground">
                                        {formatPrice(subtotal)}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                          <tfoot className="bg-muted">
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                                Total:
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
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
              <p className="text-sm mb-2 text-foreground">Order ID</p>
              <p className="font-semibold text-foreground">
                #{selectedOrder.id.slice(0, 8)}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm mb-2 text-foreground">Current Status</p>
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
                className="block text-sm font-medium mb-2 text-foreground"
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
                        ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                        : "border-border hover:border-primary hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
              className="btn-secondary w-full cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </FormModal>
    </div>
  );
}
