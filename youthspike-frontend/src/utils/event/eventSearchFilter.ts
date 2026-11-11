import { EGroupType, EStatsFilter, IBuildEventSearchFilterParams, IEventSearchFilter, IFilterState } from "@/types";

export const isMobileViewport = (): boolean =>
  typeof window !== "undefined" && window.innerWidth < 768;

/** Reads a single string from a filter entry that can be `string | string[]`. */
export const readStringFilterValue = (
  value: string | string[] | undefined
): string | undefined => (Array.isArray(value) ? value[0] : value) || undefined;

/** Reads a non-empty string array from a filter entry, otherwise undefined. */
export const readStringArrayFilterValue = (
  value: string | string[] | undefined
): string[] | undefined =>
  Array.isArray(value) && value.length > 0 ? value : undefined;



/**
 * Builds the EventSearchInput for SEARCH_EVENTS by merging the two filter
 * sources. Pure function — no side effects, easy to unit test.
 */
export const buildEventSearchFilter = ({
  eventId,
  appliedFilter,
  statsFilter,
}: IBuildEventSearchFilterParams): IEventSearchFilter => ({
  event: eventId || "",
  division: appliedFilter.division || undefined,
  specificGroup: appliedFilter.group || undefined,
  startDate: readStringFilterValue(statsFilter[EStatsFilter.START_DATE]) || undefined,
  endDate: readStringFilterValue(statsFilter[EStatsFilter.END_DATE]) || undefined,
  ce: readStringFilterValue(statsFilter[EStatsFilter.CONFERENCE]) as EGroupType | undefined,
  match: readStringArrayFilterValue(statsFilter[EStatsFilter.MATCH]) || undefined,
});