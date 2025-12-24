/**
 * Custom hook for table sorting functionality
 * Handles ascending/descending sorting with proper type handling
 */

import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

export type SortableValue = string | number | Date | null | undefined;

/**
 * Custom hook for table sorting
 * @param data - Array of data to sort
 * @param initialSort - Initial sort configuration (optional)
 * @returns Sorted data and sort control functions
 */
export function useTableSort<T extends Record<string, any>>(
  data: T[],
  initialSort?: SortConfig<T>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(
    initialSort || { key: null, direction: null }
  );

  /**
   * Compare two values for sorting
   */
  const compareValues = (
    a: SortableValue,
    b: SortableValue,
    direction: "asc" | "desc"
  ): number => {
    // Handle null/undefined values - always sort to end
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    // Handle dates
    if (a instanceof Date && b instanceof Date) {
      return direction === "asc"
        ? a.getTime() - b.getTime()
        : b.getTime() - a.getTime();
    }

    // Handle numbers
    if (typeof a === "number" && typeof b === "number") {
      return direction === "asc" ? a - b : b - a;
    }

    // Handle strings (case-insensitive)
    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();

    if (aStr < bStr) return direction === "asc" ? -1 : 1;
    if (aStr > bStr) return direction === "asc" ? 1 : -1;
    return 0;
  };

  /**
   * Get nested value from object using dot notation (e.g., "department.name")
   */
  const getNestedValue = (obj: T, path: string): SortableValue => {
    const keys = path.split(".");
    let value: any = obj;
    for (const key of keys) {
      value = value?.[key];
      if (value == null) break;
    }
    return value;
  };

  /**
   * Sort the data based on current sort configuration
   */
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return [...data];
    }

    const sorted = [...data].sort((a, b) => {
      // Handle nested keys (e.g., "department.name")
      const keyStr = String(sortConfig.key);
      let aValue: SortableValue;
      let bValue: SortableValue;

      if (keyStr.includes(".")) {
        aValue = getNestedValue(a, keyStr);
        bValue = getNestedValue(b, keyStr);
      } else {
        aValue = a[sortConfig.key!];
        bValue = b[sortConfig.key!];
      }

      return compareValues(aValue, bValue, sortConfig.direction!);
    });

    return sorted;
  }, [data, sortConfig]);

  /**
   * Handle column header click to toggle sort
   */
  const handleSort = (key: keyof T) => {
    setSortConfig((current) => {
      // If clicking the same column, cycle: null -> asc -> desc -> null
      if (current.key === key) {
        if (current.direction === null) return { key, direction: "asc" };
        if (current.direction === "asc") return { key, direction: "desc" };
        return { key: null, direction: null };
      }
      // If clicking different column, start with asc
      return { key, direction: "asc" };
    });
  };

  /**
   * Get current sort direction for a specific column
   */
  const getSortDirection = (key: keyof T): SortDirection => {
    if (sortConfig.key === key) {
      return sortConfig.direction;
    }
    return null;
  };

  /**
   * Clear sorting
   */
  const clearSort = () => {
    setSortConfig({ key: null, direction: null });
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortDirection,
    clearSort,
  };
}

