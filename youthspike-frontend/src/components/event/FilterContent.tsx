import { EGroupRule, EGroupType, EMessage, IFilterState, IGroup, ISearchFilter } from "@/types";
import React, { useEffect, useMemo, useRef } from "react";
import SelectInput from "../elements/SelectInput";
import InputField from "../elements/InputField";
import { divisionsToOptionList } from "@/utils/helper";
import { useAppDispatch } from "@/redux/hooks";
import { setMessage } from "@/redux/slices/elementSlice";


interface IFilterContentProps {
  divisions: string;
  groups: IGroup[];
  loading: boolean;
  filter: Partial<ISearchFilter>;
  updateFilter: (key: string, value: string) => void;
  onApplyFilters: (filter: IFilterState) => void;
  showStatus?: boolean;
  // onClearFilters: () => void;
  // hasUnsavedChanges: boolean;
  // hasActiveFilters: boolean;
}

function FilterContent({
  divisions,
  groups,
  loading,
  filter,
  updateFilter,
  onApplyFilters,
  // onClearFilters,
  // hasUnsavedChanges,
  // hasActiveFilters,
  showStatus,
}: IFilterContentProps) {
  const dispatch = useAppDispatch();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const divisionList = useMemo(() => {
    if (!divisions) return [];
    return divisionsToOptionList(divisions);
  }, [divisions]);


  const filteredGroups = useMemo(() => {
    const newGroups = filter.division
      ? groups.filter(
        (g) =>
          g.division.trim().toLowerCase() ===
          filter.division!.trim().toLowerCase()
          && g.active
      )
      : groups.filter(g => g.active);

    const groupOptions = newGroups.map((g, i) => ({
      id: i + 1,
      value: g._id,
      label: g.name,
      text: g.name,
    }));

    return [...groupOptions];
  }, [groups, filter.division]);

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!loading ) {
      onApplyFilters({ group: filter?.group || '', search: filter?.search || '', status: filter?.status || '', division: e.target.value });
      updateFilter("division", e.target.value);
    } else {
      dispatch(setMessage({ message: 'A request is already in progress. Please wait a moment and try again.', name: 'Error', type: EMessage.ERROR }));
    }
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!loading ) {
      onApplyFilters({ division: filter?.division || '', search: filter?.search || '', status: filter?.status || '', group: e.target.value });
      updateFilter("group", e.target.value);
    } else {
      dispatch(setMessage({ message: 'A request is already in progress. Please wait a moment and try again.', name: 'Error', type: EMessage.ERROR }));
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!loading ) {
      onApplyFilters({ group: filter?.group || '', division: filter?.division || '', search: filter?.search || '', status: e.target.value });
      updateFilter("status", e.target.value);
    } else {
      dispatch(setMessage({ message: 'A request is already in progress. Please wait a moment and try again.', name: 'Error', type: EMessage.ERROR }));
    }
  };

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const searchValue = e.target.value;

    // Update the filter immediately so the input stays responsive.
    updateFilter("search", searchValue);

    // Cancel the previous debounce timer.
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Wait 500ms after the user stops typing before applying the filter.
    searchDebounceRef.current = setTimeout(() => {
      // Check loading
      if (!loading) {
        onApplyFilters({
          group: filter?.group || "",
          division: filter?.division || "",
          status: filter?.status || "",
          search: searchValue,
        });
      } else {
        dispatch(
          setMessage({
            message: "A request is already in progress. Please wait a moment and try again.",
            name: "Error",
            type: EMessage.ERROR,
          })
        );
      }
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);



  return (
    <form
      className="w-full animate-slide-down mb-3"
      onSubmit={(e) => {
        e.preventDefault();
        // if (!loading ) {
        //   onApplyFilters();
        // }
      }}
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Division */}
        <SelectInput
          handleSelect={handleDivisionChange}
          name="division"
          optionList={divisionList}
          label="Division"
          value={filter.division}
        />

        {/* Group */}
        <SelectInput
          handleSelect={handleGroupChange}
          name="group"
          optionList={filteredGroups}
          label="Group"
          value={filter.group}
        />
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <InputField
          name="search"
          type="text"
          defaultValue={filter.search || ""}
          handleInputChange={handleSearchChange}
        />
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
      {/*       
      <div className="flex gap-2">
        <button
          // onClick={onApplyFilters}
          // disabled={loading || !hasUnsavedChanges}
          disabled={loading}
          className="btn-info"
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
      */}

      {/* Unsaved changes indicator */}
      {/* {hasUnsavedChanges && !loading && (
        <div className="mt-2 text-sm text-yellow-400 text-center">
          You have unsaved filter changes
        </div>
      )} */}
    </form>
  );
}

export default FilterContent;
