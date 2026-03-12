// components/player/StatsFilter.tsx
import Image from "next/image";
import React from "react";
import DateInput from "../elements/DateInput";
import SelectInput from "../elements/SelectInput";
import MultiSelectInput from "../elements/MultiSelectInput";
import { EGroupType, EStatsFilter, IFilter, IOption, IStatsFilterProps } from "@/types";
import useStatsFilterData from "@/hooks/player-stats/useStatsFilterData";

/** Conference options (unchanged) */
const CONFERENCE_OPTIONS: IOption[] = [
  { id: 1, value: EGroupType.OVERALL },
  { id: 2, value: EGroupType.CONFERENCE },
  { id: 3, value: EGroupType.NON_CONFERENCE },
];

export default function StatsFilter({
  filter,
  handleInputChange,
  matchOptions,
  vsClubOptions,
  teammateOptions,
  vsPlayerOptions,
  gameOptions,
  eventOptions
}: IStatsFilterProps) {
  

  // Wrapper function to match MultiSelectInput's expected signature
  const handleMultiSelectChange = (name: string, value: string[]) => {
    handleInputChange(name as keyof IFilter, value);
  };

  return (
    <div className="flex flex-col justify-start gap-y-4">
       <SelectInput
        name="event"
        label="Event"
        value={(filter[EStatsFilter.EVENT] as string) || ""}
        handleSelect={(e) =>
          handleInputChange(
            "event" as keyof IFilter,
            e.target.value as string
          )
        }
        optionList={eventOptions}
      />

      {/* Date Range */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        <DateInput
          name="startDate"
          label="Start Date"
          defaultValue={
            filter[EStatsFilter.START_DATE]
              ? new Date(filter[EStatsFilter.START_DATE] as string)
              : undefined
          }
          handleInputChange={(e) =>
            handleInputChange(
              "startDate" as keyof IFilter,
              (e.target as HTMLInputElement).value as string
            )
          }
        />
        <DateInput
          name="endDate"
          label="End Date"
          defaultValue={
            filter[EStatsFilter.END_DATE]
              ? new Date(filter[EStatsFilter.END_DATE] as string)
              : undefined
          }
          handleInputChange={(e) =>
            handleInputChange(
              "endDate" as keyof IFilter,
              (e.target as HTMLInputElement).value as string
            )
          }
        />
      </div>

      {/* Conference Type */}
      <SelectInput
        name="conference"
        label="Conference Type"
        value={(filter[EStatsFilter.CONFERENCE] as string) || ""}
        handleSelect={(e) =>
          handleInputChange(
            "conference" as keyof IFilter,
            e.target.value as string
          )
        }
        optionList={CONFERENCE_OPTIONS}
      />

      {/* Match Selector */}
      <MultiSelectInput
        name="match"
        label="Match"
        value={(filter[EStatsFilter.MATCH] as string[]) || []}
        onChange={handleMultiSelectChange}
        optionList={matchOptions}
      />

      {/* Teammate */}
      <MultiSelectInput
        name="teammate"
        label="Teammate"
        value={(filter[EStatsFilter.TEAMMATE] as string[]) || []}
        onChange={handleMultiSelectChange}
        optionList={teammateOptions}
      />

      {/* Game Selector (shown only when matches selected) */}
      {filter[EStatsFilter.MATCH] && filter[EStatsFilter.MATCH].length > 0 && (
        <MultiSelectInput
          name="game"
          label="Game"
          value={(filter[EStatsFilter.GAME] as string[]) || []}
          onChange={handleMultiSelectChange}
          optionList={gameOptions}
        />
      )}

      {/* VS Club */}
      <MultiSelectInput
        name="club"
        label="VS Club"
        value={(filter[EStatsFilter.CLUB] as string[]) || []}
        onChange={handleMultiSelectChange}
        optionList={vsClubOptions}
      />

      {/* VS Player */}
      <MultiSelectInput
        name="vsPlayer"
        label="VS Player"
        value={(filter[EStatsFilter.VS_PLAYER] as string[]) || []}
        onChange={handleMultiSelectChange}
        optionList={vsPlayerOptions}
      />
    </div>
  );
}
