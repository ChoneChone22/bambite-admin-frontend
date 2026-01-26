/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Place Tag Management Page
 * CRUD operations for place tags (used for job posts)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  PlaceTag,
  CreatePlaceTagRequest,
  UpdatePlaceTagRequest,
} from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";

// Validation Schema
const placeTagSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Place tag name must be at least 2 characters")
    .max(100, "Place tag name must not exceed 100 characters")
    .required("Place tag name is required"),
  status: Yup.string()
    .oneOf(["active", "inactive"], "Status must be active or inactive")
    .required("Status is required"),
});

export default function PlaceTagsManagementPage() {
  const [placeTags, setPlaceTags] = useState<PlaceTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlaceTag, setEditingPlaceTag] = useState<PlaceTag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");
  const modal = useModal();

  const fetchPlaceTags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: any = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      const response = await api.placeTags.getAll(filters);
      setPlaceTags(response);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch place tags:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
        filters: statusFilter,
      });
      setError(errorMsg || "Failed to fetch place tags. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaceTags();
  }, [statusFilter]);

  // Filter place tags based on status
  const filteredPlaceTags = useMemo(() => {
    if (statusFilter === "all") {
      return placeTags;
    }
    return placeTags.filter((tag) => tag.status === statusFilter);
  }, [placeTags, statusFilter]);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(filteredPlaceTags, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const handleCreate = () => {
    setEditingPlaceTag(null);
    setShowModal(true);
  };

  const handleEdit = (placeTag: PlaceTag) => {
    setEditingPlaceTag(placeTag);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this place tag? This action cannot be undone.",
      "Delete Place Tag"
    );
    if (!confirmed) return;

    try {
      await api.placeTags.delete(id);
      await fetchPlaceTags();
      await modal.alert("Place tag deleted successfully", "Success", "success");
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      if (
        errorMsg.includes("job posts") ||
        errorMsg.includes("Cannot deactivate")
      ) {
        await modal.alert(
          errorMsg,
          "Cannot Delete Place Tag",
          "error"
        );
      } else {
        await modal.alert(
          errorMsg || "Failed to delete place tag",
          "Error",
          "error"
        );
      }
      console.error(err);
    }
  };

  const handleToggleStatus = async (placeTag: PlaceTag) => {
    const newStatus = placeTag.status === "active" ? "inactive" : "active";
    try {
      await api.placeTags.updateStatus(placeTag.id, newStatus);
      await fetchPlaceTags();
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      await modal.alert(
        errorMsg || "Failed to update place tag status",
        "Error",
        "error"
      );
    }
  };

  const handleSubmit = async (
    values: CreatePlaceTagRequest | UpdatePlaceTagRequest,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingPlaceTag) {
        await api.placeTags.update(editingPlaceTag.id, values as UpdatePlaceTagRequest);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        setEditingPlaceTag(null);
        await fetchPlaceTags();
        await modal.alert("Place tag updated successfully", "Success", "success");
      } else {
        await api.placeTags.create(values as CreatePlaceTagRequest);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        setEditingPlaceTag(null);
        await fetchPlaceTags();
        await modal.alert("Place tag created successfully", "Success", "success");
      }
    } catch (err: any) {
      setSubmitting(false); // Stop loading state on error
      await modal.alert(
        getErrorMessage(err) || "Failed to save place tag",
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
          Place Tag Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Place Tag
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6" style={{ color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded ${
            statusFilter === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          style={
            statusFilter === "all"
              ? { backgroundColor: "#3b82f6", color: "#ffffff" }
              : { backgroundColor: "#e5e7eb", color: "#374151" }
          }
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-4 py-2 rounded ${
            statusFilter === "active" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          style={
            statusFilter === "active"
              ? { backgroundColor: "#3b82f6", color: "#ffffff" }
              : { backgroundColor: "#e5e7eb", color: "#374151" }
          }
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          className={`px-4 py-2 rounded ${
            statusFilter === "inactive"
              ? "bg-blue-500 text-white"
              : "bg-gray-200"
          }`}
          style={
            statusFilter === "inactive"
              ? { backgroundColor: "#3b82f6", color: "#ffffff" }
              : { backgroundColor: "#e5e7eb", color: "#374151" }
          }
        >
          Inactive
        </button>
      </div>

      {/* Place Tags Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Name
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Status
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Job Posts
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((placeTag) => (
              <tr key={placeTag.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {placeTag.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      placeTag.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {placeTag.status}
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#6b7280" }}
                >
                  {placeTag._count?.jobPosts || 0} job post(s)
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleStatus(placeTag)}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{
                      color: placeTag.status === "active" ? "#ea580c" : "#16a34a",
                      cursor: "pointer",
                    }}
                  >
                    {placeTag.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleEdit(placeTag)}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(placeTag.id)}
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

        {totalRows === 0 && (
          <div className="text-center py-12">
            <p style={{ color: "#6b7280" }}>No place tags found</p>
          </div>
        )}
      </div>

      {totalRows > 0 && (
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

      {/* Place Tag Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingPlaceTag(null);
        }}
        title={editingPlaceTag ? "Edit Place Tag" : "Add New Place Tag"}
        maxWidth="md"
      >
        <Formik
          initialValues={{
            name: editingPlaceTag?.name || "",
            status: editingPlaceTag?.status || "active",
          }}
          validationSchema={placeTagSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Place Tag Name *
                </label>
                <Field
                  name="name"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Yangon, Mandalay"
                />
                {errors.name && touched.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Status *
                </label>
                <Field as="select" name="status" className="input-field">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Field>
                {errors.status && touched.status && (
                  <p className="text-red-600 text-sm mt-1">{errors.status}</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingPlaceTag
                    ? "Update"
                    : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPlaceTag(null);
                  }}
                  className="btn-secondary flex-1 cursor-pointer"
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

