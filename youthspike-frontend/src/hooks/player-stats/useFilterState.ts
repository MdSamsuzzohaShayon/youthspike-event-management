// hooks/useFilterState.ts
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { EStatsFilter, IFilter } from "@/types";
import { filterToEnum } from "@/utils/helper";

export function useFilterState(
  initialFilter: Partial<Record<EStatsFilter, string | string[]>> = {}
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<
    Partial<Record<EStatsFilter, string | string[]>>
  >(() => {
    // Initialize from URL params
    const params: Partial<Record<EStatsFilter, string | string[]>> = {};

    if (searchParams.get(EStatsFilter.START_DATE))
      params[EStatsFilter.START_DATE] = searchParams.get(
        EStatsFilter.START_DATE
      )!;
    if (searchParams.get(EStatsFilter.END_DATE))
      params[EStatsFilter.END_DATE] = searchParams.get(EStatsFilter.END_DATE)!;
    if (searchParams.get(EStatsFilter.CONFERENCE))
      params[EStatsFilter.CONFERENCE] = searchParams.get(
        EStatsFilter.CONFERENCE
      )!;

    // Handle array params
    if (searchParams.get(EStatsFilter.MATCH))
      params[EStatsFilter.MATCH] = searchParams.getAll(EStatsFilter.MATCH);
    if (searchParams.get(EStatsFilter.GAME))
      params[EStatsFilter.GAME] = searchParams.getAll(EStatsFilter.GAME);
    if (searchParams.get(EStatsFilter.TEAMMATE))
      params[EStatsFilter.TEAMMATE] = searchParams.getAll(
        EStatsFilter.TEAMMATE
      );
    if (searchParams.get(EStatsFilter.CLUB))
      params[EStatsFilter.CLUB] = searchParams.getAll(EStatsFilter.CLUB);
    if (searchParams.get(EStatsFilter.VS_PLAYER))
      params[EStatsFilter.VS_PLAYER] = searchParams.getAll(
        EStatsFilter.VS_PLAYER
      );

    return { ...initialFilter, ...params };
  });

  // Update URL when filter changes
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filter).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    });

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [filter, router]);

  const updateFilter = (
    updates: Partial<Record<EStatsFilter, string | string[]>>
  ) => {
    setFilter((prev) => {
      const newFilter = { ...prev, ...updates };

      // Reset dependent filters
      if (
        updates.m &&
        !arraysEqual(
          prev[EStatsFilter.MATCH] as string[],
          updates[EStatsFilter.MATCH] as string[]
        )
      ) {
        newFilter.g = [];
      }

      return newFilter;
    });
  };

  const handleInputChange = (name: keyof IFilter, value: string | string[]) => {
    // Used shotcut for url params
    const key = filterToEnum[name];
    updateFilter({ [key]: value });
  };

  // ✅ NEW: Clear all filters and reset URL
  const clearAllFilters = () => {
    setFilter({
      m: [],
      g: [],
      tm: [],
      cb: [],
      vp: [],
      ce: "",
      sd: "",
      ed: "",
    });
    router.replace(window.location.pathname, { scroll: false });
  };

  return {
    filter,
    updateFilter,
    handleInputChange,
    clearAllFilters,
  };
}

// Helper function to compare arrays
function arraysEqual(a?: string[], b?: string[]): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}
