/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Payment Management Page
 * View and manage staff payroll payments
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { Payment, Staff } from "@/src/types/api";
import { formatPrice } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";

const paymentSchema = Yup.object().shape({
  staffId: Yup.string().required("Staff is required"),
  bonus: Yup.number().min(0, "Bonus cannot be negative").optional(),
  tax: Yup.number().min(0, "Tax cannot be negative").optional(),
  note: Yup.string().max(255, "Note must not exceed 255 characters").optional(),
  paymentMethod: Yup.string()
    .oneOf(["mobile_banking", "cash"], "Invalid payment method")
    .optional(),
  paidMonth: Yup.string()
    .matches(/^\d{4}-\d{2}$/, "Paid month must be in YYYY-MM format")
    .required("Paid month is required"),
});

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    paidMonth?: string;
    isPaid?: string;
  }>({});
  const modal = useModal();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [paymentsData, staffData] = await Promise.all([
        api.payments.getAll({
          paidMonth: filters.paidMonth,
          isPaid:
            filters.isPaid === undefined || filters.isPaid === ""
              ? undefined
              : filters.isPaid === "true",
          page: 1,
          limit: 50,
        }),
        api.staff.getAll(),
      ]);
      setPayments(paymentsData);
      setStaff(staffData);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Failed to fetch payment records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.paidMonth, filters.isPaid]);

  const summary = useMemo(() => {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce(
      (sum, p) => sum + (p.totalPayment || 0),
      0
    );
    const paidCount = payments.filter((p) => p.isPaid).length;

    return {
      totalPayments,
      totalAmount,
      paidCount,
    };
  }, [payments]);

  const handleCreate = () => {
    setEditingPayment(null);
    setShowModal(true);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this payment record? This action cannot be undone and will affect payroll summaries and reports.",
      "Delete Payment Record"
    );
    if (!confirmed) return;

    try {
      await api.payments.delete(id);
      await fetchData();
    } catch (err: any) {
      await modal.alert(err.message || "Failed to delete payment", "Error", "error");
    }
  };

  const handleSubmit = async (
    values: {
      staffId: string;
      bonus?: number;
      tax?: number;
      note?: string;
      paymentMethod?: "mobile_banking" | "cash";
      paidMonth: string;
      isPaid?: boolean;
    },
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingPayment) {
        await api.payments.update(editingPayment.id, {
          bonus: values.bonus,
          tax: values.tax,
          note: values.note,
          paymentMethod: values.paymentMethod,
          isPaid: values.isPaid,
        });
      } else {
        await api.payments.create({
          staffId: values.staffId,
          bonus: values.bonus,
          tax: values.tax,
          note: values.note,
          paymentMethod: values.paymentMethod,
          paidMonth: values.paidMonth,
        });
      }
      resetForm();
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      await modal.alert(err.message || "Failed to save payment", "Error", "error");
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
      {modal.ModalComponent}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#000000" }}>
            Payment Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage salary payments and bonuses for staff.
          </p>
        </div>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Create Payment
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Summary + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Payments</p>
          <p className="text-2xl font-bold" style={{ color: "#000000" }}>
            {summary.totalPayments}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Amount</p>
          <p className="text-2xl font-bold" style={{ color: "#000000" }}>
            {formatPrice(summary.totalAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Paid Records</p>
          <p className="text-2xl font-bold" style={{ color: "#000000" }}>
            {summary.paidCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 border border-gray-200 mb-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#000000" }}>
          Filters
        </h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paid Month (YYYY-MM)
            </label>
            <input
              type="month"
              className="input-field"
              value={filters.paidMonth || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, paidMonth: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input-field"
              value={filters.isPaid ?? ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  isPaid: e.target.value,
                }))
              }
            >
              <option value="">All</option>
              <option value="true">Paid</option>
              <option value="false">Unpaid</option>
            </select>
          </div>
          <button
            className="btn-secondary cursor-pointer"
            onClick={() => setFilters({})}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Paid Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Bonus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Tax
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {payment.staff?.name ||
                      payment.staff?.employeeId ||
                      "Unknown"}
                  </div>
                  {payment.staff?.department && (
                    <div className="text-xs text-gray-500">
                      {payment.staff.department.name} (
                        {payment.staff.department.shortName})
                    </div>
                  )}
                </td>
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
                  {payment.paymentMethod.replace("_", " ")}
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  <button
                    onClick={() => handleEdit(payment)}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(payment.id)}
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

        {payments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No payments found.</p>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPayment ? "Edit Payment" : "Create Payment"}
        maxWidth="2xl"
      >
        <Formik
              initialValues={{
                staffId: editingPayment?.staffId || "",
                bonus: editingPayment?.bonus || 0,
                tax: editingPayment?.tax || 0,
                note: editingPayment?.note || "",
                paymentMethod:
                  editingPayment?.paymentMethod || "mobile_banking",
                paidMonth: editingPayment?.paidMonth || "",
                isPaid: editingPayment?.isPaid ?? false,
              }}
              validationSchema={paymentSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting, values }) => (
                <Form className="space-y-4">
                  {!editingPayment && (
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bonus
                      </label>
                      <Field
                        name="bonus"
                        type="number"
                        min="0"
                        className="input-field"
                      />
                      {errors.bonus && touched.bonus && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.bonus}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tax
                      </label>
                      <Field
                        name="tax"
                        type="number"
                        min="0"
                        className="input-field"
                      />
                      {errors.tax && touched.tax && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.tax}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paid Month *
                      </label>
                      <Field name="paidMonth" type="month" className="input-field" />
                      {errors.paidMonth && touched.paidMonth && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.paidMonth}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <Field
                        as="select"
                        name="paymentMethod"
                        className="input-field"
                      >
                        <option value="mobile_banking">Mobile Banking</option>
                        <option value="cash">Cash</option>
                      </Field>
                      {errors.paymentMethod && touched.paymentMethod && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Note
                    </label>
                    <Field
                      as="textarea"
                      name="note"
                      rows={3}
                      className="input-field"
                    />
                    {errors.note && touched.note && (
                      <p className="text-red-600 text-sm mt-1">{errors.note}</p>
                    )}
                  </div>

                  {editingPayment && (
                    <div className="flex items-center space-x-2">
                      <Field
                        id="isPaid"
                        name="isPaid"
                        type="checkbox"
                        className="h-4 w-4 text-[--primary] border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isPaid"
                        className="text-sm font-medium text-gray-700"
                      >
                        Mark as paid
                      </label>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1 cursor-pointer"
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editingPayment
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


