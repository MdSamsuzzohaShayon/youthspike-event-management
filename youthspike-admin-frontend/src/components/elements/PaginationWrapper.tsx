import React, { useState, useMemo } from "react";

/**
 * PaginationWrapper Props
 */
interface PaginationWrapperProps<T, P> {
  items: T[]; // The list of items to paginate
  itemsPerPage: number; // Number of items to display per page
  children: (paginatedItems: T[], otherProps: P) => React.ReactNode; // Render function for paginated items
  additionalProps: P; // Additional props to pass to the children
}

/**
 * PaginationWrapper Component
 * @param {PaginationWrapperProps<T, P>} props - Component props
 */
const PaginationWrapper = <T, P>({ items, itemsPerPage, children, additionalProps }: PaginationWrapperProps<T, P>) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = useMemo(() => Math.ceil(items.length / itemsPerPage), [items.length, itemsPerPage]);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Calculate the items for the current page
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [currentPage, items, itemsPerPage]);

  return (
    <div className="flex flex-col items-center">
      <div>{children(paginatedItems, additionalProps)}</div>
      <div className="flex items-center space-x-2 mt-4">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md text-white bg-blue-500 disabled:bg-gray-300"
        >
          Prev
        </button>
        <span className="font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md text-white bg-blue-500 disabled:bg-gray-300"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationWrapper;
