"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/src/services/api";
import { StaffAccount, Payment } from "@/src/types/api";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import { formatPrice } from "@/src/lib/utils";

// Helper function to format permission code (replace underscores with spaces and capitalize)
const formatPermissionCode = (code: string): string => {
  if (!code) return "Unnamed Permission";
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function StaffAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params?.id as string;

  const [account, setAccount] = useState<StaffAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState<{
    paidMonth?: string;
  }>({});

  // Fetch staff account
  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId) return;
      setIsLoading(true);
      setError(null);
      try {
        // Use getById() for admin viewing staff account - NOT getProfile()
        const data = await api.staffAccounts.getById(accountId);
        setAccount(data);
      } catch (err: any) {
        console.error("Failed to fetch staff account:", err);
        setError(err?.message || "Failed to load staff account");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccount();
  }, [accountId]);

  // Fetch payments for this staff member
  useEffect(() => {
    const fetchPayments = async () => {
      if (!account?.staff?.id) return;
      setIsLoadingPayments(true);
      try {
        const paymentsData = await api.payments.getByStaffId(account.staff.id, {
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
  }, [account?.staff?.id, paymentFilters.paidMonth]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[--primary]"></div>
      </div>
    );
  }

  if (error || !account) {
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
            ← Back to Staff Accounts
          </button>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "#000000" }}>
            Staff Account Details
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm" style={{ color: "#dc2626" }}>{error || "Staff account not found."}</p>
        </div>
      </div>
    );
  }

  const staff = account.staff;

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
          ← Back to Staff Accounts
        </button>
        <h1 className="text-3xl font-bold mb-1" style={{ color: "#000000" }}>
          Staff Account Details
        </h1>
        <p className="text-sm" style={{ color: "#4b5563" }}>
          View staff account information and permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
            Account Information
          </h2>
          <DetailRow label="Email" value={account.email} />
          <DetailRow
            label="Account Status"
            value={account.staff?.status === "active" ? "Active" : "Inactive"}
            valueClassName={
              account.staff?.status === "active" ? "text-green-600" : "text-gray-600"
            }
          />
          {account.mustChangePassword && (
            <DetailRow
              label="Password Status"
              value="Must change password"
              valueClassName="text-yellow-600"
            />
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>
            Staff Information
          </h2>
          <DetailRow
            label="Employee ID"
            value={staff?.employeeId || "—"}
          />
          <DetailRow label="Name" value={staff?.name || "—"} />
          <DetailRow label="Position" value={staff?.position || "—"} />
          <DetailRow
            label="Department"
            value={
              staff?.department
                ? `${staff.department.name} (${staff.department.shortName})`
                : "—"
            }
          />
          <DetailRow
            label="Status"
            value={staff?.status || "—"}
            valueClassName={
              staff?.status === "active"
                ? "text-green-600"
                : staff?.status === "on_leave"
                ? "text-yellow-600"
                : "text-gray-600"
            }
          />
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#000000" }}>
          Permissions
        </h2>
        {account.permissions && account.permissions.length > 0 ? (
          <ul className="list-disc list-inside text-sm space-y-2" style={{ color: "#1f2937" }}>
            {account.permissions.map((perm) => (
              <li key={perm.id}>
                <span className="font-medium" style={{ color: "#1f2937" }}>
                  {formatPermissionCode(perm.code || "")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm" style={{ color: "#4b5563" }}>
            No explicit permissions assigned.
          </p>
        )}
      </div>

      {/* Payment History */}
      {account.staff?.id && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: "#000000" }}>
              Payment History
            </h2>
          </div>

          {/* Date Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
              Filter by Paid Month (YYYY-MM)
            </label>
            <div className="flex gap-2">
              <input
                type="month"
                className="input-field"
                value={paymentFilters.paidMonth || ""}
                onChange={(e) =>
                  setPaymentFilters((prev) => ({
                    ...prev,
                    paidMonth: e.target.value || undefined,
                  }))
                }
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[--primary]"></div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Paid Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Salary
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Bonus
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Tax
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Total Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPayments.length > 0 ? (
                        paginatedPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: "#000000" }}
                            >
                              {payment.paidMonth}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm capitalize"
                              style={{ color: "#000000" }}
                            >
                              {payment.paymentMethod?.replace("_", " ") || "—"}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: "#000000" }}
                            >
                              {formatPrice(account.staff?.salary || payment.staff?.salary || 0)}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: "#000000" }}
                            >
                              {formatPrice(payment.bonus || 0)}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm"
                              style={{ color: "#000000" }}
                            >
                              {formatPrice(payment.tax || 0)}
                            </td>
                            <td
                              className="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                              style={{ color: "#000000" }}
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
                              className="px-6 py-4 text-sm max-w-xs truncate"
                              style={{ color: "#4b5563" }}
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
                            className="px-6 py-12 text-center text-gray-500"
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
  value: string;
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
      <span style={{ color: "#4b5563" }}>{label}</span>
      <span className="font-medium" style={{ color: getValueColor() }}>
        {value}
      </span>
    </div>
  );
}

