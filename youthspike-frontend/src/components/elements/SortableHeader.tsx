// components/elements/SortableHeader.tsx
import React from "react";
import Image from "next/image";
import { EPlayerStatType } from "@/types";

interface SortableHeaderProps {
  label: string;
  sortKey: EPlayerStatType;
  currentSort: { key: string; direction: 'asc' | 'desc' };
  onSort: (key: EPlayerStatType) => void;
  icon?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  onSort,
  icon = "/icons/right-arrow.svg"
}) => {
  const isActive = currentSort.key === sortKey;
  const rotation = isActive && currentSort.direction === 'desc' ? '-90deg' : '90deg';

  return (
    <th 
      className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap cursor-pointer hover:bg-yellow-400 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center justify-center">
        <Image
          width={20}
          height={20}
          className="w-5 svg-black mr-1 transition-transform"
          alt="arrow"
          src={icon}
          style={{ transform: `rotate(${rotation})` }}
        />
        <span>{label}</span>
      </div>
    </th>
  );
};

export default SortableHeader;