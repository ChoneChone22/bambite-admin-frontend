/**
 * Sortable Table Header Component
 * Reusable header with sort indicators
 * Theme-aware for light/dark mode
 */

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  sortDirection: "asc" | "desc" | null;
  onSort: (key: string) => void;
}

export default function SortableTableHeader({
  label,
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
}: SortableTableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-accent transition-colors text-muted-foreground group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        <span className="group-hover:text-foreground">{label}</span>
        <span className="flex flex-col">
          {/* Up arrow */}
          <svg
            className={`w-3 h-3 -mb-1 transition-colors ${
              isActive && sortDirection === "asc"
                ? "text-primary"
                : "text-muted-foreground/40 group-hover:text-muted-foreground"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
          </svg>
          {/* Down arrow */}
          <svg
            className={`w-3 h-3 transition-colors ${
              isActive && sortDirection === "desc"
                ? "text-primary"
                : "text-muted-foreground/40 group-hover:text-muted-foreground"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
          </svg>
        </span>
      </div>
    </th>
  );
}
