/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff FAQ Management Page
 * CRUD operations for FAQs (requires CONTENT_MANAGEMENT permission)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { FAQ, CreateFAQRequest, UpdateFAQRequest } from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

// Validation Schema
const faqSchema = Yup.object().shape({
  question: Yup.string()
    .min(5, "Question must be at least 5 characters")
    .max(500, "Question must not exceed 500 characters")
    .required("Question is required"),
  answer: Yup.string()
    .min(10, "Answer must be at least 10 characters")
    .max(2000, "Answer must not exceed 2000 characters")
    .required("Answer is required"),
  isActive: Yup.boolean(),
  order: Yup.number()
    .integer("Order must be a whole number")
    .min(0, "Order cannot be negative"),
});

export default function StaffFAQsManagementPage() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modal = useModal();

  // Check permissions
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const profile = await api.staffAccounts.getProfile();
        const permissions = profile?.permissions || [];
        const permissionCodes = permissions.map((p) => p.code?.toUpperCase() || "");
        const hasContentManagement =
          permissionCodes.includes("CONTENT_MANAGEMENT") ||
          profile?.staff?.user?.role === "ADMIN";
        setHasPermission(hasContentManagement);

        if (!hasContentManagement) {
          setError("You do not have permission to access this page");
          router.push("/staff/dashboard");
        }
      } catch (err) {
        setError("Failed to verify permissions");
        router.push("/staff/dashboard");
      }
    };

    checkPermission();
  }, [router]);

  const fetchFAQs = async () => {
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await api.faqs.getAll({ activeOnly: false });
      const sorted = (response.faqs || []).sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
      setFaqs(sorted);
    } catch (err) {
      setError("Failed to fetch FAQs");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission) {
      fetchFAQs();
    }
  }, [hasPermission]);

  const handleCreate = async (values: CreateFAQRequest) => {
    try {
      await api.faqs.create(values);
      setSuccessMessage("FAQ created successfully");
      setShowModal(false);
      fetchFAQs();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to create FAQ");
      throw err;
    }
  };

  const handleUpdate = async (id: string, values: UpdateFAQRequest) => {
    try {
      await api.faqs.update(id, values);
      setSuccessMessage("FAQ updated successfully");
      setShowModal(false);
      setEditingFAQ(null);
      fetchFAQs();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update FAQ");
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      await api.faqs.delete(id);
      setSuccessMessage("FAQ deleted successfully");
      fetchFAQs();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to delete FAQ");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.faqs.toggleStatus(id, !currentStatus);
      setSuccessMessage(`FAQ ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchFAQs();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update FAQ status");
    }
  };

  const handleMoveOrder = async (id: string, direction: "up" | "down") => {
    const currentIndex = faqs.findIndex((f) => f.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= faqs.length) return;

    const currentFAQ = faqs[currentIndex];
    const targetFAQ = faqs[newIndex];

    try {
      await api.faqs.updateOrder(id, { order: targetFAQ.order });
      await api.faqs.updateOrder(targetFAQ.id, { order: currentFAQ.order });
      setSuccessMessage("FAQ order updated successfully");
      fetchFAQs();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to update FAQ order");
    }
  };

  const openCreateModal = () => {
    setEditingFAQ(null);
    setShowModal(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFAQ(faq);
    setShowModal(true);
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Access Denied</p>
          <p className="text-gray-600 mt-2">You do not have permission to access this page</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          + Add FAQ
        </button>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {successMessage && (
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />
      )}

      {faqs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No FAQs found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First FAQ
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Answer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{faq.order}</span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveOrder(faq.id, "up")}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveOrder(faq.id, "down")}
                            disabled={index === faqs.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                        {faq.question}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500 max-w-md truncate">{faq.answer}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          faq.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {faq.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(faq.id, faq.isActive)}
                          className={`px-3 py-1 rounded ${
                            faq.isActive
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          } transition-colors`}
                        >
                          {faq.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => openEditModal(faq)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingFAQ(null);
        }}
        title={editingFAQ ? "Edit FAQ" : "Create FAQ"}
      >
        <Formik
          initialValues={{
            question: editingFAQ?.question || "",
            answer: editingFAQ?.answer || "",
            isActive: editingFAQ?.isActive ?? true,
            order: editingFAQ?.order || faqs.length,
          }}
          validationSchema={faqSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (editingFAQ) {
                await handleUpdate(editingFAQ.id, values);
              } else {
                await handleCreate(values);
              }
            } catch (err) {
              // Error handled in handleCreate/handleUpdate
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <Field
                  id="question"
                  name="question"
                  as="textarea"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter question..."
                />
                {errors.question && touched.question && (
                  <p className="mt-1 text-sm text-red-600">{errors.question}</p>
                )}
              </div>

              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                  Answer *
                </label>
                <Field
                  id="answer"
                  name="answer"
                  as="textarea"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter answer..."
                />
                {errors.answer && touched.answer && (
                  <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <Field
                    id="order"
                    name="order"
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  {errors.order && touched.order && (
                    <p className="mt-1 text-sm text-red-600">{errors.order}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <Field
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingFAQ(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ backgroundColor: "#ffffff", color: "#374151" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? "Saving..." : editingFAQ ? "Update" : "Create"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </FormModal>
    </div>
  );
}
