/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Option Management Page
 * CRUD operations for product options
 */

"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  Option,
  CreateOptionRequest,
  UpdateOptionRequest,
} from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";

// Validation Schema
const optionSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Option name must be at least 2 characters")
    .max(100, "Option name must not exceed 100 characters")
    .matches(
      /^[a-z0-9_]+$/,
      "Option name must be lowercase, no spaces (use underscores)"
    )
    .required("Option name is required"),
  displayName: Yup.string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must not exceed 100 characters")
    .required("Display name is required"),
  optionLists: Yup.array()
    .of(
      Yup.string()
        .min(1, "Option value must be at least 1 character")
        .max(50, "Option value must not exceed 50 characters")
        .required("Option value is required")
    )
    .min(1, "At least one option value is required")
    .required("Option values are required"),
});

export default function OptionsManagementPage() {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modal = useModal();

  const fetchOptions = async () => {
    try {
      setIsLoading(true);
      const response = await api.options.getAll();
      setOptions(response);
    } catch (err) {
      setError("Failed to fetch options");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleCreate = () => {
    setEditingOption(null);
    setShowModal(true);
  };

  const handleEdit = (option: Option) => {
    setEditingOption(option);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this option? This will remove it from all products. This action cannot be undone.",
      "Delete Option"
    );
    if (!confirmed) return;

    try {
      await api.options.delete(id);
      await fetchOptions();
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to delete option",
        "Error",
        "error"
      );
      console.error(err);
    }
  };

  const handleSubmit = async (
    values: CreateOptionRequest | UpdateOptionRequest,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingOption) {
        await api.options.update(editingOption.id, values);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        await fetchOptions();
        await modal.alert("Option updated successfully", "Success", "success");
      } else {
        await api.options.create(values);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        await fetchOptions();
        await modal.alert("Option created successfully", "Success", "success");
      }
    } catch (err: any) {
      setSubmitting(false); // Stop loading state on error
      await modal.alert(
        getErrorMessage(err) || "Failed to save option",
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
          Option Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Option
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Options Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Option Values
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {options.map((option) => (
              <tr key={option.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {option.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm" style={{ color: "#374151" }}>
                    {option.displayName}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {option.optionLists.map((value, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#6b7280" }}
                >
                  {option._count?.products || 0} product(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(option)}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(option.id)}
                    className="font-semibold hover:underline cursor-pointer"
                    style={{ color: "#DC2626", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {options.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center"
                  style={{ color: "#6b7280" }}
                >
                  No options found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Option Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingOption ? "Edit Option" : "Add New Option"}
        maxWidth="2xl"
      >
        <Formik
          initialValues={{
            name: editingOption?.name || "",
            displayName: editingOption?.displayName || "",
            optionLists: editingOption?.optionLists || [""],
          }}
          validationSchema={optionSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Option Name (identifier) *
                </label>
                <Field
                  name="name"
                  type="text"
                  className="input-field"
                  placeholder="e.g., size, color, material"
                />
                <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  Lowercase, no spaces. Use underscores if needed (e.g., "product_size")
                </p>
                {errors.name && touched.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Display Name *
                </label>
                <Field
                  name="displayName"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Size, Color, Material"
                />
                <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                  User-friendly name shown in the UI
                </p>
                {errors.displayName && touched.displayName && (
                  <p className="text-red-600 text-sm mt-1">{errors.displayName}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Option Values *
                </label>
                <FieldArray name="optionLists">
                  {({ push, remove, form }) => (
                    <div className="space-y-2">
                      {values.optionLists.map((_, index) => (
                        <div key={index} className="flex gap-2">
                          <Field
                            name={`optionLists.${index}`}
                            type="text"
                            className="input-field flex-1"
                            placeholder="e.g., Small, Medium, Large"
                          />
                          {values.optionLists.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => push("")}
                        className="text-sm hover:underline"
                        style={{ color: "#2563eb" }}
                      >
                        + Add Value
                      </button>
                    </div>
                  )}
                </FieldArray>
                {errors.optionLists && touched.optionLists && (
                  <p className="text-red-600 text-sm mt-1">
                    {typeof errors.optionLists === "string"
                      ? errors.optionLists
                      : "At least one option value is required"}
                  </p>
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
                    : editingOption
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

