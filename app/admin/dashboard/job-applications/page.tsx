/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Job Application Management Page
 * View and manage job applications
 */

"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";
import {
  JobApplication,
  JobPost,
  UpdateJobApplicationStatusRequest,
  SendEmailToApplicantRequest,
} from "@/src/types/api";
import { formatDateTime, getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import FormModal from "@/src/components/FormModal";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

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
    } catch (err) {
      setError("Failed to fetch applications");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobPosts = async () => {
    try {
      const response = await api.jobPosts.getAll();
      setJobPosts(response);
    } catch (err) {
      console.error("Failed to fetch job posts:", err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchJobPosts();
  }, [statusFilter, jobPostFilter, emailSearch]);

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
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      // Find the application in the current list first (for fallback)
      const tableApplication = applications.find((app) => app.id === id);
      
      // Fetch full details from API
      const fetchedApplication = await api.jobApplications.getById(id);
      
      // Merge fetched data with table data to ensure all fields are available
      const mergedApplication: JobApplication = {
        ...tableApplication,
        ...fetchedApplication,
        // Ensure nested objects are preserved
        jobPost: fetchedApplication.jobPost || tableApplication?.jobPost,
      };
      
      setSelectedApplication(mergedApplication);
    } catch (err: any) {
      // Fallback: use application from table if fetch fails
      const tableApplication = applications.find((app) => app.id === id);
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
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return { backgroundColor: "#dcfce7", color: "#166534" }; // green-100 bg, green-800 text
      case "rejected":
        return { backgroundColor: "#fee2e2", color: "#991b1b" }; // red-100 bg, red-800 text
      default:
        return { backgroundColor: "#fef3c7", color: "#854d0e" }; // yellow-100 bg, yellow-800 text
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
          Job Application Management
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6" style={{ color: "#b91c1c" }}>
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
          {APPLICATION_STATUSES.map((status) => (
            <button
              key={status.value}
              onClick={() =>
                setStatusFilter(
                  status.value as "pending" | "approved" | "rejected"
                )
              }
              className={`px-4 py-2 rounded ${
                statusFilter === status.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
              style={
                statusFilter === status.value
                  ? { backgroundColor: "#3b82f6", color: "#ffffff" }
                  : { backgroundColor: "#e5e7eb", color: "#374151" }
              }
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Applicant
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Job Post
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
                Applied Date
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
            {applications.map((application) => (
              <tr key={application.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {application.name}
                  </div>
                  <div className="text-sm" style={{ color: "#6b7280" }}>
                    {application.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm" style={{ color: "#000000" }}>
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
                    className="px-3 py-1.5 text-xs font-medium rounded cursor-pointer appearance-none"
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
                    onFocus={(e) => {
                      e.target.style.outline = "2px solid #3b82f6";
                      e.target.style.outlineOffset = "2px";
                      e.target.style.borderColor = "#3b82f6";
                    }}
                    onBlur={(e) => {
                      e.target.style.outline = "none";
                      e.target.style.borderColor = "rgba(0, 0, 0, 0.15)";
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
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#6b7280" }}
                >
                  {application.createdAt
                    ? formatDateTime(application.createdAt)
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleViewDetails(application.id)}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => {
                      // Use application data directly from table (already has email)
                      setEmailApplication(application);
                      setShowEmailModal(true);
                    }}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
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
          </tbody>
        </table>

        {applications.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: "#6b7280" }}>No applications found</p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && !showEmailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedApplication(null);
            }
          }}
        >
          {/* Backdrop with glass effect - light overlay with subtle blur */}
          <div
            className="fixed inset-0 bg-white/30 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
            onClick={() => setSelectedApplication(null)}
          />

          {/* Modal */}
          <div
            className="relative bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform border border-gray-100 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "#000000" }}
                >
                  Application Details
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  style={{ color: "#6b7280" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Applicant Name
                  </label>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {selectedApplication.name || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Email
                  </label>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {selectedApplication.email || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Job Post
                  </label>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {selectedApplication.jobPost?.title || "N/A"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
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
                      style={{ color: "#374151" }}
                    >
                      Joining Reason
                    </label>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "#000000" }}>
                      {selectedApplication.joiningReason}
                    </p>
                  </div>
                )}

                {selectedApplication.additionalQuestion && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#374151" }}
                    >
                      Additional Information
                    </label>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "#000000" }}>
                      {selectedApplication.additionalQuestion}
                    </p>
                  </div>
                )}

                {selectedApplication.coverLetter && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#374151" }}
                    >
                      Cover Letter
                    </label>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "#000000" }}>
                      {selectedApplication.coverLetter}
                    </p>
                  </div>
                )}

                {selectedApplication.uploadedFileUrl && (
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: "#374151" }}
                    >
                      Resume/CV
                    </label>
                    <a
                      href={selectedApplication.uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      style={{ color: "#2563eb" }}
                    >
                      View PDF
                    </a>
                  </div>
                )}

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Applied At
                  </label>
                  <p className="text-sm" style={{ color: "#6b7280" }}>
                    {selectedApplication.createdAt
                      ? formatDateTime(selectedApplication.createdAt)
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => {
                    // Use selectedApplication data directly (already has email from detail view)
                    setEmailApplication(selectedApplication);
                    setShowEmailModal(true);
                  }}
                  className="btn-primary flex-1"
                >
                  Send Email
                </button>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="btn-secondary flex-1"
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
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    To
                  </label>
                  <p className="text-sm" style={{ color: "#000000" }}>
                    {emailApplication.name}
                    {emailApplication.email && emailApplication.email.trim()
                      ? ` (${emailApplication.email})`
                      : " (No email address)"}
                    {!emailApplication.email && " (No email address)"}
                  </p>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
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
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
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

