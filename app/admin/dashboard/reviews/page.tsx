/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Admin Review Moderation Page
 * Moderate product reviews (approve/reject)
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/src/services/api";
import { Review, ReviewStatus, ReviewSortBy } from "@/src/types/api";
import { getErrorMessage } from "@/src/lib/utils";
import { useTablePagination, useModal } from "@/src/hooks";
import TablePagination from "@/src/components/TablePagination";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import Toast from "@/src/components/Toast";

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<ReviewSortBy>("newest" as ReviewSortBy);
  const modal = useModal();

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.reviews.getAll({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        sortBy,
        page: 1,
        limit: 1000, // Fetch all for client-side pagination
      });
      setReviews(response || []);
    } catch (err) {
      setError("Failed to fetch reviews");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, sortBy]);

  const handleApprove = async (id: string) => {
    try {
      await api.reviews.updateStatus(id, { status: ReviewStatus.APPROVED });
      setSuccessMessage("Review approved successfully");
      fetchReviews();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to approve review");
    }
  };

  const handleReject = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to reject this review?",
      "Reject Review"
    );
    if (!confirmed) return;

    try {
      await api.reviews.updateStatus(id, { status: ReviewStatus.REJECTED });
      setSuccessMessage("Review rejected successfully");
      fetchReviews();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to reject review");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm(
      "Are you sure you want to delete this review? This action cannot be undone.",
      "Delete Review"
    );
    if (!confirmed) return;

    try {
      await api.reviews.delete(id);
      setSuccessMessage("Review deleted successfully");
      fetchReviews();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to delete review");
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews;
  }, [reviews]);

  const {
    paginatedData,
    currentPage,
    totalPages,
    rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
  } = useTablePagination(filteredReviews, {
    initialRowsPerPage: 10,
    minRowsPerPage: 10,
    maxRowsPerPage: 50,
  });

  const getStatusBadge = (status: ReviewStatus) => {
    const styles = {
      [ReviewStatus.PENDING]: "bg-yellow-100 text-yellow-800",
      [ReviewStatus.APPROVED]: "bg-green-100 text-green-800",
      [ReviewStatus.REJECTED]: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-600 mt-1">Moderate product reviews</p>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {successMessage && (
        <Toast message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | "ALL")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ backgroundColor: "#ffffff", color: "#111827" }}
          >
            <option value="ALL">All Reviews</option>
            <option value={ReviewStatus.PENDING}>Pending</option>
            <option value={ReviewStatus.APPROVED}>Approved</option>
            <option value={ReviewStatus.REJECTED}>Rejected</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ReviewSortBy)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ backgroundColor: "#ffffff", color: "#111827" }}
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {paginatedData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No reviews found</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reviewer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Review
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Helpful
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedData.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {review.product?.name || "Unknown Product"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {review.user?.email || review.guestName || "Guest"}
                        </div>
                        {review.guestEmail && (
                          <div className="text-xs text-gray-500">{review.guestEmail}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{renderStars(review.rating)}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-md">
                          {review.message || <span className="text-gray-400">No message</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(review.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {review.helpfulVotes} votes
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {review.status === ReviewStatus.PENDING && (
                            <>
                              <button
                                onClick={() => handleApprove(review.id)}
                                className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors cursor-pointer"
                                style={{ backgroundColor: "#d1fae5", color: "#166534" }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(review.id)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors cursor-pointer"
                                style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {review.status === ReviewStatus.APPROVED && (
                            <>
                              <button
                                onClick={() => handleReject(review.id)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors cursor-pointer"
                                style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {review.status === ReviewStatus.REJECTED && (
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors cursor-pointer"
                              style={{ backgroundColor: "#d1fae5", color: "#166534" }}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors cursor-pointer"
                            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
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
          {filteredReviews.length > 0 && (
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
        </>
      )}
    </div>
  );
}
