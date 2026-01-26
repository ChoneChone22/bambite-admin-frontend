/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Job Post Management Page
 * CRUD operations for job posts
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import api from "@/src/services/api";
import {
  JobPost,
  CreateJobPostRequest,
  UpdateJobPostRequest,
  PlaceTag,
} from "@/src/types/api";
import { formatDateTime, getErrorMessage } from "@/src/lib/utils";
import { useModal } from "@/src/hooks/useModal";
import { useTablePagination } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import FormModal from "@/src/components/FormModal";

// Validation Schema
const jobPostSchema = Yup.object().shape({
  title: Yup.string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must not exceed 200 characters")
    .required("Title is required"),
  placeTagId: Yup.string().required("Place tag is required"),
  tasks: Yup.object().shape({
    title: Yup.string().required("Tasks title is required"),
    descriptions: Yup.array()
      .of(Yup.string().min(5, "Each task description must be at least 5 characters"))
      .min(1, "At least one task description is required")
      .required("Task descriptions are required"),
  }),
  requiredQualifications: Yup.object().shape({
    title: Yup.string().required("Qualifications title is required"),
    descriptions: Yup.array()
      .of(Yup.string().min(5, "Each qualification must be at least 5 characters"))
      .min(1, "At least one qualification is required")
      .required("Qualifications are required"),
  }),
  jobDetails: Yup.object().shape({
    workingHours: Yup.string().required("Working hours is required"),
    contract: Yup.boolean().required("Contract type is required"),
    salary: Yup.string().required("Salary information is required"),
    closeDate: Yup.string().required("Close date is required"),
  }),
});

export default function JobPostsManagementPage() {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [placeTags, setPlaceTags] = useState<PlaceTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJobPost, setEditingJobPost] = useState<JobPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modal = useModal();

  const fetchJobPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.jobPosts.getAll();
      setJobPosts(response);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch job posts:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      setError(errorMsg || "Failed to fetch job posts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaceTags = async () => {
    try {
      const activeTags = await api.placeTags.getActive();
      setPlaceTags(activeTags);
    } catch (err: any) {
      const errorMsg = getErrorMessage(err);
      console.error("Failed to fetch place tags:", {
        error: errorMsg,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      // Don't set error state for place tags as it's not critical
    }
  };

  useEffect(() => {
    fetchJobPosts();
    fetchPlaceTags();
  }, []);

  // Table pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(jobPosts, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const handleCreate = () => {
    setEditingJobPost(null);
    setShowModal(true);
  };

  const handleEdit = (jobPost: JobPost) => {
    setEditingJobPost(jobPost);
    setShowModal(true);
  };

  // Helper to convert ISO date to datetime-local format
  const isoToLocalDateTime = (isoString: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this job post? This action cannot be undone.",
      "Delete Job Post"
    );
    if (!confirmed) return;

    try {
      await api.jobPosts.delete(id);
      await fetchJobPosts();
      await modal.alert("Job post deleted successfully", "Success", "success");
    } catch (err: any) {
      await modal.alert(
        getErrorMessage(err) || "Failed to delete job post",
        "Error",
        "error"
      );
    }
  };

  const handleSubmit = async (
    values: CreateJobPostRequest | UpdateJobPostRequest,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      // Format closeDate to ISO 8601 if it's not already
      const formattedValues = {
        ...values,
        jobDetails: values.jobDetails ? {
          ...values.jobDetails,
          closeDate: values.jobDetails.closeDate?.includes("T")
            ? values.jobDetails.closeDate
            : values.jobDetails.closeDate
            ? `${values.jobDetails.closeDate}T23:59:59Z`
            : undefined,
        } : undefined,
      };

      if (editingJobPost) {
        await api.jobPosts.update(editingJobPost.id, formattedValues);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        setEditingJobPost(null);
        await fetchJobPosts();
        await fetchPlaceTags();
        await modal.alert("Job post updated successfully", "Success", "success");
      } else {
        await api.jobPosts.create(formattedValues as CreateJobPostRequest);
        setSubmitting(false); // Stop loading state
        resetForm();
        setShowModal(false); // Close modal immediately
        setEditingJobPost(null);
        await fetchJobPosts();
        await fetchPlaceTags();
        await modal.alert("Job post created successfully", "Success", "success");
      }
    } catch (err: any) {
      setSubmitting(false); // Stop loading state on error
      await modal.alert(
        getErrorMessage(err) || "Failed to save job post",
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
          Job Post Management
        </h1>
        <button onClick={handleCreate} className="btn-primary cursor-pointer">
          + Add Job Post
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6" style={{ color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {/* Job Posts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Title
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Location
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                style={{ color: "#374151" }}
              >
                Close Date
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
            {paginatedData.map((jobPost) => (
              <tr key={jobPost.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div
                    className="text-sm font-medium"
                    style={{ color: "#000000" }}
                  >
                    {jobPost.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                    {jobPost.placeTag?.name || "N/A"}
                  </span>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm"
                  style={{ color: "#6b7280" }}
                >
                  {jobPost.jobDetails.closeDate
                    ? formatDateTime(jobPost.jobDetails.closeDate)
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(jobPost)}
                    className="font-semibold hover:underline mr-4 cursor-pointer"
                    style={{ color: "#2C5BBB", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(jobPost.id)}
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
            <p style={{ color: "#6b7280" }}>No job posts found</p>
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

      {/* Job Post Form Modal */}
      <FormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingJobPost(null);
        }}
        title={editingJobPost ? "Edit Job Post" : "Add New Job Post"}
        maxWidth="2xl"
      >
        <Formik
          initialValues={{
            title: editingJobPost?.title || "",
            placeTagId: editingJobPost?.placeTagId || "",
            tasks: editingJobPost?.tasks || {
              title: "Key Responsibilities",
              descriptions: [""],
            },
            requiredQualifications: editingJobPost?.requiredQualifications || {
              title: "Requirements",
              descriptions: [""],
            },
            jobDetails: editingJobPost?.jobDetails
              ? {
                  ...editingJobPost.jobDetails,
                  closeDate: editingJobPost.jobDetails.closeDate
                    ? isoToLocalDateTime(editingJobPost.jobDetails.closeDate)
                    : "",
                }
              : {
                  workingHours: "",
                  contract: true,
                  salary: "",
                  closeDate: "",
                },
          }}
          validationSchema={jobPostSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form className="space-y-6">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Job Title *
                </label>
                <Field
                  name="title"
                  type="text"
                  className="input-field"
                  placeholder="e.g., Senior Backend Developer"
                />
                {errors.title && touched.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#374151" }}
                >
                  Location (Place Tag) *
                </label>
                <Field as="select" name="placeTagId" className="input-field">
                  <option value="">Select a location</option>
                  {placeTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </Field>
                {errors.placeTagId && touched.placeTagId && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.placeTagId}
                  </p>
                )}
                {placeTags.length === 0 && (
                  <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
                    No active place tags available. Create a place tag first.
                  </p>
                )}
              </div>

              {/* Tasks Section */}
              <div className="border-t pt-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#374151" }}
                >
                  Tasks / Key Responsibilities *
                </label>
                <Field
                  name="tasks.title"
                  type="text"
                  className="input-field mb-3"
                  placeholder="Section title (e.g., Key Responsibilities)"
                />
                {errors.tasks && (errors.tasks as any).title && (
                  <p className="text-red-600 text-sm mt-1">
                    {(errors.tasks as any).title}
                  </p>
                )}

                <FieldArray name="tasks.descriptions">
                  {({ push, remove, form }) => (
                    <div className="space-y-2">
                      {form.values.tasks.descriptions.map((_: any, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Field
                            name={`tasks.descriptions.${index}`}
                            type="text"
                            className="input-field flex-1"
                            placeholder={`Task description ${index + 1}`}
                          />
                          {form.values.tasks.descriptions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              style={{ color: "#dc2626" }}
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
                        + Add Task
                      </button>
                    </div>
                  )}
                </FieldArray>
                {errors.tasks && (errors.tasks as any).descriptions && (
                  <p className="text-red-600 text-sm mt-1">
                    {(errors.tasks as any).descriptions}
                  </p>
                )}
              </div>

              {/* Required Qualifications Section */}
              <div className="border-t pt-4">
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#374151" }}
                >
                  Required Qualifications *
                </label>
                <Field
                  name="requiredQualifications.title"
                  type="text"
                  className="input-field mb-3"
                  placeholder="Section title (e.g., Requirements)"
                />
                {errors.requiredQualifications &&
                  (errors.requiredQualifications as any).title && (
                    <p className="text-red-600 text-sm mt-1">
                      {(errors.requiredQualifications as any).title}
                    </p>
                  )}

                <FieldArray name="requiredQualifications.descriptions">
                  {({ push, remove, form }) => (
                    <div className="space-y-2">
                      {form.values.requiredQualifications.descriptions.map(
                        (_: any, index: number) => (
                          <div key={index} className="flex gap-2">
                            <Field
                              name={`requiredQualifications.descriptions.${index}`}
                              type="text"
                              className="input-field flex-1"
                              placeholder={`Qualification ${index + 1}`}
                            />
                            {form.values.requiredQualifications.descriptions.length >
                              1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                style={{ color: "#dc2626" }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => push("")}
                        className="text-sm hover:underline"
                        style={{ color: "#2563eb" }}
                      >
                        + Add Qualification
                      </button>
                    </div>
                  )}
                </FieldArray>
                {errors.requiredQualifications &&
                  (errors.requiredQualifications as any).descriptions && (
                    <p className="text-red-600 text-sm mt-1">
                      {(errors.requiredQualifications as any).descriptions}
                    </p>
                  )}
              </div>

              {/* Job Details Section */}
              <div className="border-t pt-4 space-y-4">
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: "#000000" }}
                >
                  Job Details *
                </h3>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Working Hours *
                  </label>
                  <Field
                    name="jobDetails.workingHours"
                    type="text"
                    className="input-field"
                    placeholder="e.g., 9:00 AM - 6:00 PM (Monday to Friday)"
                  />
                  {errors.jobDetails &&
                    (errors.jobDetails as any).workingHours && (
                      <p className="text-red-600 text-sm mt-1">
                        {(errors.jobDetails as any).workingHours}
                      </p>
                    )}
                </div>

                <div>
                  <label className="flex items-center">
                    <Field
                      type="checkbox"
                      name="jobDetails.contract"
                      className="mr-2"
                    />
                    <span className="text-sm" style={{ color: "#374151" }}>
                      Contract Position
                    </span>
                  </label>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Salary Information *
                  </label>
                  <Field
                    name="jobDetails.salary"
                    type="text"
                    className="input-field"
                    placeholder="e.g., Competitive salary based on experience (2,000,000 - 3,500,000 MMK)"
                  />
                  {errors.jobDetails && (errors.jobDetails as any).salary && (
                    <p className="text-red-600 text-sm mt-1">
                      {(errors.jobDetails as any).salary}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#374151" }}
                  >
                    Application Close Date *
                  </label>
                  <Field
                    name="jobDetails.closeDate"
                    type="datetime-local"
                    className="input-field"
                  />
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                    The date and time when applications will close
                  </p>
                  {errors.jobDetails && (errors.jobDetails as any).closeDate && (
                    <p className="text-red-600 text-sm mt-1">
                      {(errors.jobDetails as any).closeDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 cursor-pointer"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingJobPost
                    ? "Update"
                    : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingJobPost(null);
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

