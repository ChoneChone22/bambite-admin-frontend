/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Job Application Management Page
 * View and manage job applications (requires recruitment_management permission)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/src/services/api";
import {
  JobApplication,
  JobPost,
  UpdateJobApplicationStatusRequest,
  SendEmailToApplicantRequest,
} from "@/src/types/api";
import { formatDateTime, getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import LoadingSpinner from "@/src/components/LoadingSpinner";

const APPLICATION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const emailSchema = Yup.object().shape({
  message: Yup.string()
    .min(10, "Message must be at least 10 characters")
    .required("Message is required"),
  notes: Yup.string(),
});

export default function JobApplicationsManagementPage() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("all");
  const [jobPostFilter, setJobPostFilter] = useState<string>("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null);
  const [emailApplication, setEmailApplication] =
    useState<JobApplication | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const modal = useModal();

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: any = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }
      if (jobPostFilter !== "all") {
        filters.jobPostId = jobPostFilter;
      }
      if (emailSearch.trim()) {
        filters.email = emailSearch.trim();
      }
      const response = await api.jobApplications.getAll(filters);
      setApplications(response);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch applications:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
        filters: { statusFilter, jobPostFilter, emailSearch },
      });
      setError(errorMsg || "Failed to fetch applications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobPosts = async () => {
    try {
      const response = await api.jobPosts.getAll();
      setJobPosts(response);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch job posts:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      // Don't set error state for job posts as it's not critical
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchJobPosts();
  }, [statusFilter, jobPostFilter, emailSearch]);

  // Filter applications based on filters (already filtered by API, but keep for consistency)
  const filteredApplications = useMemo(() => {
    return applications;
  }, [applications]);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(filteredApplications, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const handleStatusChange = async (
    id: string,
    status: "pending" | "approved" | "rejected"
  ) => {
    try {
      await api.jobApplications.updateStatus(id, { status });
      await fetchApplications();
      await modal.alert("Status updated successfully", "Success", "success");
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to update status",
        "Error",
        "error"
      );
      console.error("Failed to update status:", err);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const tableApplication = filteredApplications.find((app) => app.id === id);
      const fetchedApplication = await api.jobApplications.getById(id);
      const mergedApplication: JobApplication = {
        ...tableApplication,
        ...fetchedApplication,
        jobPost: fetchedApplication.jobPost || tableApplication?.jobPost,
      };
      setSelectedApplication(mergedApplication);
    } catch (err: any) {
      const tableApplication = filteredApplications.find((app) => app.id === id);
      if (tableApplication) {
        setSelectedApplication(tableApplication);
      } else {
        await modal.alert(
          getErrorMessage(err) || "Failed to load application details",
          "Error",
          "error"
        );
      }
    }
  };

  const handleSendEmail = async (values: SendEmailToApplicantRequest) => {
    if (!emailApplication) return;

    try {
      await api.jobApplications.sendEmail(emailApplication.id, values);
      setShowEmailModal(false);
      setEmailApplication(null);
      await modal.alert("Email sent successfully", "Success", "success");
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to send email",
        "Error",
        "error"
      );
      console.error("Failed to send email:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this application? This action cannot be undone.",
      "Delete Application"
    );
    if (!confirmed) return;

    try {
      await api.jobApplications.delete(id);
      await fetchApplications();
      await modal.alert("Application deleted successfully", "Success", "success");
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to delete application",
        "Error",
        "error"
      );
      console.error("Failed to delete application:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return {
          backgroundColor: "hsl(var(--success) / 0.2)",
          color: "hsl(var(--success))",
        };
      case "rejected":
        return {
          backgroundColor: "hsl(var(--destructive) / 0.2)",
          color: "hsl(var(--destructive))",
        };
      default:
        return {
          backgroundColor: "hsl(var(--warning) / 0.2)",
          color: "hsl(var(--warning))",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div>
      {modal.ModalComponent}
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Job Application Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 text-foreground">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by email..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            className="input-field w-full"
          />
        </div>
        <div className="min-w-[200px]">
          <select
            value={jobPostFilter}
            onChange={(e) => setJobPostFilter(e.target.value)}
            className="input-field w-full"
          >
            <option value="all">All Job Posts</option>
            {jobPosts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
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
          {APPLICATION_STATUSES.map((status) => (
            <button
              key={status.value}
              onClick={() =>
                setStatusFilter(
                  status.value as "pending" | "approved" | "rejected"
                )
              }
              className="px-4 py-2 rounded transition-colors"
              style={
                statusFilter === status.value
                  ? { backgroundColor: "#2C5BBB", color: "#ffffff" }
                  : { backgroundColor: "#e5e7eb", color: "#374151" }
              }
              onMouseEnter={(e) => {
                if (statusFilter !== status.value) {
                  e.currentTarget.style.backgroundColor = "#d1d5db";
                }
              }}
              onMouseLeave={(e) => {
                if (statusFilter !== status.value) {
                  e.currentTarget.style.backgroundColor = "#e5e7eb";
                }
              }}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Job Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedData.map((application) => (
                <tr key={application.id} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium"
                    >
                      {application.name}
                    </div>
                    <div className="text-sm text-foreground">
                      {application.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {application.jobPost?.title || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={application.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as
                          | "pending"
                          | "approved"
                          | "rejected";
                        handleStatusChange(application.id, newStatus);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded cursor-pointer appearance-none transition-colors"
                      style={{
                        ...getStatusColor(application.status),
                        border: "1px solid rgba(0, 0, 0, 0.15)",
                        cursor: "pointer",
                        minWidth: "110px",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 8px center",
                        paddingRight: "28px",
                      }}
                    >
                      {APPLICATION_STATUSES.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#000000",
                          }}
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                  >
                    {application.createdAt
                      ? formatDateTime(application.createdAt)
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleViewDetails(application.id)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#2C5BBB", cursor: "pointer" }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => {
                        setEmailApplication(application);
                        setShowEmailModal(true);
                      }}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#16a34a", cursor: "pointer" }}
                    >
                      Email
                    </button>
                    <button
                      onClick={() => handleDelete(application.id)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#DC2626", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {totalRows === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-foreground"
                  >
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

      {/* Application Detail Modal */}
      {selectedApplication && !showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="application-details-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedApplication(null);
            }
          }}
        >
          <div
            className="fixed inset-0 transition-opacity duration-300 ease-out"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
            onClick={() => setSelectedApplication(null)}
          />
          <div
            className="relative rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform z-10 animate-slideUp"
            style={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              opacity: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="sticky top-0 px-6 py-4 flex items-center justify-between z-10"
              style={{
                backgroundColor: "hsl(var(--card))",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              <h2
                id="application-details-title"
                className="text-2xl font-bold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                Application Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedApplication(null)}
                className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded-md p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Applicant Name
                  </label>
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                    {selectedApplication.name || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Email
                  </label>
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                    {selectedApplication.email || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Job Post
                  </label>
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                    {selectedApplication.jobPost?.title || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Status
                  </label>
                  <span
                    className="px-2 py-1 text-xs font-medium rounded inline-block"
                    style={getStatusColor(selectedApplication.status || "pending")}
                  >
                    {APPLICATION_STATUSES.find(
                      (s) => s.value === selectedApplication.status
                    )?.label || selectedApplication.status || "pending"}
                  </span>
                </div>

                {selectedApplication.joiningReason && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Joining Reason
                    </label>
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {selectedApplication.joiningReason}
                    </p>
                  </div>
                )}

                {selectedApplication.additionalQuestion && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Additional Information
                    </label>
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {selectedApplication.additionalQuestion}
                    </p>
                  </div>
                )}

                {selectedApplication.coverLetter && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Cover Letter
                    </label>
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                )}

                {selectedApplication.uploadedFileUrl && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      Resume/CV
                    </label>
                    <a
                      href={selectedApplication.uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                      style={{ color: "hsl(var(--primary))" }}
                    >
                      View PDF
                    </a>
                  </div>
                )}

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    Applied At
                  </label>
                  <p className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
                    {selectedApplication.createdAt
                      ? formatDateTime(selectedApplication.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    setEmailApplication(selectedApplication);
                    setShowEmailModal(true);
                  }}
                  className="btn-primary flex-1 cursor-pointer"
                >
                  Send Email
                </button>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="btn-secondary flex-1 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      <FormModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailApplication(null);
        }}
        title="Send Email to Applicant"
        maxWidth="md"
      >
        {emailApplication && (
          <Formik
            initialValues={{
              message: "",
              notes: "",
            }}
            validationSchema={emailSchema}
            onSubmit={handleSendEmail}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    To
                  </label>
                  <p className="text-sm text-foreground">
                    {emailApplication.name}
                    {emailApplication.email && emailApplication.email.trim()
                      ? ` (${emailApplication.email})`
                      : " (No email address)"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Message *
                  </label>
                  <Field
                    as="textarea"
                    name="message"
                    rows={6}
                    className="input-field"
                    placeholder="Enter your message to the applicant..."
                  />
                  {errors.message && touched.message && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Internal Notes (Optional)
                  </label>
                  <Field
                    as="textarea"
                    name="notes"
                    rows={3}
                    className="input-field"
                    placeholder="Internal notes (not sent to applicant)..."
                  />
                  {errors.notes && touched.notes && (
                    <p className="text-red-600 text-sm mt-1">{errors.notes}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 cursor-pointer"
                  >
                    {isSubmitting ? "Sending..." : "Send Email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      if (!selectedApplication) {
                        setSelectedApplication(null);
                      }
                    }}
                    className="btn-secondary flex-1 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </FormModal>
    </div>
  );
}
