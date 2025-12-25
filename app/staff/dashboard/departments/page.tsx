/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Department Management Page
 * CRUD operations for departments (requires DEPARTMENT_MANAGEMENT permission)
 */

"use client";

import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { Department } from "@/src/types/api";

const departmentSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .required("Name is required"),
  shortName: Yup.string()
    .min(2, "Short name must be at least 2 characters")
    .max(10, "Short name must not exceed 10 characters")
    .matches(/^[A-Z0-9]+$/, "Short name must be uppercase letters/numbers")
    .required("Short name is required"),
  status: Yup.string()
    .oneOf(["active", "inactive"], "Invalid status")
    .required("Status is required"),
});

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.departments.getAll();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      setError("Failed to fetch departments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = () => {
    setShowModal(true);
  };

  const handleToggleStatus = async (dept: Department) => {
    const newStatus = dept.status === "active" ? "inactive" : "active";
    try {
      await api.departments.updateStatus(dept.id, newStatus);
      await fetchDepartments();
    } catch (err: any) {
      alert(err.message || "Failed to update department status");
    }
  };

  const handleSubmit = async (
    values: {
      name: string;
      shortName: string;
      status: "active" | "inactive";
    },
    { setSubmitting, resetForm }: any
  ) => {
    try {
      await api.departments.create(values);
      resetForm();
      setShowModal(false);
      await fetchDepartments();
    } catch (err: any) {
      alert(err.message || "Failed to create department");
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
          Department Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Department
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Departments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Short Name
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
            {departments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {dept.name}
                  </div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm font-mono"
                  style={{ color: "#000000" }}
                >
                  {dept.shortName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      dept.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {dept.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleStatus(dept)}
                    className="font-semibold hover:underline"
                  >
                    {dept.status === "active" ? (
                      <span className="text-yellow-700">Deactivate</span>
                    ) : (
                      <span className="text-green-700">Activate</span>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {departments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No departments found.</p>
          </div>
        )}
      </div>

      {/* Department Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "#000000" }}
            >
              Add New Department
            </h2>

            <Formik
              initialValues={{
                name: "",
                shortName: "",
                status: "active" as "active" | "inactive",
              }}
              validationSchema={departmentSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department Name *
                    </label>
                    <Field
                      name="name"
                      type="text"
                      className="input-field"
                      placeholder="e.g., Kitchen"
                    />
                    {errors.name && touched.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Name (ID Prefix) *
                    </label>
                    <Field
                      name="shortName"
                      type="text"
                      className="input-field"
                      placeholder="e.g., KIT"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used as prefix for employee IDs (e.g., KIT-0001).
                    </p>
                    {errors.shortName && touched.shortName && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.shortName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <Field as="select" name="status" className="input-field">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Field>
                    {errors.status && touched.status && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.status}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1 cursor-pointer"
                    >
                      {isSubmitting ? "Creating..." : "Create"}
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


