import React, { useMemo } from 'react';

interface IPaginationProps {
    currentPage: number;
    ITEMS_PER_PAGE: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    itemList: Record<never, any>[];
}

const Pagination: React.FC<IPaginationProps> = ({ currentPage, setCurrentPage, itemList, ITEMS_PER_PAGE }) => {

    const handlePrev = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const totalPages = useMemo(() => Math.ceil(itemList.length / ITEMS_PER_PAGE), [itemList.length, ITEMS_PER_PAGE]);

    if (totalPages < 1) return null;

    return <div className="flex items-center space-x-2 mt-4">
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
}

export default Pagination;