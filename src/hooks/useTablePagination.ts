/**
 * Custom hook for table pagination
 * Production-ready implementation using useReducer for predictable state management
 */

import { useReducer, useMemo, useCallback, useEffect } from "react";

export interface PaginationConfig {
  page: number;
  rowsPerPage: number;
}

export interface UseTablePaginationOptions {
  initialPage?: number;
  initialRowsPerPage?: number;
  minRowsPerPage?: number;
  maxRowsPerPage?: number;
}

// State interface
interface PaginationState {
  page: number;
  rowsPerPage: number;
}

// Action types
type PaginationAction =
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_ROWS_PER_PAGE"; payload: number; totalRows: number }
  | { type: "RESET_TO_FIRST_PAGE" }
  | {
      type: "ADJUST_PAGE_FOR_DATA_CHANGE";
      totalRows: number;
      minRowsPerPage: number;
      maxRowsPerPage: number;
    };

// Reducer function
function paginationReducer(
  state: PaginationState,
  action: PaginationAction
): PaginationState {
  switch (action.type) {
    case "SET_PAGE": {
      return {
        ...state,
        page: action.payload,
      };
    }

    case "SET_ROWS_PER_PAGE": {
      const newRowsPerPage = action.payload;
      const newTotalPages = Math.max(
        1,
        Math.ceil(action.totalRows / newRowsPerPage)
      );

      // Adjust page if current page exceeds new total pages
      const adjustedPage = Math.min(state.page, newTotalPages);

      return {
        page: Math.max(1, adjustedPage),
        rowsPerPage: newRowsPerPage,
      };
    }

    case "RESET_TO_FIRST_PAGE": {
      return {
        ...state,
        page: 1,
      };
    }

    case "ADJUST_PAGE_FOR_DATA_CHANGE": {
      const { totalRows, minRowsPerPage, maxRowsPerPage } = action;
      const clampedRowsPerPage = Math.max(
        minRowsPerPage,
        Math.min(state.rowsPerPage, maxRowsPerPage)
      );
      const totalPages = Math.max(1, Math.ceil(totalRows / clampedRowsPerPage));
      const adjustedPage = Math.min(state.page, totalPages);

      return {
        page: Math.max(1, adjustedPage),
        rowsPerPage: clampedRowsPerPage,
      };
    }

    default:
      return state;
  }
}

export function useTablePagination<T>(
  data: T[],
  options: UseTablePaginationOptions = {}
) {
  const {
    initialPage = 1,
    initialRowsPerPage = 10,
    minRowsPerPage = 10,
    maxRowsPerPage = 50,
  } = options;

  // Initialize state with reducer
  const [state, dispatch] = useReducer(paginationReducer, {
    page: initialPage,
    rowsPerPage: Math.max(
      minRowsPerPage,
      Math.min(initialRowsPerPage, maxRowsPerPage)
    ),
  });

  // Calculate derived values
  const totalRows = data.length;
  const totalPages = useMemo(() => {
    if (totalRows === 0) return 1;
    return Math.max(1, Math.ceil(totalRows / state.rowsPerPage));
  }, [totalRows, state.rowsPerPage]);

  // Ensure page is valid (clamp to valid range)
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.max(1, Math.min(state.page, totalPages));
  }, [state.page, totalPages]);

  // Adjust state when data changes (e.g., filtering, sorting)
  // Only adjust if current page would be invalid with new data
  useEffect(() => {
    if (totalRows > 0) {
      const currentTotalPages = Math.max(
        1,
        Math.ceil(totalRows / state.rowsPerPage)
      );
      // Only dispatch if page would be out of bounds
      if (state.page > currentTotalPages) {
        dispatch({
          type: "ADJUST_PAGE_FOR_DATA_CHANGE",
          totalRows,
          minRowsPerPage,
          maxRowsPerPage,
        });
      }
    }
  }, [
    totalRows,
    state.rowsPerPage,
    state.page,
    minRowsPerPage,
    maxRowsPerPage,
  ]);

  // Get paginated data
  const paginatedData = useMemo(() => {
    if (totalRows === 0) return [];
    const startIndex = (validPage - 1) * state.rowsPerPage;
    const endIndex = startIndex + state.rowsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, validPage, state.rowsPerPage, totalRows]);

  // Handlers - dispatch actions instead of directly setting state
  const handlePageChange = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages));
      dispatch({ type: "SET_PAGE", payload: clampedPage });
    },
    [totalPages]
  );

  const handleRowsPerPageChange = useCallback(
    (newRowsPerPage: number) => {
      const clampedRows = Math.max(
        minRowsPerPage,
        Math.min(newRowsPerPage, maxRowsPerPage)
      );
      dispatch({
        type: "SET_ROWS_PER_PAGE",
        payload: clampedRows,
        totalRows,
      });
    },
    [totalRows, minRowsPerPage, maxRowsPerPage]
  );

  const resetToFirstPage = useCallback(() => {
    dispatch({ type: "RESET_TO_FIRST_PAGE" });
  }, []);

  return {
    paginatedData,
    currentPage: validPage,
    totalPages,
    rowsPerPage: state.rowsPerPage,
    totalRows,
    handlePageChange,
    handleRowsPerPageChange,
    resetToFirstPage,
  };
}
