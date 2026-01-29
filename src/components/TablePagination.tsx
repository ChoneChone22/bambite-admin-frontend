/**
 * Reusable Table Pagination Component
 * Handles rows per page selection and page navigation
 * Theme-aware for light/dark mode
 */

"use client";

import { useState } from "react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  minRowsPerPage?: number;
  maxRowsPerPage?: number;
}

export default function TablePagination({
  currentPage,
  totalPages,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  minRowsPerPage = 10,
  maxRowsPerPage = 50,
}: TablePaginationProps) {
  // Calculate page range to display (show up to 5 page numbers)
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      const end = Math.min(totalPages, start + maxVisible - 1);

      // Adjust start if we're near the end
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startRow = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endRow = Math.min(currentPage * rowsPerPage, totalRows);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const [prevHover, setPrevHover] = useState(false);
  const [nextHover, setNextHover] = useState(false);
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);

  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      style={{
        backgroundColor: "hsl(var(--card))",
        borderTop: "1px solid hsl(var(--border))",
      }}
    >
      {/* Rows per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: "hsl(var(--foreground))" }}>
          Rows per page:
        </span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent cursor-pointer"
          style={{
            minWidth: "70px",
            backgroundColor: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--input))",
          }}
          aria-label="Rows per page"
        >
          {[10, 15, 20, 25, 30, 40, 50]
            .filter((num) => num >= minRowsPerPage && num <= maxRowsPerPage)
            .map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
        </select>
        <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          {totalRows === 0
            ? "No rows"
            : `Showing ${startRow}-${endRow} of ${totalRows}`}
        </span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          onMouseEnter={() => canGoPrevious && setPrevHover(true)}
          onMouseLeave={() => setPrevHover(false)}
          className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:pointer-events-none"
          style={
            canGoPrevious
              ? {
                  backgroundColor: prevHover ? "hsl(var(--accent))" : "hsl(var(--background))",
                  color: prevHover ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                  cursor: "pointer",
                }
              : {
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))",
                  border: "1px solid hsl(var(--border))",
                  cursor: "not-allowed",
                  opacity: 0.5,
                }
          }
          aria-label="Previous page"
        >
          &lt;
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => {
            const isActive = pageNum === currentPage;
            const isHovered = !isActive && hoveredPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                onMouseEnter={() => setHoveredPage(pageNum)}
                onMouseLeave={() => setHoveredPage(null)}
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer"
                style={
                  isActive
                    ? {
                        backgroundColor: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                        border: "1px solid transparent",
                        opacity: hoveredPage === pageNum ? 0.9 : 1,
                      }
                    : {
                        backgroundColor: isHovered ? "hsl(var(--accent))" : "hsl(var(--background))",
                        color: isHovered ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                        border: "1px solid hsl(var(--border))",
                      }
                }
                aria-label={`Go to page ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          onMouseEnter={() => canGoNext && setNextHover(true)}
          onMouseLeave={() => setNextHover(false)}
          className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:pointer-events-none"
          style={
            canGoNext
              ? {
                  backgroundColor: nextHover ? "hsl(var(--accent))" : "hsl(var(--background))",
                  color: nextHover ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                  cursor: "pointer",
                }
              : {
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--muted-foreground))",
                  border: "1px solid hsl(var(--border))",
                  cursor: "not-allowed",
                  opacity: 0.5,
                }
          }
          aria-label="Next page"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}
