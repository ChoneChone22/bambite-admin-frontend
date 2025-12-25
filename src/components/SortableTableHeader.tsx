/**
 * Sortable Table Header Component
 * Reusable component for sortable column headers with visual indicators
 */

import { SortDirection } from "@/src/hooks/useTableSort";

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  align?: "left" | "right" | "center";
  className?: string;
}

export default function SortableTableHeader({
  label,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
  align = "left",
  className = "",
}: SortableTableHeaderProps) {
  const isActive = currentSortKey === sortKey;
  const alignmentClass =
    align === "right"
      ? "text-right"
      : align === "center"
      ? "text-center"
      : "text-left";

  return (
    <th
      className={`px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider ${alignmentClass} ${className} cursor-pointer select-none hover:bg-gray-100 transition-colors`}
      onClick={() => onSort(sortKey)}
      role="columnheader"
      aria-sort={
        isActive
          ? sortDirection === "asc"
            ? "ascending"
            : sortDirection === "desc"
            ? "descending"
            : "none"
          : "none"
      }
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(sortKey);
        }
      }}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <span className="flex flex-col">
          {isActive && sortDirection === "asc" && (
            <span
              className="text-[--primary]"
              style={{ color: "#2C5BBB" }}
              aria-label="sorted ascending"
            >
              ↑
            </span>
          )}
          {isActive && sortDirection === "desc" && (
            <span
              className="text-[--primary]"
              style={{ color: "#2C5BBB" }}
              aria-label="sorted descending"
            >
              ↓
            </span>
          )}
          {!isActive && (
            <span className="text-gray-400 opacity-50" aria-hidden="true">
              ↕
            </span>
          )}
        </span>
      </div>
    </th>
  );
}

