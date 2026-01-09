/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Inventory Control Page
 * Stock adjustments and change history
 */

"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { Product, InventoryLog, InventoryReason } from "@/src/types/api";
import { formatDateTime } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";

// Validation Schema
const inventorySchema = Yup.object().shape({
  productId: Yup.string().required("Product is required"),
  reason: Yup.string()
    .oneOf(Object.values(InventoryReason), "Invalid reason")
    .required("Reason is required"),
  quantityChange: Yup.number()
    .integer("Quantity must be a whole number")
    .required("Quantity change is required")
    .test("not-zero", "Quantity change cannot be zero", (value) => value !== 0),
  notes: Yup.string().max(500, "Notes must not exceed 500 characters"),
});

export default function InventoryControlPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [changes, setChanges] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const modal = useModal();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [productsResponse, changesData] = await Promise.all([
        api.products.getAll(),
        api.inventory.getChanges(),
      ]);
      // products.getAll() returns { data: Product[], meta?: {...} }
      setProducts(productsResponse.data || productsResponse);
      setChanges(changesData);
    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (
    values: {
      productId: string;
      reason: InventoryReason;
      quantityChange: number;
      notes?: string;
    },
    { setSubmitting, resetForm }: any
  ) => {
    try {
      await api.inventory.createLog(values);
      setSubmitting(false); // Stop loading state
      resetForm();
      setShowForm(false); // Close modal immediately
      await fetchData();
      await modal.alert("Inventory log created successfully", "Success", "success");
    } catch (err: any) {
      setSubmitting(false); // Stop loading state on error
      await modal.alert(err.message || "Failed to create inventory log", "Error", "error");
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
          Inventory Control
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary cursor-pointer"
        >
          {showForm ? "Hide Form" : "+ Stock Adjustment"}
        </button>
      </div>

      {/* Stock Adjustment Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: "#000000" }}
          >
            New Stock Adjustment
          </h2>

          <Formik
            initialValues={{
              productId: "",
              reason: "" as InventoryReason,
              quantityChange: 0,
              notes: "",
            }}
            validationSchema={inventorySchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting, values }) => (
              <Form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#374151" }}
                    >
                      Product *
                    </label>
                    <Field as="select" name="productId" className="input-field">
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Current: {product.stockQuantity})
                        </option>
                      ))}
                    </Field>
                    {errors.productId && touched.productId && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.productId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#374151" }}
                    >
                      Reason *
                    </label>
                    <Field as="select" name="reason" className="input-field">
                      <option value="">Select a reason</option>
                      {Object.values(InventoryReason).map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </Field>
                    {errors.reason && touched.reason && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#374151" }}
                    >
                      Quantity Change *
                    </label>
                  <Field
                    name="quantityChange"
                    type="number"
                    className="input-field"
                    placeholder="Use positive for increase, negative for decrease"
                  />
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                    Current quantity:{" "}
                    {values.productId
                      ? products.find((p) => p.id === values.productId)
                          ?.stockQuantity || 0
                      : 0}
                    {" → New quantity: "}
                    {values.productId
                      ? (products.find((p) => p.id === values.productId)
                          ?.stockQuantity || 0) + (values.quantityChange || 0)
                      : 0}
                  </p>
                  {errors.quantityChange && touched.quantityChange && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.quantityChange}
                    </p>
                  )}
                </div>

                <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#374151" }}
                    >
                      Notes (Optional)
                    </label>
                  <Field
                    as="textarea"
                    name="notes"
                    rows={3}
                    className="input-field"
                    placeholder="Add any additional notes..."
                  />
                  {errors.notes && touched.notes && (
                    <p className="text-red-600 text-sm mt-1">{errors.notes}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary cursor-pointer"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Adjustment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}

      {/* Current Stock Overview */}
      <div className="bg-white rounded-lg shadow mb-8 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold" style={{ color: "#000000" }}>
            Current Stock Levels
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Stock Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {product.name}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: "#6b7280" }}
                  >
                    {product.category?.name || "N/A"}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                    style={{ color: "#000000" }}
                  >
                    {product.stockQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.stockQuantity === 0 ? (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    ) : product.stockQuantity <= 10 ? (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Change History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold" style={{ color: "#000000" }}>
            Recent Inventory Changes
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Previous
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  New
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {changes.map((change) => (
                <tr key={change.id} className="hover:bg-gray-50">
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: "#6b7280" }}
                  >
                    {change.createdAt
                      ? formatDateTime(change.createdAt)
                      : "N/A"}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {change.product?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {change.reason ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100" style={{ color: "#1f2937" }}>
                        {change.reason}
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: "#6b7280" }}>-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-semibold ${
                        change.quantityChange > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {change.quantityChange > 0 ? "+" : ""}
                      {change.quantityChange}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: "#000000" }}
                  >
                    {change.previousQuantity}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-semibold"
                    style={{ color: "#000000" }}
                  >
                    {change.newQuantity}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#6b7280" }}>
                    {change.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {changes.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: "#6b7280" }}>No inventory changes yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
