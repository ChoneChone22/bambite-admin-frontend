"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";
import { Payment } from "@/src/types/api";
import { formatPrice } from "@/src/lib/utils";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { MonthPicker } from "@/components/ui/month-picker";

// Helper function to format permission code (replace underscores with spaces and capitalize)
const formatPermissionCode = (code: string): string => {
  if (!code) return "Unnamed Permission";
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface StaffProfileResponse {
  id: string;
  email: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  staff?: {
    id: string;
    employeeId?: string;
    name?: string;
    position: string;
    status?: "active" | "on_leave" | "quit";
    department?: {
      id: string;
      name: string;
      shortName: string;
    };
  };
  permissions?: {
    id: string;
    code: string;
  }[];
}

export default function StaffProfilePage() {
  const [profile, setProfile] = useState<StaffProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState<{
    paidMonth?: string;
  }>({});

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use API service method for consistency
        const data = await api.staffAccounts.getProfile();
        // Map StaffAccount to StaffProfileResponse format
        setProfile({
          id: data.id,
          email: data.email,
          isActive: data.isActive,
          mustChangePassword: data.mustChangePassword,
          staff: data.staff,
          permissions: data.permissions,
        } as StaffProfileResponse);
      } catch (err: any) {
        console.error("Failed to fetch staff profile:", err);
        
        // Handle 403 Forbidden - this should not happen for own profile
        if (err?.statusCode === 403 || err?.response?.status === 403) {
          setError(
            "Access denied. You should be able to view your own profile. " +
            "This may be a backend permission configuration issue. " +
            "Please contact your administrator."
          );
        } else {
          setError(err?.message || "Failed to load staff profile");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch payments for this staff member
  useEffect(() => {
    const fetchPayments = async () => {
      if (!profile?.staff?.id) return;
      setIsLoadingPayments(true);
      try {
        const paymentsData = await api.payments.getByStaffId(profile.staff.id, {
          paidMonth: paymentFilters.paidMonth,
          page: 1,
          limit: 1000, // Fetch all for client-side pagination
        });
        setPayments(paymentsData || []);
      } catch (err: unknown) {
        console.error("Failed to fetch payments:", err);
        setPayments([]);
      } finally {
        setIsLoadingPayments(false);
      }
    };
    fetchPayments();
  }, [profile?.staff?.id, paymentFilters.paidMonth]);

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

  if (error || !profile) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1 text-foreground">
            My Profile
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-600 text-sm">{error || "Profile not found."}</p>
        </div>
      </div>
    );
  }

  const staff = profile.staff;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1 text-foreground">
          My Profile
        </h1>
        <p className="text-sm text-gray-600">
          View-only profile for your staff account
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <SectionHeading title="Account" />
          <ProfileRow label="Email" value={profile.email} />

          <SectionHeading title="Staff Information" />
          <ProfileRow
            label="Employee ID"
            value={staff?.employeeId || "—"}
          />
          <ProfileRow label="Name" value={staff?.name || "—"} />
          <ProfileRow label="Position" value={staff?.position || "—"} />
          <ProfileRow
            label="Department"
            value={
              staff?.department
                ? `${staff.department.name} (${staff.department.shortName})`
                : "—"
            }
          />
          <ProfileRow label="Status" value={staff?.status || "—"} />

          <SectionHeading title="Permissions" />
          {profile.permissions && profile.permissions.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
              {profile.permissions.map((perm) => (
                <li key={perm.id}>
                  <span className="font-medium">
                    {formatPermissionCode(perm.code || "")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">
              No explicit permissions assigned.
            </p>
          )}
        </div>

      {/* Payment History */}
      {profile.staff?.id && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
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
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
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
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPayments.length > 0 ? (
                        paginatedPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
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
                              {formatPrice(payment.staff?.salary || 0)}
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

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold mt-4 mb-1 text-foreground">
      {title}
    </h2>
  );
}


