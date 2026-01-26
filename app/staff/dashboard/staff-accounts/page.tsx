/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Staff Account Management Page
 * Manage staff login accounts and permissions
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { Staff, StaffAccount, Permission } from "@/src/types/api";
import { useTableSort, useTablePagination } from "@/src/hooks";
import SortableTableHeader from "@/src/components/SortableTableHeader";
import TablePagination from "@/src/components/TablePagination";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";

const staffAccountSchema = Yup.object().shape({
  staffId: Yup.string().required("Staff is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain an uppercase letter")
    .matches(/[a-z]/, "Password must contain a lowercase letter")
    .matches(/[0-9]/, "Password must contain a number")
    .matches(/[^A-Za-z0-9]/, "Password must contain a special character")
    .optional(),
  permissionIds: Yup.array().of(Yup.string().uuid().optional()).optional(),
});

// Helper function to format permission code (replace underscores with spaces and capitalize)
const formatPermissionCode = (code: string): string => {
  if (!code) return "Unnamed Permission";
  return code
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Permission grouping structure (matching admin sidebar)
interface PermissionGroup {
  title: string;
  permissionCodes: string[];
}

const permissionGroups: PermissionGroup[] = [
  {
    title: "Products",
    permissionCodes: [
      "product_management",
      "product_category_management",
      "product_options_management",
    ],
  },
  {
    title: "Orders",
    permissionCodes: ["orders_management"],
  },
  {
    title: "Staff Management",
    permissionCodes: [
      "staff_management",
      "staff_account_management",
      "staff_payment_management",
      "department_management",
    ],
  },
  {
    title: "Operations",
    permissionCodes: ["inventory_management"],
  },
  {
    title: "Recruitment",
    permissionCodes: ["recruitment_management"],
  },
  {
    title: "Communications",
    permissionCodes: ["contact_management"],
  },
  {
    title: "Content & Design",
    permissionCodes: [
      "content_management",
      "theme_and_animation",
      "review_management",
    ],
  },
];

// Helper function to group permissions
const groupPermissions = (permissions: Permission[]) => {
  // Get all permission codes that are in predefined groups
  const groupedCodes = new Set(
    permissionGroups.flatMap((group) => group.permissionCodes)
  );

  // Find permissions that don't belong to any predefined group
  const ungroupedPermissions = permissions.filter(
    (perm) =>
      !groupedCodes.has(perm.code?.toLowerCase() || "") &&
      perm.code &&
      perm.code.trim().length > 0
  );

  // Map predefined groups with their permissions
  const grouped = permissionGroups.map((group) => ({
    ...group,
    permissions: permissions.filter((perm) =>
      group.permissionCodes.includes(perm.code?.toLowerCase() || "")
    ),
  }));

  // Add "Other" group if there are ungrouped permissions
  if (ungroupedPermissions.length > 0) {
    grouped.push({
      title: "Other",
      permissionCodes: [],
      permissions: ungroupedPermissions,
    });
  }

  return grouped;
};

export default function StaffAccountManagementPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<StaffAccount | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const modal = useModal();

  // Filter staff accounts based on search query
  const filteredStaffAccounts = useMemo(() => {
    if (!searchQuery.trim()) {
      return accounts;
    }

    const query = searchQuery.toLowerCase().trim();
    return accounts.filter((account) => {
      const email = account.email?.toLowerCase() || "";
      const staffName = account.staff?.name?.toLowerCase() || "";
      const employeeId = account.staff?.employeeId?.toLowerCase() || "";
      const position = account.staff?.position?.toLowerCase() || "";
      const departmentName = account.staff?.department?.name?.toLowerCase() || "";
      const status = account.isActive ? "active" : "inactive";
      return (
        email.includes(query) ||
        staffName.includes(query) ||
        employeeId.includes(query) ||
        position.includes(query) ||
        departmentName.includes(query) ||
        status.includes(query)
      );
    });
  }, [accounts, searchQuery]);

  // Table sorting
  const { sortedData, handleSort, getSortDirection, sortConfig } =
    useTableSort<StaffAccount>(filteredStaffAccounts, { key: null, direction: null });

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(sortedData, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [accountsData, staffData, permissionsData] = await Promise.all([
        api.staffAccounts.getAll(),
        api.staff.getAll(),
        api.permissions.getAll(),
      ]);

      setAccounts(accountsData || []);
      setStaff(staffData || []);
      setPermissions(permissionsData || []);
    } catch (err: any) {
      console.error("Failed to fetch staff accounts data:", err);
      console.error("Error details:", err?.response?.data || err?.message);
      setError(err?.message || "Failed to fetch staff accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingAccount(null);
    setShowModal(true);
    // Expand all groups by default when opening modal
    setExpandedGroups(new Set(permissionGroups.map((g) => g.title)));
  };

  const handleEdit = (account: StaffAccount) => {
    setEditingAccount(account);
    setShowModal(true);
    // Expand all groups by default when opening modal
    setExpandedGroups(new Set(permissionGroups.map((g) => g.title)));
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this staff account? This will permanently remove login access for this staff member. The staff record itself will remain intact.",
      "Delete Staff Account"
    );
    if (!confirmed) return;

    try {
      await api.staffAccounts.delete(id);
      await fetchData();
    } catch (err: any) {
      await modal.alert(err.message || "Failed to delete staff account", "Error", "error");
    }
  };

  const handleSubmit = async (
    values: {
      staffId: string;
      email: string;
      password?: string;
      permissionIds?: string[];
    },
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingAccount) {
        // Update email/password only; permissions handled separately if needed
        await api.staffAccounts.update(editingAccount.id, {
          email: values.email,
          password: values.password || undefined,
        });
        if (values.permissionIds && values.permissionIds.length >= 0) {
          await api.staffAccounts.setPermissions(
            editingAccount.id,
            values.permissionIds
          );
        }
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        await fetchData();
        await modal.alert("Staff account updated successfully", "Success", "success");
      } else {
        await api.staffAccounts.create({
          staffId: values.staffId,
          email: values.email,
          password: values.password || undefined,
          permissionIds: values.permissionIds || [],
        });
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        await fetchData();
        await modal.alert("Staff account created successfully", "Success", "success");
      }
    } catch (err: any) {
      setSubmitting(false); // Stop loading state on error
      await modal.alert(err.message || "Failed to save staff account", "Error", "error");
    }
  };

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>
          Staff Account Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Create Staff Account
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search staff accounts by email, staff name, employee ID, position, department, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full max-w-md"
        />
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableTableHeader
                label="Staff"
                sortKey="staff.name"
                currentSortKey={sortConfig.key ? String(sortConfig.key) : null}
                sortDirection={getSortDirection(
                  "staff.name" as keyof StaffAccount
                )}
                onSort={(key) => handleSort(key as keyof StaffAccount)}
              />
              <SortableTableHeader
                label="Email"
                sortKey="email"
                currentSortKey={sortConfig.key ? String(sortConfig.key) : null}
                sortDirection={getSortDirection("email")}
                onSort={(key) => handleSort(key as keyof StaffAccount)}
              />
              <SortableTableHeader
                label="Status"
                sortKey="staff.status"
                currentSortKey={sortConfig.key ? String(sortConfig.key) : null}
                sortDirection={getSortDirection(
                  "staff.status" as keyof StaffAccount
                )}
                onSort={(key) => handleSort(key as keyof StaffAccount)}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Permissions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((account) => (
              <tr key={account.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {account.staff?.name || account.staff?.employeeId || "—"}
                  </div>
                  {account.staff?.department && (
                    <div className="text-xs text-gray-500">
                      {account.staff.department.name} (
                      {account.staff.department.shortName})
                    </div>
                  )}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {account.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      account.staff?.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {account.staff?.status === "active" ? "Active" : "Inactive"}
                  </span>
                  {account.mustChangePassword && (
                    <span className="ml-2 text-xs text-yellow-700">
                      Must change password
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {account.permissions && account.permissions.length > 0 ? (
                    <span>
                      {account.permissions
                        .map((p) => formatPermissionCode(p.code || ""))
                        .slice(0, 3)
                        .join(", ")}
                      {account.permissions.length > 3 &&
                        ` +${account.permissions.length - 3} more`}
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() =>
                      router.push(
                        `/staff/dashboard/staff-accounts/${account.id}`
                      )
                    }
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(account)}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#DC2626", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No staff accounts found.</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {accounts.length > 0 && (
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

      {/* Staff Account Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAccount ? "Edit Staff Account" : "Create Staff Account"}
        maxWidth="2xl"
      >
        <Formik
              initialValues={{
                staffId:
                  editingAccount?.staff?.id ||
                  editingAccount?.staff?.employeeId ||
                  "",
                email: editingAccount?.email || "",
                password: "",
                permissionIds:
                  editingAccount?.permissions?.map((p) => p.id) || [],
              }}
              validationSchema={staffAccountSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, values, setFieldValue }) => (
                <Form className="space-y-4">
                  {!editingAccount && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Staff *
                      </label>
                      <Field as="select" name="staffId" className="input-field">
                        <option value="">Select staff</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name || s.employeeId || s.user?.email} –{" "}
                            {s.department
                              ? `${s.department.name} (${s.department.shortName})`
                              : "No department"}
                          </option>
                        ))}
                      </Field>
                      {errors.staffId && touched.staffId && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.staffId}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Field
                      name="email"
                      type="email"
                      className="input-field"
                      placeholder="staff@bambite.com"
                    />
                    {errors.email && touched.email && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password (optional)
                    </label>
                    <Field
                      name="password"
                      type="password"
                      className="input-field"
                      placeholder={
                        editingAccount
                          ? "Leave blank to keep current password"
                          : "Leave blank to auto-generate and email password"
                      }
                    />
                    {errors.password && touched.password && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="border border-gray-300 rounded-lg p-2 max-h-64 overflow-y-auto bg-gray-50">
                      {permissions.length === 0 ? (
                        <p className="text-sm text-gray-500 p-4">
                          No permissions available.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {groupPermissions(permissions).map((group) => {
                            if (group.permissions.length === 0) return null;
                            const isExpanded = expandedGroups.has(group.title);
                            const toggleGroup = () => {
                              setExpandedGroups((prev) => {
                                const newSet = new Set(prev);
                                if (newSet.has(group.title)) {
                                  newSet.delete(group.title);
                                } else {
                                  newSet.add(group.title);
                                }
                                return newSet;
                              });
                            };

                            return (
                              <div key={group.title} className="mb-1">
                                {/* Group Header */}
                                <button
                                  type="button"
                                  onClick={toggleGroup}
                                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all font-semibold text-sm hover:bg-gray-100"
                                  style={{ color: "#374151" }}
                                >
                                  <span>{group.title}</span>
                                  <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${
                                      isExpanded ? "transform rotate-90" : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ minWidth: "16px" }}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </button>

                                {/* Group Items */}
                                {isExpanded && (
                                  <div className="ml-4 mt-1 space-y-1">
                                    {group.permissions.map((perm) => {
                                      const checked =
                                        values.permissionIds?.includes(perm.id);
                                      return (
                                        <label
                                          key={perm.id}
                                          className="flex items-start gap-3 p-2 rounded hover:bg-white cursor-pointer transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            checked={!!checked}
                                            onChange={(e) => {
                                              const current =
                                                values.permissionIds || [];
                                              if (e.target.checked) {
                                                setFieldValue("permissionIds", [
                                                  ...current,
                                                  perm.id,
                                                ]);
                                              } else {
                                                setFieldValue(
                                                  "permissionIds",
                                                  current.filter(
                                                    (id) => id !== perm.id
                                                  )
                                                );
                                              }
                                            }}
                                          />
                                          <div className="flex-1">
                                            <div className="text-sm font-semibold text-gray-900">
                                              {formatPermissionCode(
                                                perm.code || ""
                                              )}
                                            </div>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1 cursor-pointer"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editingAccount
                        ? "Update"
                        : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
      </FormModal>
    </div>
  );
}
