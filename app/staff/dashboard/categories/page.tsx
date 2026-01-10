/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Category Management Page
 * CRUD operations for product categories (requires product_category_management permission)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";

// Validation Schema
const categorySchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must not exceed 100 characters")
    .required("Category name is required"),
  status: Yup.string()
    .oneOf(["active", "inactive"], "Status must be active or inactive")
    .required("Status is required"),
});

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const modal = useModal();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.categories.getAll();
      setCategories(response);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setError(errorMsg || "Failed to fetch categories");
      console.error("Failed to fetch categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on status and search query
  const filteredCategories = useMemo(() => {
    let filtered = categories.filter((category) => {
      if (statusFilter === "all") return true;
      return category.status === statusFilter;
    });

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((category) => {
        const name = category.name?.toLowerCase() || "";
        const productCount = category._count?.products?.toString() || "";
        return name.includes(query) || productCount.includes(query);
      });
    }

    return filtered;
  }, [categories, statusFilter, searchQuery]);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(filteredCategories, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const handleCreate = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this category? This action cannot be undone.",
      "Delete Category"
    );
    if (!confirmed) return;

    try {
      await api.categories.delete(id);
      await fetchCategories();
      await modal.alert("Category deleted successfully", "Success", "success");
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      // Check if error is about products in stock
      if (errorMsg.includes("products in stock") || errorMsg.includes("Cannot deactivate")) {
        await modal.alert(
          errorMsg,
          "Cannot Delete Category",
          "error"
        );
      } else {
        await modal.alert(
          errorMsg || "Failed to delete category",
          "Error",
          "error"
        );
      }
      console.error("Failed to delete category:", err);
    }
  };

  const handleToggleStatus = async (category: Category) => {
    const newStatus = category.status === "active" ? "inactive" : "active";
    const action = newStatus === "inactive" ? "deactivate" : "activate";

    const confirmed = await modal.confirm(
      `Are you sure you want to ${action} this category?`,
      `${action === "deactivate" ? "Deactivate" : "Activate"} Category`
    );
    if (!confirmed) return;

    try {
      await api.categories.updateStatus(category.id, newStatus);
      await fetchCategories();
      await modal.alert(
        `Category ${action}d successfully`,
        "Success",
        "success"
      );
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      // Check if error is about products in stock
      if (errorMsg.includes("products in stock") || errorMsg.includes("Cannot deactivate")) {
        await modal.alert(
          errorMsg,
          "Cannot Deactivate Category",
          "error"
        );
      } else {
        await modal.alert(
          errorMsg || `Failed to ${action} category`,
          "Error",
          "error"
        );
      }
      console.error(`Failed to ${action} category:`, err);
    }
  };

  const handleSubmit = async (
    values: CreateCategoryRequest | UpdateCategoryRequest,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingCategory) {
        await api.categories.update(editingCategory.id, values as UpdateCategoryRequest);
        setSubmitting(false);
        resetForm();
        setShowModal(false);
        await fetchCategories();
        await modal.alert("Category updated successfully", "Success", "success");
      } else {
        await api.categories.create(values as CreateCategoryRequest);
        setSubmitting(false);
        resetForm();
        setShowModal(false);
        await fetchCategories();
        await modal.alert("Category created successfully", "Success", "success");
      }
    } catch (err: any) {
      setSubmitting(false);
      await modal.alert(
        getErrorMessage(err) || "Failed to save category",
        "Error",
        "error"
      );
      console.error("Failed to save category:", err);
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
          Category Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Category
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search categories by name or product count..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field w-full max-w-md"
        />
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setStatusFilter("all")}
          className="px-4 py-2 rounded transition-colors"
          style={
            statusFilter === "all"
              ? { backgroundColor: "#2C5BBB", color: "#ffffff" }
              : { backgroundColor: "#e5e7eb", color: "#374151" }
          }
          onMouseEnter={(e) => {
            if (statusFilter !== "all") {
              e.currentTarget.style.backgroundColor = "#d1d5db";
            }
          }}
          onMouseLeave={(e) => {
            if (statusFilter !== "all") {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }
          }}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("active")}
          className="px-4 py-2 rounded transition-colors"
          style={
            statusFilter === "active"
              ? { backgroundColor: "#2C5BBB", color: "#ffffff" }
              : { backgroundColor: "#e5e7eb", color: "#374151" }
          }
          onMouseEnter={(e) => {
            if (statusFilter !== "active") {
              e.currentTarget.style.backgroundColor = "#d1d5db";
            }
          }}
          onMouseLeave={(e) => {
            if (statusFilter !== "active") {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }
          }}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          className="px-4 py-2 rounded transition-colors"
          style={
            statusFilter === "inactive"
              ? { backgroundColor: "#2C5BBB", color: "#ffffff" }
              : { backgroundColor: "#e5e7eb", color: "#374151" }
          }
          onMouseEnter={(e) => {
            if (statusFilter !== "inactive") {
              e.currentTarget.style.backgroundColor = "#d1d5db";
            }
          }}
          onMouseLeave={(e) => {
            if (statusFilter !== "inactive") {
              e.currentTarget.style.backgroundColor = "#e5e7eb";
            }
          }}
        >
          Inactive
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm"
                    style={{ color: "#6b7280" }}
                  >
                    No categories found
                  </td>
                </tr>
              ) : (
                paginatedData.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium"
                      style={{ color: "#000000" }}
                    >
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        category.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {category.status}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm"
                    style={{ color: "#6b7280" }}
                  >
                    {category._count?.products || 0} product(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleToggleStatus(category)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{
                        color: category.status === "active" ? "#ea580c" : "#16a34a",
                        cursor: "pointer",
                      }}
                    >
                      {category.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#2C5BBB", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#DC2626", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredCategories.length > 0 && (
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
      </div>

      {/* Category Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCategory ? "Edit Category" : "Add New Category"}
        maxWidth="md"
      >
        <Formik
          initialValues={{
            name: editingCategory?.name || "",
            status: editingCategory?.status || ("active" as "active" | "inactive"),
          }}
          validationSchema={categorySchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Category Name *
                </label>
                <Field
                  name="name"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Main Dish"
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

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingCategory
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
