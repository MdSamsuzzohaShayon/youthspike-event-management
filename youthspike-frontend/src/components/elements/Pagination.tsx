import React, { useMemo } from "react";
import Image from "next/image";

interface IPaginationProps {
  currentPage: number;
  ITEMS_PER_PAGE: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  itemList: Record<string, any>[];
}

function Pagination({
  currentPage,
  setCurrentPage,
  itemList,
  ITEMS_PER_PAGE,
}: IPaginationProps) {
  const totalPages = useMemo(
    () => Math.ceil(itemList.length / ITEMS_PER_PAGE),
    [itemList.length, ITEMS_PER_PAGE]
  );

  const handlePrev = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (totalPages < 1) return null;

  return (
    <div className="flex items-center justify-center space-x-6">
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="flex items-center px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold transition-all duration-300 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Image
          alt="Left-arrow"
          height={20}
          width={20}
          className="mr-2 svg-white transform rotate-180"
          src="/icons/right-arrow.svg"
        />{" "}
        Prev
      </button>

      <span className="text-lg font-bold text-yellow-400 bg-black px-8 py-3 rounded-full border border-yellow-400">
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold transition-all duration-300 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next{" "}
        <Image
          alt="Right-arrow"
          height={20}
          width={20}
          className="ml-2 svg-white"
          src="/icons/right-arrow.svg"
        />
      </button>
    </div>
  );
}

export default Pagination;
