import React, { useMemo } from 'react';
import Image from 'next/image';

interface IPaginationProps {
  currentPage: number;
  ITEMS_PER_PAGE: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemList: Record<string, any>[];
}

function Pagination({ currentPage, setCurrentPage, itemList, ITEMS_PER_PAGE }: IPaginationProps) {
  const totalPages = useMemo(() => Math.ceil(itemList.length / ITEMS_PER_PAGE), [itemList.length, ITEMS_PER_PAGE]);

  const handlePrev = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  if (totalPages < 1) return null;

  // Generate page numbers (smart truncation for tablet)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-6 p-4 rounded-lg">
      {/* Prev Button */}
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="flex items-center px-4 py-2 sm:px-5 sm:py-3 rounded-full bg-yellow-400 text-black font-semibold transition-all duration-300 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image alt="Left-arrow" height={20} width={20} className="mr-2 transform rotate-180" src="/icons/right-arrow.svg" />
        Prev
      </button>

      {/* Mobile: only show "Page X of Y" */}
      <span className="sm:hidden text-base font-bold text-yellow-400 px-4 py-2 rounded-full border border-yellow-400">
        {currentPage}/{totalPages}
      </span>

      {/* Tablet & Desktop: show page numbers */}
      <div className="hidden sm:flex items-center gap-2">
        {getPageNumbers().map((p, idx) =>
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => handlePageClick(p)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                currentPage === p ? 'bg-yellow-400 text-black border border-yellow-500' : 'bg-transparent text-yellow-400 border border-yellow-400 hover:bg-yellow-500 hover:text-black'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-2 text-yellow-400 font-bold">
              {p}
            </span>
          ),
        )}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center px-4 py-2 sm:px-5 sm:py-3 rounded-full bg-yellow-400 text-black font-semibold transition-all duration-300 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
        <Image alt="Right-arrow" height={20} width={20} className="ml-2" src="/icons/right-arrow.svg" />
      </button>
    </div>
  );
}

export default Pagination;
