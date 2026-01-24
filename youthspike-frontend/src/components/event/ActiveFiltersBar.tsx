import { IGroup } from "@/types";
import React, { memo, useMemo } from "react";

/* ===============================
   Types
================================ */

interface AppliedFilter {
  division?: string;
  group?: string;
  search?: string;
}

interface ActiveFiltersProps {
  appliedFilter: AppliedFilter;
  groups: IGroup[];
  isApplyingFilters: boolean;
  onClearFilters: () => void;
}

/* ===============================
   Small UI Helpers
================================ */
const FilterTag: React.FC<{ label: string }> = memo(({ label }) => (
  <span
    className="
      px-3 py-1
      bg-gray-800
      text-yellow-logo
      text-xs
      rounded-full
      border border-gray-700
      shadow-sm
      whitespace-nowrap
    "
  >
    {label}
  </span>
));

/* ===============================
   Main Component
================================ */
const ActiveFiltersBar: React.FC<ActiveFiltersProps> = ({
  appliedFilter,
  groups,
  isApplyingFilters,
  onClearFilters
}) => {
  const selectedGroup = useMemo(() => {
    if (!appliedFilter.group) return null;
    return groups.find((group) => group._id === appliedFilter.group) ?? null;
  }, [appliedFilter.group, groups]);

  const hasActiveFilters =
    Boolean(appliedFilter.division) ||
    Boolean(appliedFilter.group) ||
    Boolean(appliedFilter.search);

  return (
    <div
      className="
        mb-4
        p-4
        bg-gray-900
        border border-gray-700
        rounded-xl
        shadow-md
      "
      aria-live="polite"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: Active Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400 font-medium">
            Active Filters:
          </span>

          {appliedFilter.division && (
            <FilterTag label={`Division: ${appliedFilter.division}`} />
          )}

          {selectedGroup && (
            <FilterTag label={`Group: ${selectedGroup.name}`} />
          )}

          {appliedFilter.search && (
            <FilterTag label={`Search: ${appliedFilter.search}`} />
          )}

          {!hasActiveFilters && (
            <span className="text-xs text-gray-500 italic">
              No active filters
            </span>
          )}
        </div>

        {/* Right: Clear Button */}
        <button
          type="button"
          onClick={onClearFilters}
          disabled={isApplyingFilters || !hasActiveFilters}
          className="btn-danger disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default memo(ActiveFiltersBar);
