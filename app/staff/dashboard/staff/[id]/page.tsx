"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/src/services/api";
import { Staff, Payment } from "@/src/types/api";
import { formatPrice } from "@/src/lib/utils";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { MonthPicker } from "@/components/ui/month-picker";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState<{
    paidMonth?: string;
  }>({});

  useEffect(() => {
    const fetchStaff = async () => {
      if (!staffId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.staff.getById(staffId);
        
        // Ensure we have valid staff data
        if (data && typeof data === "object") {
          // Parse numeric fields properly
          const normalizedStaff: Staff = {
            ...data,
            salary:
              typeof data.salary === "string"
                ? parseFloat(data.salary) || 0
                : data.salary || 0,
            totalBonus:
              typeof data.totalBonus === "string"
                ? parseFloat(data.totalBonus) || 0
                : data.totalBonus || 0,
            tax:
              typeof data.tax === "number"
                ? data.tax
                : typeof data.tax === "string"
                ? parseFloat(data.tax) || 0
                : 0,
          };
          setStaff(normalizedStaff);
        } else {
          throw new Error("Invalid staff data received");
        }
      } catch (err: any) {
        console.error("Failed to fetch staff detail:", err);
        setError(err?.message || "Failed to load staff details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [staffId]);

  // Fetch payments for this staff member
  useEffect(() => {
    const fetchPayments = async () => {
      if (!staff?.id) return;
      setIsLoadingPayments(true);
      try {
        const paymentsData = await api.payments.getByStaffId(staff.id, {
          paidMonth: paymentFilters.paidMonth,
          page: 1,
          limit: 1000, // Fetch all for client-side pagination
        });
        setPayments(paymentsData || []);
      } catch (err: any) {
        console.error("Failed to fetch payments:", err);
        setPayments([]);
      } finally {
        setIsLoadingPayments(false);
      }
    };
    fetchPayments();
  }, [staff?.id, paymentFilters.paidMonth]);

  // Table pagination for payments
  const {
    paginatedData: paginatedPayments,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(payments, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm mb-4 cursor-pointer"
            style={{ color: "#4b5563", cursor: "pointer" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#4b5563";
            }}
          >
            ← Back to Staff List
          </button>
          <h1 className="text-3xl font-bold mb-1 text-foreground">
            Staff Details
          </h1>
        </div>
        <div className="bg-card rounded-lg shadow p-6">
          <p className="text-sm text-foreground">
            {error || "Staff member not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm mb-4 cursor-pointer"
          style={{ color: "#4b5563", cursor: "pointer" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#111827";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#4b5563";
          }}
        >
          ← Back to Staff List
        </button>
        <h1 className="text-3xl font-bold mb-1 text-foreground">
          {staff.name || staff.user?.email || "Staff Detail"}
        </h1>
        <p className="text-sm text-foreground">
          Employee ID: {staff.employeeId || "—"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2 text-foreground">
            Basic Information
          </h2>
          <DetailRow label="Employee ID" value={staff.employeeId || "—"} />
          <DetailRow
            label="Name"
            value={staff.name || staff.user?.email || "—"}
          />
          <DetailRow
            label="Department"
            value={
              staff.department
                ? `${staff.department.name} (${staff.department.shortName})`
                : "—"
            }
          />
          <DetailRow label="Position" value={staff.position || "—"} />
          <DetailRow
            label="Status"
            value={staff.status || "—"}
            valueClassName={
              staff.status === "active"
                ? "text-green-600"
                : staff.status === "on_leave"
                ? "text-yellow-600"
                : "text-muted-foreground"
            }
          />
        </div>

        <div className="bg-card rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2 text-foreground">
            Compensation
          </h2>
          <DetailRow
            label="Base Salary"
            value={
              typeof staff.salary === "number" && !isNaN(staff.salary)
                ? formatPrice(staff.salary)
                : "฿0.00"
            }
          />
          <DetailRow label="Bonus" value={formatPrice(staff.totalBonus || 0)} />
          <DetailRow label="Tax" value={formatPrice(staff.tax || 0)} />
          <DetailRow
            label="Net Pay (latest)"
            value={
              typeof staff.netPay === "number"
                ? formatPrice(staff.netPay)
                : "Calculated per payment"
            }
          />
        </div>
      </div>

      {/* Payment History */}
      {staff?.id && (
        <div className="mt-6 bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Payment History
            </h2>
          </div>

          {/* Date Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Filter by Paid Month (YYYY-MM)
            </label>
            <div className="flex gap-2">
              <MonthPicker
                value={paymentFilters.paidMonth ?? ""}
                onChange={(v) =>
                  setPaymentFilters((prev) => ({
                    ...prev,
                    paidMonth: v || undefined,
                  }))
                }
                placeholder="Filter by month"
                className="min-w-[200px]"
              />
              {paymentFilters.paidMonth && (
                <button
                  onClick={() => setPaymentFilters({})}
                  className="btn-secondary cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Payments Table */}
          {isLoadingPayments ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <>
              <div className="bg-card rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Paid Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Bonus
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Tax
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Total Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200">
                      {paginatedPayments.length > 0 ? (
                        paginatedPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-background">
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              {payment.paidMonth}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm capitalize"
                            >
                              {payment.paymentMethod?.replace("_", " ") || "—"}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              {formatPrice(staff?.salary || payment.staff?.salary || 0)}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              {formatPrice(payment.bonus || 0)}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                            >
                              {formatPrice(payment.tax || 0)}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                            >
                              {formatPrice(payment.totalPayment || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  payment.isPaid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {payment.isPaid ? "Paid" : "Pending"}
                              </span>
                            </td>
                            <td
                              className="px-6 py-4 text-sm max-w-xs truncate text-foreground"
                              title={payment.note || ""}
                            >
                              {payment.note || "—"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-12 text-center text-muted-foreground"
                          >
                            No payment records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {payments.length > 0 && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRows={totalRows}
                  rowsPerPage={rowsPerPage}
                  onPageChange={handlePageChange}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  minRowsPerPage={10}
                  maxRowsPerPage={50}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  // Determine value color based on valueClassName or default
  const getValueColor = () => {
    if (valueClassName?.includes("green")) return "#16a34a";
    if (valueClassName?.includes("yellow")) return "#ca8a04";
    if (valueClassName?.includes("gray")) return "#4b5563";
    return "#000000"; // Default black
  };

  return (
    <div className="flex justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <span className="font-medium" style={{ color: getValueColor() }}>
        {value}
      </span>
    </div>
  );
}
