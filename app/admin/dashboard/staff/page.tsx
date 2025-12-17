/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Staff Management Page
 * CRUD operations for staff and payroll summary
 */

"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { Staff, CreateStaffRequest, PaymentMethod } from "@/src/types/api";
import { formatPrice } from "@/src/lib/utils";

// Validation Schema
const staffSchema = Yup.object().shape({
  position: Yup.string()
    .min(3, "Position must be at least 3 characters")
    .required("Position is required"),
  salary: Yup.number()
    .positive("Salary must be greater than 0")
    .max(1000000, "Salary must not exceed $1,000,000")
    .required("Salary is required"),
  overtimePayment: Yup.number()
    .min(0, "Overtime payment cannot be negative")
    .default(0),
  tax: Yup.number().min(0, "Tax cannot be negative").default(0),
  paymentMethod: Yup.string()
    .oneOf(Object.values(PaymentMethod), "Invalid payment method")
    .required("Payment method is required"),
});

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [payrollSummary, setPayrollSummary] = useState({
    totalPayroll: 0,
    staffCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch separately to handle individual errors
      const staffData = await api.staff.getAll().catch((err) => {
        console.error("Failed to fetch staff list:", err);
        return [];
      });

      const payroll = await api.staff.getPayrollSummary().catch((err) => {
        console.error("Failed to fetch payroll summary:", err);
        return { totalPayroll: 0, staffCount: 0 };
      });

      console.log("Staff data:", staffData);
      console.log("Payroll summary:", payroll);
      setStaff(staffData);
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

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await api.staff.delete(id);
      await fetchData();
    } catch (err) {
      alert("Failed to delete staff member");
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
      } else {
        await api.staff.create(values);
      }
      resetForm();
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save staff member");
    } finally {
      setSubmitting(false);
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
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8">
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
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Overtime Pay
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Tax
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Net Pay
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {member.position}
                  </div>
                  {member.user && (
                    <div className="text-sm text-gray-500">
                      {member.user.email}
                    </div>
                  )}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {formatPrice(member.salary)}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {formatPrice(member.overtimePayment)}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#000000" }}
                >
                  {formatPrice(member.tax)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-green-600">
                    {formatPrice(member.netPay)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(member)}
                    className="font-semibold hover:underline mr-4"
                    style={{ color: "#2C5BBB" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="font-semibold hover:underline"
                    style={{ color: "#DC2626" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Staff Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "#000000" }}
            >
              {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </h2>

            <Formik
              initialValues={{
                position: editingStaff?.position || "",
                salary: editingStaff?.salary || 0,
                overtimePayment: editingStaff?.overtimePayment || 0,
                tax: editingStaff?.tax || 0,
                paymentMethod:
                  editingStaff?.paymentMethod || ("" as PaymentMethod),
              }}
              validationSchema={staffSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
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
                      <p className="text-red-600 text-sm mt-1">
                        {errors.position}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method *
                    </label>
                    <Field
                      as="select"
                      name="paymentMethod"
                      className="input-field"
                    >
                      <option value="">Select payment method</option>
                      <option value={PaymentMethod.CASH}>Cash</option>
                      <option value={PaymentMethod.BANK_TRANSFER}>
                        Bank Transfer
                      </option>
                      <option value={PaymentMethod.CHECK}>Check</option>
                    </Field>
                    {errors.paymentMethod && touched.paymentMethod && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.paymentMethod}
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
                        <p className="text-red-600 text-sm mt-1">
                          {errors.salary}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overtime Payment ($)
                      </label>
                      <Field
                        name="overtimePayment"
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field"
                        placeholder="0"
                      />
                      {errors.overtimePayment && touched.overtimePayment && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.overtimePayment}
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
          </div>
        </div>
      )}
    </div>
  );
}
