"use client";
import React from "react";
import Image from "next/image";
import { IOption, EStatsFilter } from "@/types";

// ------------------------------------------------------
// Types
// ------------------------------------------------------

interface ActiveFiltersProps {
  filter: Partial<Record<EStatsFilter, string | string[]>>;
  onClearAll?: () => void;
  matchOptions: IOption[];
  vsClubOptions: IOption[];
  teammateOptions: IOption[];
  vsPlayerOptions: IOption[];
  gameOptions: IOption[];
  eventOptions: IOption[];
}

const FILTER_LABELS: Record<EStatsFilter, string> = {
  m: "Matches",
  e: "Event",
  g: "Games",
  tm: "Teammates",
  cb: "VS Clubs",
  vp: "VS Players",
  ce: "Conference",
  sd: "Start Date",
  ed: "End Date",
};

// ------------------------------------------------------
// Helper: Convert list of option IDs to display text
// ------------------------------------------------------
function resolveOptionValues(value: string[], options: IOption[]): string {
  if (!Array.isArray(value)) return "";

  const lookup = new Set(value);
  const results: string[] = [];

  for (const option of options) {
    if (lookup.has(option.value)) {
      results.push(option.text || option.value);
    }
  }

  return results.join(", ");
}

// ------------------------------------------------------
// Main Component
// ------------------------------------------------------

export default function ActiveFilters({
  filter,
  onClearAll,
  matchOptions,
  vsClubOptions,
  teammateOptions,
  vsPlayerOptions,
  gameOptions,
  eventOptions
}: ActiveFiltersProps) {
  // Filter out empty or undefined entries
  const activeFilterEntries = Object.entries(filter).filter(([_, val]) => {
    return Array.isArray(val)
      ? val.length > 0
      : val !== "" && val !== undefined;
  });

  if (activeFilterEntries.length === 0) return null;
  

  // --------------------------------------------------
  // Value Resolver
  // --------------------------------------------------
  const getDisplayValue = (
    key: string,
    rawValue: string | string[]
  ): string => {
    if(key = EStatsFilter.EVENT) return eventOptions.find(e=> e.value === rawValue)?.text || "";
    if (!Array.isArray(rawValue)) return rawValue;

    switch (key) {

      case EStatsFilter.VS_PLAYER:
        return resolveOptionValues(rawValue, vsPlayerOptions);

      case EStatsFilter.TEAMMATE:
        return resolveOptionValues(rawValue, teammateOptions);

      case EStatsFilter.GAME:
        return resolveOptionValues(rawValue, gameOptions);

      case EStatsFilter.CLUB:
        return resolveOptionValues(rawValue, vsClubOptions);

      case EStatsFilter.MATCH:
        return resolveOptionValues(rawValue, matchOptions);

      default:
        return rawValue.join(", ");
    }
  };

  // --------------------------------------------------
  // JSX Output
  // --------------------------------------------------
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      {/* Active Filters */}
      <div className="flex flex-wrap gap-2">
        {activeFilterEntries.map(([key, rawValue]) => {
          const label = FILTER_LABELS[key as EStatsFilter] ?? key;
          const displayValue = getDisplayValue(key, rawValue);


          return (
            <span
              key={key}
              className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-semibold"
            >
              {label}: {displayValue}
            </span>
          );
        })}
      </div>

      {/* Clear All Button */}
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="btn-danger flex items-center gap-1"
        >
          <Image
            width={20}
            height={20}
            alt="close"
            src="/icons/close.svg"
            className="w-4 h-4 svg-white"
          />
          Clear All
        </button>
      )}
    </div>
  );
}
