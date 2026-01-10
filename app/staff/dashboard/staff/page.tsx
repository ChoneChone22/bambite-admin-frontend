/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Staff Management Page
 * CRUD operations for staff and payroll summary
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { Staff, CreateStaffRequest, Department } from "@/src/types/api";
import { useTableSort, useTablePagination } from "@/src/hooks";
import SortableTableHeader from "@/src/components/SortableTableHeader";
import TablePagination from "@/src/components/TablePagination";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";

// Validation Schema
const staffSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, "Name must be at least 3 characters")
    .required("Name is required"),
  position: Yup.string()
    .min(3, "Position must be at least 3 characters")
    .required("Position is required"),
  salary: Yup.number()
    .positive("Salary must be greater than 0")
    .max(1000000, "Salary must not exceed $1,000,000")
    .required("Salary is required"),
  tax: Yup.number().min(0, "Tax cannot be negative").default(0),
  totalBonus: Yup.number().min(0, "Bonus cannot be negative").default(0),
  departmentId: Yup.string().required("Department is required"),
  status: Yup.string()
    .oneOf(["active", "on_leave", "quit"], "Invalid status")
    .default("active"),
});

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeDepartments, setActiveDepartments] = useState<Department[]>([]);
  const [payrollSummary, setPayrollSummary] = useState({
    totalPayroll: 0,
    staffCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const modal = useModal();

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) {
      return staff;
    }

    const query = searchQuery.toLowerCase().trim();
    return staff.filter((member) => {
      const employeeId = member.employeeId?.toLowerCase() || "";
      const name = member.name?.toLowerCase() || "";
      const position = member.position?.toLowerCase() || "";
      const departmentName = member.department?.name?.toLowerCase() || "";
      const departmentShortName =
        member.department?.shortName?.toLowerCase() || "";
      const status = member.status?.toLowerCase() || "";
      const salary = member.salary?.toString() || "";
      return (
        employeeId.includes(query) ||
        name.includes(query) ||
        position.includes(query) ||
        departmentName.includes(query) ||
        departmentShortName.includes(query) ||
        status.includes(query) ||
        salary.includes(query)
      );
    });
  }, [staff, searchQuery]);

  // Table sorting
  const { sortedData, handleSort, getSortDirection, sortConfig } =
    useTableSort<Staff>(filteredStaff, { key: null, direction: null });

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

      // Fetch separately to handle individual errors
      const staffData = await api.staff.getAll().catch((err) => {
        console.error("Failed to fetch staff list:", err);
        return [];
      });

      const departmentData = await api.departments.getAll().catch((err) => {
        console.error("Failed to fetch departments:", err);
        return [];
      });

      // Fetch active departments for the modal dropdown
      const activeDepartmentData = await api.departments
        .getActive()
        .catch((err) => {
          console.error("Failed to fetch active departments:", err);
          return [];
        });

      const payroll = await api.staff.getPayrollSummary().catch((err) => {
        console.error("Failed to fetch payroll summary:", err);
        return { totalPayroll: 0, staffCount: 0 };
      });

      console.log("Staff data:", staffData);
      console.log("Departments:", departmentData);
      console.log("Payroll summary:", payroll);
      setStaff(staffData);
      setDepartments(departmentData);
      setActiveDepartments(activeDepartmentData);
      setPayrollSummary(payroll);
    } catch (err) {
      console.error("Failed to fetch staff data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingStaff(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this staff member? This action cannot be undone and will remove all associated records.",
      "Delete Staff Member"
    );
    if (!confirmed) return;

    try {
      await api.staff.delete(id);
      await fetchData();
    } catch (err: any) {
      await modal.alert(
        err.message || "Failed to delete staff member",
        "Error",
        "error"
      );
      console.error(err);
    }
  };

  const handleSubmit = async (
    values: CreateStaffRequest,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingStaff) {
        await api.staff.update(editingStaff.id, values);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        await fetchData();
        await modal.alert(
          "Staff member updated successfully",
          "Success",
          "success"
        );
      } else {
        await api.staff.create(values);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        await fetchData();
        await modal.alert(
          "Staff member created successfully",
          "Success",
          "success"
        );
      }
    } catch (err: any) {
      setSubmitting(false); // Stop loading state on error
      await modal.alert(
        err.message || "Failed to save staff member",
        "Error",
        "error"
      );
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
          Staff Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Staff
        </button>
      </div>

      {/* Payroll Summary Card */}
      {/* <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8">
        <h2 className="text-xl font-semibold mb-4">Payroll Summary</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-blue-100 text-sm mb-1">Total Staff</p>
            <p className="text-3xl font-bold">
              {payrollSummary.staffCount || 0}
            </p>
          </div>
          <div>
            <p className="text-blue-100 text-sm mb-1">Total Payroll Cost</p>
            <p className="text-3xl font-bold">
              ${(payrollSummary.totalPayroll || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div> */}

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search staff by employee ID, name, position, department, status, or salary..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full max-w-md"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableTableHeader
                label="Employee ID"
                sortKey="employeeId"
                currentSortKey={sortConfig.key ? String(sortConfig.key) : null}
                sortDirection={getSortDirection("employeeId")}
                onSort={(key) => handleSort(key as keyof Staff)}
              />
              <SortableTableHeader
                label="Department"
                sortKey="department.name"
                currentSortKey={sortConfig.key ? String(sortConfig.key) : null}
                sortDirection={getSortDirection(
                  "department.name" as keyof Staff
                )}
                onSort={(key) => handleSort(key as keyof Staff)}
              />
              <SortableTableHeader
                label="Name"
                sortKey="name"
                currentSortKey={sortConfig.key ? String(sortConfig.key) : null}
                sortDirection={getSortDirection("name")}
                onSort={(key) => handleSort(key as keyof Staff)}
              />
              <SortableTableHeader
                label="Position"
                sortKey="position"
                currentSortKey={sortConfig.key ? String(sortConfig.key) : null}
                sortDirection={getSortDirection("position")}
                onSort={(key) => handleSort(key as keyof Staff)}
              />
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {member.employeeId || "—"}
                  </div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {member.department?.name || "—"}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {member.name || member.user?.email || "—"}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {member.position}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() =>
                      router.push(`/staff/dashboard/staff/${member.id}`)
                    }
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      setEditingStaff(member);
                      setShowModal(true);
                    }}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#f59759", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
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
      </div>

      {/* Staff Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
        maxWidth="2xl"
      >
        <Formik
          initialValues={{
            name: editingStaff?.name || "",
            position: editingStaff?.position || "",
            salary: editingStaff?.salary || 0,
            tax: editingStaff?.tax || 0,
            totalBonus: editingStaff?.totalBonus || 0,
            departmentId: editingStaff?.departmentId || "",
            status: editingStaff?.status || "active",
          }}
          validationSchema={staffSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Field
                  name="name"
                  type="text"
                  className="input-field"
                  placeholder="e.g., John Doe"
                />
                {errors.name && touched.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <Field
                  name="position"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Kitchen Manager"
                />
                {errors.position && touched.position && (
                  <p className="text-red-600 text-sm mt-1">{errors.position}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <Field as="select" name="departmentId" className="input-field">
                  <option value="">Select department</option>
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.shortName})
                    </option>
                  ))}
                </Field>
                {errors.departmentId && touched.departmentId && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.departmentId}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary ($) *
                  </label>
                  <Field
                    name="salary"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    placeholder="50000"
                  />
                  {errors.salary && touched.salary && (
                    <p className="text-red-600 text-sm mt-1">{errors.salary}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bonus ($)
                  </label>
                  <Field
                    name="totalBonus"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    placeholder="0"
                  />
                  {errors.totalBonus && touched.totalBonus && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.totalBonus}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ($)
                </label>
                <Field
                  name="tax"
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-field"
                  placeholder="0"
                />
                {errors.tax && touched.tax && (
                  <p className="text-red-600 text-sm mt-1">{errors.tax}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <Field as="select" name="status" className="input-field">
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="quit">Quit</option>
                </Field>
                {errors.status && touched.status && (
                  <p className="text-red-600 text-sm mt-1">{errors.status}</p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingStaff
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
