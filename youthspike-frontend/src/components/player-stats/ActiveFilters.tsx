"use client";
import React from "react";
import { IFilter, EStatsFilter, INetRelatives, IPlayer, ITeam } from "@/types";
import Image from "next/image";

interface IActiveFiltersProps {
  filter: Partial<Record<EStatsFilter, string | string[]>>;
  netMap: Map<string, INetRelatives>;
  playerMap: Map<string, IPlayer>;
  clubMap: Map<string, ITeam>; // optional clubMap for future use
  onClearAll?: () => void;
}

const filterLabels: Record<EStatsFilter, string> = {
  m: "Matches",
  g: "Games",
  tm: "Teammates",
  cb: "VS Clubs",
  vp: "VS Players",
  ce: "Conference",
  sd: "Start Date",
  ed: "End Date",
};

export default function ActiveFilters({
  filter,
  netMap,
  playerMap,
  clubMap,
  onClearAll,
}: IActiveFiltersProps) {
  const entries = Object.entries(filter).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== "";
  });

  if (entries.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      {/* Active filters list */}
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, value]) => {
          const label = filterLabels[key as EStatsFilter] || key;

          // ---- Resolve display values ----
          let displayValue = "";

          if (Array.isArray(value)) {
            // VS Players (vp)
            if (key === EStatsFilter.VS_PLAYER) {
              displayValue = value
                .map((id) => {
                  const player = playerMap.get(id);
                  return player
                    ? `${player.firstName || ""} ${player.lastName || ""}`.trim()
                    : id;
                })
                .join(", ");
            }
            // Teammates (tm)
            else if (key === EStatsFilter.TEAMMATE) {
              displayValue = value
                .map((id) => {
                  const player = playerMap.get(id);
                  return player
                    ? `${player.firstName || ""} ${player.lastName || ""}`.trim()
                    : id;
                })
                .join(", ");
            }
            // VS Clubs (cb)
            else if (key === EStatsFilter.CLUB && clubMap) {
              displayValue = value
                .map((id) => {
                  const club = clubMap.get(id);
                  return club ? club.name : id;
                })
                .join(", ");
            }
            // Other array filters (matches, games, etc.)
            else {
              displayValue = value.join(", ");
            }
          } else {
            displayValue = value;
          }

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

      {/* Clear All button */}
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold ml-auto"
        >
          <Image
            width={20}
            height={20}
            alt="close"
            src="/icons/close.svg"
            className="w-4 h-4"
          />
          Clear All
        </button>
      )}
    </div>
  );
}
