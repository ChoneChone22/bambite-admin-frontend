/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Staff Interview Management Page
 * Create and manage interviews for job applications (requires recruitment_management permission)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  Interview,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  JobApplication,
} from "@/src/types/api";
import { formatDateTime, getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import { DatePicker } from "@/components/ui/date-picker";

// Validation Schema
const interviewSchema = Yup.object().shape({
  applyJobId: Yup.string().required("Application is required"),
  meetingUrl: Yup.string()
    .url("Must be a valid URL")
    .required("Meeting URL is required"),
  meetingDate: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .required("Meeting date is required"),
  meetingTime: Yup.string()
    .matches(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be in HH:MM or HH:MM:SS format")
    .required("Meeting time is required"),
  notes: Yup.string(),
});

export default function InterviewsManagementPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [approvedApplications, setApprovedApplications] = useState<
    JobApplication[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [applyJobFilter, setApplyJobFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const modal = useModal();

  const fetchInterviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: any = {};
      if (applyJobFilter !== "all") {
        filters.applyJobId = applyJobFilter;
      }
      if (dateFilter) {
        filters.meetingDate = dateFilter;
      }
      const response = await api.interviews.getAll(filters);
      setInterviews(response);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch interviews:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
        filters: { applyJobFilter, dateFilter },
      });
      setError(errorMsg || "Failed to fetch interviews. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApprovedApplications = async () => {
    try {
      const response = await api.jobApplications.getAll({ status: "approved" });
      setApprovedApplications(response);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch approved applications:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      // Don't set error state for approved applications as it's not critical
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchApprovedApplications();
  }, [applyJobFilter, dateFilter]);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(interviews, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const handleCreate = () => {
    setEditingInterview(null);
    setShowModal(true);
  };

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this interview? This action cannot be undone.",
      "Delete Interview"
    );
    if (!confirmed) return;

    try {
      await api.interviews.delete(id);
      await fetchInterviews();
      await modal.alert("Interview deleted successfully", "Success", "success");
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to delete interview",
        "Error",
        "error"
      );
      console.error("Failed to delete interview:", err);
    }
  };

  const handleSubmit = async (
    values: CreateInterviewRequest | UpdateInterviewRequest,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (editingInterview) {
        await api.interviews.update(editingInterview.id, values);
        setSubmitting(false);
        resetForm();
        setShowModal(false);
        setEditingInterview(null);
        await fetchInterviews();
        await fetchApprovedApplications();
        await modal.alert("Interview updated successfully", "Success", "success");
      } else {
        await api.interviews.create(values as CreateInterviewRequest);
        setSubmitting(false);
        resetForm();
        setShowModal(false);
        setEditingInterview(null);
        await fetchInterviews();
        await fetchApprovedApplications();
        await modal.alert("Interview created successfully", "Success", "success");
      }
    } catch (err: any) {
      setSubmitting(false);
      await modal.alert(
        getErrorMessage(err) || "Failed to save interview",
        "Error",
        "error"
      );
      console.error("Failed to save interview:", err);
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
          Interview Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Schedule Interview
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6 text-foreground">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="min-w-[200px]">
          <select
            value={applyJobFilter}
            onChange={(e) => setApplyJobFilter(e.target.value)}
            className="input-field w-full"
          >
            <option value="all">All Applications</option>
            {approvedApplications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name} - {app.jobPost?.title}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[200px]">
          <DatePicker
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="Filter by date"
            className="w-full"
          />
        </div>
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors text-foreground"
          >
            Clear Date Filter
          </button>
        )}
      </div>

      {/* Interviews Table */}
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
                  Meeting Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Meeting URL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {paginatedData.map((interview) => (
                <tr key={interview.id} className="hover:bg-background">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-medium"
                    >
                      {interview.applyJob?.name || "N/A"}
                    </div>
                    <div className="text-sm text-foreground">
                      {interview.applyJob?.email || ""}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {interview.applyJob?.jobPost?.title || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {interview.meetingDate}
                    </div>
                    <div className="text-sm text-foreground">
                      {interview.meetingTime} (UTC)
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate max-w-xs block text-foreground"
                    >
                      {interview.meetingUrl}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleEdit(interview)}
                      className="font-semibold hover:underline cursor-pointer"
                      style={{ color: "#2C5BBB", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(interview.id)}
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
                    No interviews found
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

      {/* Interview Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingInterview(null);
        }}
        title={
          editingInterview ? "Edit Interview" : "Schedule New Interview"
        }
        maxWidth="md"
      >
        <Formik
          initialValues={{
            applyJobId: editingInterview?.applyJobId || "",
            meetingUrl: editingInterview?.meetingUrl || "",
            meetingDate: editingInterview?.meetingDate || "",
            meetingTime: editingInterview?.meetingTime || "",
            notes: editingInterview?.notes || "",
          }}
          validationSchema={interviewSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
                  Application *
                </label>
                <Field
                  as="select"
                  name="applyJobId"
                  className="input-field"
                  disabled={!!editingInterview}
                >
                  <option value="">Select an approved application</option>
                  {approvedApplications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} - {app.jobPost?.title}
                    </option>
                  ))}
                </Field>
                {errors.applyJobId && touched.applyJobId && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.applyJobId}
                  </p>
                )}
                {approvedApplications.length === 0 && (
                  <p className="text-sm mt-1 text-foreground">
                    No approved applications available. Approve an application
                    first.
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
                  Meeting URL *
                </label>
                <Field
                  name="meetingUrl"
                  type="url"
                  className="input-field"
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
                {errors.meetingUrl && touched.meetingUrl && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.meetingUrl}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Meeting Date * (YYYY-MM-DD)
                  </label>
                  <Field name="meetingDate">
                    {({ field, form }: any) => (
                      <DatePicker
                        value={field.value}
                        onChange={(v) => form.setFieldValue("meetingDate", v)}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    )}
                  </Field>
                  {errors.meetingDate && touched.meetingDate && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.meetingDate}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1 text-foreground"
                  >
                    Meeting Time * (HH:MM UTC)
                  </label>
                  <Field
                    name="meetingTime"
                    type="time"
                    className="input-field"
                  />
                  {errors.meetingTime && touched.meetingTime && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.meetingTime}
                    </p>
                  )}
                  <p className="text-xs mt-1 text-foreground">
                    Time is in UTC
                  </p>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1 text-foreground"
                >
                  Notes (Optional)
                </label>
                <Field
                  as="textarea"
                  name="notes"
                  rows={4}
                  className="input-field"
                  placeholder="Additional notes for the interview..."
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
                  {isSubmitting
                    ? "Saving..."
                    : editingInterview
                    ? "Update"
                    : "Schedule"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingInterview(null);
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
