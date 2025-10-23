"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { QueryRef, useReadQuery, useApolloClient } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterContent from "../event/FilterContent";
import { ISearchFilter, IGroup, ISearchPlayerResponse, IPlayer } from "@/types";
import { SEARCH_PLAYERS } from "@/graphql/player";
import PlayerStandings from "./PlayerStandings";
import PlayerSearchList from "./PlayerSearchList";

interface PlayersMainProps {
  queryRef: QueryRef<{ searchPlayers: ISearchPlayerResponse }>; // Replace with proper type
  initialSearchParams: Partial<ISearchFilter>;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  division: string;
  team: string;
  number: number;
  group?: string;
}

interface FilterState {
  search: string;
  division: string;
  group: string;
}

const DEFAULT_FILTER_STATE: FilterState = {
  search: "",
  division: "",
  group: "",
};

export default function PlayersMain({
  queryRef,
  initialSearchParams,
}: PlayersMainProps) {
  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);
  const apolloClient = useApolloClient();

  // Filter states
  const [localFilter, setLocalFilter] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });

  const [appliedFilter, setAppliedFilter] = useState<FilterState>(localFilter);

  // Server data state
  const [players, setPlayers] = useState<IPlayer[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);

  // Loading states
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: FilterState) => ({
      filter: {
        search: filter.search || undefined,
        division: filter.division || undefined,
        group: filter.group || undefined,
      },
    }),
    []
  );

  // Update all server data from response
  const updateAllData = useCallback((responseData: ISearchPlayerResponse) => {
    const searchData = responseData?.data;
    if (!searchData) return;

    setPlayers(searchData.players || []);
    setGroups(searchData.groups || []);
    // setDivisions(searchData.event.divisions || []);
  }, []);

  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: FilterState) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_PLAYERS,
          variables: buildQueryVariables(filter),
          fetchPolicy: "network-only",
        });
        return result.data;
      } catch (error) {
        console.error("Failed to fetch players:", error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables]
  );

  // Apply filters
  const handleApplyFilters = useCallback(async () => {
    setIsApplyingFilters(true);

    try {
      const responseData = await executeSearchQuery(localFilter);
      updateAllData(responseData as ISearchPlayerResponse);
      setAppliedFilter(localFilter);

      // Update URL
      const params = new URLSearchParams();
      Object.entries(localFilter).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    } catch (error) {
      console.error("Failed to apply filters:", error);
    } finally {
      setIsApplyingFilters(false);
    }
  }, [localFilter, executeSearchQuery, updateAllData, router]);

  // Clear filters
  const handleClearFilters = useCallback(async () => {
    const clearedFilter = { ...DEFAULT_FILTER_STATE };

    setLocalFilter(clearedFilter);

    try {
      const responseData = await executeSearchQuery(clearedFilter);
      updateAllData(responseData as ISearchPlayerResponse);
      setAppliedFilter(clearedFilter);
      router.replace(window.location.pathname, { scroll: false });
    } catch (error) {
      console.error("Failed to clear filters:", error);
    }
  }, [executeSearchQuery, updateAllData, router]);

  // Initialize with preloaded data
  useEffect(() => {
    if (initialData && players.length === 0) {
      updateAllData(initialData.searchPlayers);
    }
  }, [initialData, players.length, updateAllData]);

  // Filter players based on applied filters
  const filteredPlayers: IPlayer[] = useMemo(() => {
    return players.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const matchesSearch =
        !appliedFilter.search ||
        fullName.includes(appliedFilter.search.toLowerCase());
      const matchesDivision =
        !appliedFilter.division || player.division === appliedFilter.division;
      // const matchesGroup =
      //   !appliedFilter.group || player.group === appliedFilter.group;

      return matchesSearch && matchesDivision;
    });
  }, [players, appliedFilter]);

  // Update local filter
  const updateLocalFilter = (key: string, value: string) => {
    setLocalFilter((prev) => ({ ...prev, [key]: value }));
  };

  // UI state computations
  const hasActiveFilters = Object.values(appliedFilter).some(
    (value) => value !== ""
  );
  const hasUnsavedChanges =
    JSON.stringify(localFilter) !== JSON.stringify(appliedFilter);

  return (
    <div className="animate-fade-in">
      <FilterContent
        groups={groups}
        divisions={divisions.join(",")}
        loading={isApplyingFilters}
        filter={localFilter}
        updateFilter={updateLocalFilter}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        hasUnsavedChanges={hasUnsavedChanges}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-gray-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">
              Active filters:{" "}
              {Object.entries(appliedFilter)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")}
            </span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isApplyingFilters && players.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-gray-300">Loading players...</span>
        </div>
      )}

      {/* Players Grid */}
      {!isApplyingFilters && (
        <div className="w-full player-standings">
          <PlayerSearchList
            playerList={filteredPlayers}
            matchList={[]}
            playerStatsMap={new Map()}
            teamMap={new Map()}
          />
        </div>
      )}

      {!isApplyingFilters && filteredPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-400 animate-fade-in">
          No players found matching your criteria.
        </div>
      )}
    </div>
  );
}
