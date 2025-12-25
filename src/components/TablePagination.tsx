/**
 * Reusable Table Pagination Component
 * Handles rows per page selection and page navigation
 */

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
      let end = Math.min(totalPages, start + maxVisible - 1);
      
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

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      {/* Rows per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[--primary] focus:border-transparent"
          style={{ 
            minWidth: '70px',
            cursor: 'pointer'
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
        <span className="text-sm text-gray-500">
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
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            canGoPrevious
              ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer"
              : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
          }`}
          aria-label="Previous page"
        >
          &lt;
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum) => {
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "text-white cursor-pointer"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
                style={
                  isActive
                    ? { backgroundColor: "#2C5BBB" }
                    : {}
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
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            canGoNext
              ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer"
              : "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
          }`}
          aria-label="Next page"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

