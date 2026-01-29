/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff FAQ Management Page
 * CRUD operations for FAQs (requires CONTENT_MANAGEMENT permission)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import { FAQ, CreateFAQRequest, UpdateFAQRequest } from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
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
  const [expandedFAQId, setExpandedFAQId] = useState<string | null>(null);
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
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this FAQ? This action cannot be undone.",
      "Delete FAQ"
    );
    if (!confirmed) return;

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

    // Create updated FAQs array with swapped orders
    const updatedFAQs = [...faqs];
    
    // Swap the FAQs in the array
    [updatedFAQs[currentIndex], updatedFAQs[newIndex]] = [
      updatedFAQs[newIndex],
      updatedFAQs[currentIndex],
    ];

    // Prepare bulk update payload with all FAQs and their new orders
    const bulkUpdatePayload = updatedFAQs.map((faq, index) => ({
      id: faq.id,
      order: index,
    }));

    try {
      await api.faqs.bulkUpdateOrders({ updates: bulkUpdatePayload });
      setSuccessMessage("FAQ order updated successfully");
      fetchFAQs();
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to update FAQ order:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
        direction,
        faqId: id,
      });
      setError(errorMsg || "Failed to update FAQ order");
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

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(faqs, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Access Denied</p>
          <p className="text-muted-foreground mt-2">You do not have permission to access this page</p>
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
      {modal.ModalComponent}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">FAQ Management</h1>
          <p className="text-muted-foreground mt-1">Manage frequently asked questions</p>
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
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <p className="text-muted-foreground text-lg">No FAQs found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First FAQ
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Answer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {paginatedData.map((faq) => {
                  const index = faqs.findIndex((f) => f.id === faq.id);
                  return (
                  <React.Fragment key={faq.id}>
                    <tr className="hover:bg-background">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{faq.order}</span>
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveOrder(faq.id, "up")}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => handleMoveOrder(faq.id, "down")}
                              disabled={index === faqs.length - 1}
                              className="text-gray-400 hover:text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-foreground max-w-md truncate">
                          {faq.question}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-muted-foreground max-w-md truncate">{faq.answer}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            faq.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-foreground"
                          }`}
                        >
                          {faq.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedFAQId(expandedFAQId === faq.id ? null : faq.id)}
                            className="font-semibold hover:underline cursor-pointer"
                            style={{ color: "#2C5BBB", cursor: "pointer" }}
                          >
                            {expandedFAQId === faq.id ? "Hide Details" : "View Details"}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(faq.id, faq.isActive)}
                            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                              faq.isActive
                                ? "hover:bg-yellow-200"
                                : "hover:bg-green-200"
                            }`}
                            style={{
                              backgroundColor: faq.isActive ? "#fef3c7" : "#d1fae5",
                              color: faq.isActive ? "#92400e" : "#166534",
                            }}
                          >
                            {faq.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => openEditModal(faq)}
                            className="px-3 py-1 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                            style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(faq.id)}
                            className="px-3 py-1 rounded hover:bg-red-200 transition-colors cursor-pointer"
                            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedFAQId === faq.id && (
                      <tr key={`${faq.id}-details`}>
                        <td colSpan={5} className="px-4 py-4 bg-background">
                          <div className="bg-card rounded-lg border border-border p-6">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">
                              FAQ Details
                            </h3>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                  Question
                                </label>
                                <div className="text-sm text-foreground bg-background p-3 rounded-lg border border-border">
                                  {faq.question}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                  Answer
                                </label>
                                <div className="text-sm text-foreground bg-background p-3 rounded-lg border border-border whitespace-pre-wrap">
                                  {faq.answer}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                    Order
                                  </label>
                                  <div className="text-sm text-foreground">{faq.order}</div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                    Status
                                  </label>
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      faq.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-foreground"
                                    }`}
                                  >
                                    {faq.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>
                              {faq.createdAt && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                    Created At
                                  </label>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(faq.createdAt).toLocaleString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                <label htmlFor="question" className="block text-sm font-medium text-muted-foreground mb-1">
                  Question *
                </label>
                <Field
                  id="question"
                  name="question"
                  as="textarea"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter question..."
                />
                {errors.question && touched.question && (
                  <p className="mt-1 text-sm text-red-600">{errors.question}</p>
                )}
              </div>

              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-muted-foreground mb-1">
                  Answer *
                </label>
                <Field
                  id="answer"
                  name="answer"
                  as="textarea"
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter answer..."
                />
                {errors.answer && touched.answer && (
                  <p className="mt-1 text-sm text-red-600">{errors.answer}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="order" className="block text-sm font-medium text-muted-foreground mb-1">
                    Order
                  </label>
                  <Field
                    id="order"
                    name="order"
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="h-4 w-4 text-blue-600 focus:ring-primary border-border rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-muted-foreground">
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
                  className="btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
