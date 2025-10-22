// components/player/StatsFilter.tsx
import Image from "next/image";
import React from "react";
import DateInput from "../elements/DateInput";
import SelectInput from "../elements/SelectInput";
import MultiSelectInput from "../elements/MultiSelectInput";
import {
  IFilter,
  IOption,
  IStatsFilterProps,
} from "@/types";
import useStatsFilterData from "@/hooks/player-stats/useStatsFilterData";

/** Conference options (unchanged) */
const CONFERENCE_OPTIONS: IOption[] = [
  { id: 1, value: "overall", text: "Overall" },
  { id: 2, value: "conference", text: "Conference" },
  { id: 3, value: "non-conference", text: "Non-Conference" },
];



export default function StatsFilter({
  player,
  players,
  filter,
  handleInputChange,
  matches,
  rounds,
  nets,
  teams,
}:IStatsFilterProps) {
  const {
    matchOptions,
    vsClubOptions,
    teammateOptions,
    vsPlayerOptions,
    gameOptions,
  } = useStatsFilterData({ player, players, filter, matches, rounds, nets, teams });

  // Wrapper function to match MultiSelectInput's expected signature
  const handleMultiSelectChange = (name: string, value: string[]) => {
    handleInputChange(name as keyof IFilter, value);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 mb-12 shadow-lg border border-gray-800">
      <h2 className="text-yellow-logo text-lg uppercase font-bold mb-4 flex items-center gap-2">
        <Image
          src="/icons/filter.svg"
          width={20}
          height={20}
          className="w-8"
          alt="filter-icon svg-yellow"
        />
        Filter Stats
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Date Range */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <DateInput
            name="startDate"
            label="Start Date"
            defaultValue={filter.startDate ? new Date(filter.startDate) : undefined}
            handleInputChange={(e) =>
              handleInputChange("startDate" as keyof IFilter, (e.target as HTMLInputElement).value as any)
            }
          />
          <DateInput
            name="endDate"
            label="End Date"
            defaultValue={filter.endDate ? new Date(filter.endDate) : undefined}
            handleInputChange={(e) =>
              handleInputChange("endDate" as keyof IFilter, (e.target as HTMLInputElement).value as any)
            }
          />
        </div>

        {/* Conference Type */}
        <SelectInput
          name="conference"
          label="Conference Type"
          value={(filter.conference as string) || ""}
          handleSelect={(e) => handleInputChange("conference" as keyof IFilter, e.target.value as any)}
          optionList={CONFERENCE_OPTIONS}
        />

        {/* Match Selector */}
        <MultiSelectInput
          name="match"
          label="Match"
          value={(filter.match as string[]) || []}
          onChange={handleMultiSelectChange}
          optionList={matchOptions}
        />

        {/* Teammate */}
        <MultiSelectInput
          name="teammate"
          label="Teammate"
          value={(filter.teammate as string[]) || []}
          onChange={handleMultiSelectChange}
          optionList={teammateOptions}
        />

        {/* Game Selector (shown only when matches selected) */}
        {filter.match && filter.match.length > 0 && (
          <MultiSelectInput
            name="game"
            label="Game"
            value={(filter.game as string[]) || []}
            onChange={handleMultiSelectChange}
            optionList={gameOptions}
          />
        )}

        {/* VS Club */}
        <MultiSelectInput
          name="club"
          label="VS Club"
          value={(filter.club as string[]) || []}
          onChange={handleMultiSelectChange}
          optionList={vsClubOptions}
        />

        {/* VS Player */}
        <MultiSelectInput
          name="vsPlayer"
          label="VS Player"
          value={(filter.vsPlayer as string[]) || []}
          onChange={handleMultiSelectChange}
          optionList={vsPlayerOptions}
        />
      </div>
    </div>
  );
}
