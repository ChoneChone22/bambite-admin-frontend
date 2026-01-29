/**
 * Staff User Management Page
 * Manage customer/user accounts (requires USER_MANAGEMENT permission)
 * Production-ready with search, filtering, sorting, pagination
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { User, CreateUserRequest, UpdateUserRequest, UserStats } from "@/src/types/api";
import { useTableSort, useTablePagination } from "@/src/hooks";
import SortableTableHeader from "@/src/components/SortableTableHeader";
import TablePagination from "@/src/components/TablePagination";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";
import { getErrorMessage } from "@/src/lib/utils";

// Validation schema for create
const createUserSchema = Yup.object().shape({
  name: Yup.string().optional(),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain an uppercase letter")
    .matches(/[a-z]/, "Password must contain a lowercase letter")
    .matches(/[0-9]/, "Password must contain a number")
    .matches(/[^A-Za-z0-9]/, "Password must contain a special character")
    .required("Password is required"),
  phoneNumber: Yup.string()
    .matches(/^[+]?[\d\s-()]+$/, "Invalid phone number format")
    .optional(),
});

// Validation schema for update (password optional)
const updateUserSchema = Yup.object().shape({
  name: Yup.string().optional(),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phoneNumber: Yup.string()
    .matches(/^[+]?[\d\s-()]+$/, "Invalid phone number format")
    .optional(),
});

export default function StaffUserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "GUEST" | "REGISTERED" | "VERIFIED" | "UNVERIFIED">("ALL");
  const modal = useModal();

  // Check permissions on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const profile = await api.staffAccounts.getProfile();
        const permissions = profile?.permissions || [];
        const permissionCodes = permissions.map((p) => p.code?.toUpperCase() || "");
        const hasUserManagement =
          permissionCodes.includes("USER_MANAGEMENT") ||
          profile?.staff?.user?.role === "ADMIN";
        setHasPermission(hasUserManagement);

        if (!hasUserManagement) {
          setError("You do not have permission to access this page");
          router.push("/staff/dashboard");
        }
      } catch {
        setError("Failed to verify permissions");
        router.push("/staff/dashboard");
      }
    };

    checkPermission();
  }, [router]);

  // Filter users based on search query and status
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by status
    if (statusFilter === "GUEST") {
      filtered = filtered.filter((user) => user.isGuest);
    } else if (statusFilter === "REGISTERED") {
      filtered = filtered.filter((user) => !user.isGuest);
    } else if (statusFilter === "VERIFIED") {
      filtered = filtered.filter((user) => !user.isGuest && user.emailVerified);
    } else if (statusFilter === "UNVERIFIED") {
      filtered = filtered.filter((user) => !user.isGuest && !user.emailVerified);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) => {
        const email = user.email?.toLowerCase() || "";
        const phone = user.phoneNumber?.toLowerCase() || "";
        const name = user.name?.toLowerCase() || "";
        return (
          email.includes(query) ||
          phone.includes(query) ||
          name.includes(query)
        );
      });
    }

    return filtered;
  }, [users, searchQuery, statusFilter]);

  // Table sorting
  const { sortedData, handleSort: handleSortTyped, sortConfig } = useTableSort<User>(
    filteredUsers,
    { key: null, direction: null }
  );
  
  const handleSort = (key: string) => handleSortTyped(key as keyof User);

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

  const fetchUsers = async () => {
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      setError(null);
      const [usersData, statsData] = await Promise.all([
        api.users.getAll(),
        api.users.getStats(),
      ]);
      setUsers(usersData || []);
      setStats(statsData);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg || "Failed to fetch users");
      console.error("Error fetching users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  const handleCreate = async (values: CreateUserRequest) => {
    try {
      await api.users.create(values);
      setSuccessMessage("User account created successfully");
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg || "Failed to create user");
      throw err;
    }
  };

  const handleUpdate = async (id: string, values: UpdateUserRequest) => {
    try {
      await api.users.update(id, values);
      setSuccessMessage("User account updated successfully");
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg || "Failed to update user");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this customer account? This action cannot be undone.",
      "Delete Customer"
    );
    if (!confirmed) return;

    try {
      await api.users.delete(id);
      setSuccessMessage("Customer account deleted successfully");
      fetchUsers();
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg || "Failed to delete user");
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const openDetailsModal = (user: User) => {
    setViewingUser(user);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasPermission) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {modal.ModalComponent}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage customer accounts
        </p>
      </div>

      {/* Toast Messages */}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Filters and Actions */}
      <div className="mb-6 bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Users</option>
              <option value="REGISTERED">Registered</option>
              <option value="GUEST">Guest</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </div>

          {/* Create Button */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Add User
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Users:</span>{" "}
              <span className="font-semibold text-foreground">{stats.totalUsers}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Registered:</span>{" "}
              <span className="font-semibold text-foreground">
                {stats.totalUsers - stats.guestUsers}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Guest:</span>{" "}
              <span className="font-semibold text-foreground">
                {stats.guestUsers}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Verified:</span>{" "}
              <span className="font-semibold text-foreground">
                {stats.verifiedUsers}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Unverified:</span>{" "}
              <span className="font-semibold text-foreground">
                {stats.unverifiedUsers}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Filtered:</span>{" "}
              <span className="font-semibold text-foreground">
                {filteredUsers.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No users found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first user account"}
          </p>
          {!searchQuery && statusFilter === "ALL" && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create User
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <SortableTableHeader
                      label="Name"
                      sortKey="name"
                      currentSortKey={sortConfig.key as string | null}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Email"
                      sortKey="email"
                      currentSortKey={sortConfig.key as string | null}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Phone"
                      sortKey="phoneNumber"
                      currentSortKey={sortConfig.key as string | null}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Orders
                    </th>
                    <SortableTableHeader
                      label="Created"
                      sortKey="createdAt"
                      currentSortKey={sortConfig.key as string | null}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                    <th 
                      className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap sticky right-0"
                      style={{
                        backgroundColor: 'hsl(var(--background))',
                        opacity: 1
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedData.map((user) => {
                    const statusBadge = user.isGuest
                      ? { label: "Guest", color: "bg-muted text-foreground border-border" }
                      : user.emailVerified
                      ? { label: "Verified", color: "bg-success/10 text-success border-success/20" }
                      : { label: "Unverified", color: "bg-warning/10 text-warning border-warning/20" };

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-background transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center min-w-[200px]">
                            <div className="shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              {user.profileImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={user.profileImageUrl}
                                  alt={user.name || user.email || "User"}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-muted-foreground font-medium text-sm">
                                  {(user.name || user.email)?.charAt(0).toUpperCase() || "U"}
                                </span>
                              )}
                            </div>
                            <div className="ml-3 min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate" title={user.name || "N/A"}>
                                {user.name || "N/A"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground min-w-[180px] truncate" title={user.email || "N/A"}>
                            {user.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground min-w-[130px] truncate" title={user.phoneNumber || "N/A"}>
                            {user.phoneNumber || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${statusBadge.color}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {user._count?.orderHistories || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "N/A"}
                        </td>
                        <td 
                          className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap sticky right-0"
                          style={{
                            backgroundColor: 'hsl(var(--card))',
                            opacity: 1
                          }}
                        >
                          <button
                            onClick={() => openDetailsModal(user)}
                            className="text-muted-foreground hover:text-foreground mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
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
        </>
      )}

      {/* Create/Edit Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
        }}
        title={editingUser ? "Edit User" : "Create User"}
        maxWidth="lg"
      >
        <Formik
          initialValues={{
            name: editingUser?.name || "",
            email: editingUser?.email || "",
            password: "",
            phoneNumber: editingUser?.phoneNumber || "",
          }}
          validationSchema={editingUser ? updateUserSchema : createUserSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (editingUser) {
                const updateData: UpdateUserRequest = {
                  name: values.name || undefined,
                  email: values.email,
                  phoneNumber: values.phoneNumber || undefined,
                };
                await handleUpdate(editingUser.id, updateData);
              } else {
                const createData: CreateUserRequest = {
                  name: values.name || undefined,
                  email: values.email,
                  password: values.password,
                  phoneNumber: values.phoneNumber || undefined,
                };
                await handleCreate(createData);
              }
            } catch {
              // Error handled in handleCreate/handleUpdate
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Name
                </label>
                <Field
                  id="name"
                  name="name"
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="User's display name"
                />
                {errors.name && touched.name && (
                  <p 
                    className="mt-1 text-sm"
                    style={{ color: 'hsl(var(--destructive))' }}
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Email *
                </label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="user@example.com"
                />
                {errors.email && touched.email && (
                  <p 
                    className="mt-1 text-sm"
                    style={{ color: 'hsl(var(--destructive))' }}
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password (only for create) */}
              {!editingUser && (
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-muted-foreground mb-1"
                  >
                    Password *
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Minimum 8 characters"
                  />
                  {errors.password && touched.password && (
                    <p 
                      className="mt-1 text-sm"
                      style={{ color: 'hsl(var(--destructive))' }}
                    >
                      {errors.password}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Must contain uppercase, lowercase, number, and special
                    character
                  </p>
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-muted-foreground mb-1"
                >
                  Phone Number
                </label>
                <Field
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+66 8 1234 5678"
                />
                {errors.phoneNumber && touched.phoneNumber && (
                  <p 
                    className="mt-1 text-sm"
                    style={{ color: 'hsl(var(--destructive))' }}
                  >
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingUser
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </FormModal>

      {/* User Details Modal */}
      <FormModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setViewingUser(null);
        }}
        title="User Details"
        maxWidth="2xl"
      >
        {viewingUser && (
          <div className="space-y-6">
            {/* Profile Section */}
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="shrink-0 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                {viewingUser.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={viewingUser.profileImageUrl}
                    alt={viewingUser.name || viewingUser.email || "User"}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground font-medium text-2xl">
                    {(viewingUser.name || viewingUser.email)?.charAt(0).toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">
                  {viewingUser.name || "No name"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewingUser.isGuest ? "Guest User" : viewingUser.emailVerified ? "Verified User" : "Unverified User"}
                </p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email
                </label>
                <p className="text-sm text-foreground break-words">
                  {viewingUser.email || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Phone Number
                </label>
                <p className="text-sm text-foreground">
                  {viewingUser.phoneNumber || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  User ID
                </label>
                <p className="text-sm text-foreground font-mono break-all">
                  {viewingUser.id}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Account Type
                </label>
                <p className="text-sm text-foreground">
                  {viewingUser.isGuest ? "Guest Account" : "Registered Account"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Email Verified
                </label>
                <p className="text-sm text-foreground">
                  {viewingUser.emailVerified ? "Yes" : "No"}
                  {viewingUser.emailVerifiedAt && (
                    <span className="text-muted-foreground ml-2">
                      ({new Date(viewingUser.emailVerifiedAt).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Created At
                </label>
                <p className="text-sm text-foreground">
                  {viewingUser.createdAt
                    ? new Date(viewingUser.createdAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-foreground">
                  {viewingUser.updatedAt
                    ? new Date(viewingUser.updatedAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
              {viewingUser.expiresAt && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Expires At
                  </label>
                  <p className="text-sm text-red-600">
                    {new Date(viewingUser.expiresAt).toLocaleString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Activity Stats */}
            {viewingUser._count && (
              <div className="pt-6 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Activity Statistics
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {viewingUser._count.orderHistories}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Orders</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {viewingUser._count.favourites}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Favourites</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {viewingUser._count.reviews}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Reviews</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setViewingUser(null);
                }}
                className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-background transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openEditModal(viewingUser);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit User
              </button>
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}
