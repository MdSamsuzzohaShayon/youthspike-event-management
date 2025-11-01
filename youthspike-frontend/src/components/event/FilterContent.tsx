import { IGroup, ISearchFilter } from "@/types";
import React, { useMemo } from "react";
import SelectInput from "../elements/SelectInput";

interface IFilterContentProps {
  divisions: string;
  groups: IGroup[];
  loading: boolean;
  filter: Partial<ISearchFilter>;
  updateFilter: (key: string, value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  hasUnsavedChanges: boolean;
  hasActiveFilters: boolean;
  showStatus?: boolean;
}

function FilterContent({
  divisions,
  groups,
  loading,
  filter,
  updateFilter,
  onApplyFilters,
  onClearFilters,
  hasUnsavedChanges,
  hasActiveFilters,
  showStatus,
}: IFilterContentProps) {
  const ALL_OPTION = { id: 0, value: "", label: "All" };

  const divisionList = useMemo(() => {
    if (!divisions) return [ALL_OPTION];
    return [
      ALL_OPTION,
      ...divisions.split(",").map((div, i) => ({
        id: i + 1,
        value: div.trim(),
        label: div.trim().toUpperCase(),
      })),
    ];
  }, [divisions]);

  const filteredGroups = useMemo(() => {
    const newGroups = (
      filter.division
        ? groups.filter(
            (g) =>
              g.division.trim().toLowerCase() ===
              filter.division!.trim().toLowerCase()
          )
        : groups
    )
    
    
    const groupOptions = newGroups.map((g, i) => ({
      id: i + 1,
      value: g._id,
      label: g.name,
      text: g.name,
    }));
    

    return [ALL_OPTION, ...groupOptions];
  }, [groups, filter.division]);

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter("division", e.target.value);
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter("group", e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilter("status", e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter("search", e.target.value);
  };

  return (
    <div className="w-full animate-slide-down mb-3">
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Division */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="division"
            className="text-sm font-medium text-gray-300 mb-1"
          >
            Division
          </label>
          <select
            id="division"
            value={filter.division || ""}
            onChange={handleDivisionChange}
            className="p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm text-white"
            disabled={loading}
          >
            {divisionList.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Group */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="group"
            className="text-sm font-medium text-gray-300 mb-1"
          >
            Group
          </label>
          <select
            id="group"
            value={filter.group || ""}
            onChange={handleGroupChange}
            className="p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm text-white"
            disabled={loading}
          >
            {filteredGroups.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <label
          htmlFor="search"
          className="text-sm font-medium text-gray-300 mb-1 block"
        >
          Search Matches
        </label>
        <input
          id="search"
          placeholder="Search matches..."
          value={filter.search || ""}
          onChange={handleSearchChange}
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:ring-2 focus:ring-yellow-400 text-sm"
          type="text"
          disabled={loading}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Status Filter */}
      {showStatus && (
        <div className="mb-4">
          <label
            htmlFor="matchStatus"
            className="text-sm font-medium text-gray-300 mb-1 block"
          >
            Match Status
          </label>
          <select
            id="matchStatus"
            value={filter.status || ""}
            onChange={handleStatusChange}
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm text-white"
            disabled={loading}
          >
            <option value="">All Statuses</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="CURRENT">CURRENT</option>
            <option value="PAST">PAST</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="NOT_STARTED">NOT STARTED</option>
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onApplyFilters}
          disabled={loading || !hasUnsavedChanges}
          className="flex-1 bg-yellow-400 text-black font-semibold py-2 px-4 rounded-md hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
              Applying...
            </>
          ) : (
            "Apply Filters"
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && !loading && (
        <div className="mt-2 text-sm text-yellow-400 text-center">
          You have unsaved filter changes
        </div>
      )}
    </div>
  );
}

export default FilterContent;
