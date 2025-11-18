// components/player/PlayersMain.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { QueryRef, useReadQuery, useApolloClient } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterContent from "../event/FilterContent";
import { 
  ISearchFilter, 
  IGroup, 
  ISearchPlayerResponse, 
  IPlayer,
  ITeam,
  IAllStats,
  IPlayerStats,
  IEvent,
} from "@/types";
import { SEARCH_PLAYERS } from "@/graphql/player";
import PlayerSearchList from "./PlayerSearchList";

interface PlayersMainProps {
  queryRef: QueryRef<{ searchPlayers: ISearchPlayerResponse }>;
  initialSearchParams: Partial<ISearchFilter>;
}

interface FilterState extends Partial<ISearchFilter> {
  search: string;
  division: string;
  group: string;
}

const DEFAULT_FILTER_STATE: FilterState = {
  search: "",
  division: "",
  group: "",
  limit: 30,
  offset: 0,
};

const LOAD_MORE_INCREMENT = 3;

export default function PlayersMain({
  queryRef,
  initialSearchParams,
}: PlayersMainProps) {
  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);
  const apolloClient = useApolloClient();

  console.log({initialData});
  
  // Server data state
  const [serverData, setServerData] = useState<ISearchPlayerResponse['data'] | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [playerStatsMap, setPlayerStatsMap] = useState<Map<string, IPlayerStats[]>>(new Map());
  const [teamMap, setTeamMap] = useState<Map<string, ITeam>>(new Map());
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);

  // Filter and pagination states
  const [localFilter, setLocalFilter] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(localFilter);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Loading states
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: FilterState, offset: number = 0) => ({
      eventId: initialData?.searchPlayers.data.event._id,
      filter: {
        search: filter.search || undefined,
        division: filter.division || undefined,
        group: filter.group || undefined,
        limit: filter.limit,
        offset: offset,
      },
    }),
    [initialData]
  );

  // Transform server data into usable maps
  const transformServerData = useCallback((searchData: ISearchPlayerResponse['data']) => {
    if (!searchData) return;

    // Create player stats Map
    const statsMap = new Map<string, IPlayerStats[]>();
    searchData.statsOfPlayer?.forEach(({ playerId, stats }) => {
      statsMap.set(playerId, stats);
    });

    // Create team Map
    const teamsMap = new Map<string, ITeam>();
    searchData.teams?.forEach(team => {
      teamsMap.set(team._id, team);
    });

    setAllPlayers(searchData.players || []);
    setPlayerStatsMap(statsMap);
    setTeamMap(teamsMap);
    setGroups(searchData.groups || []);
    setServerData(searchData);
    setEvent(searchData.event || null);


    // Check if there are more players to load
    setHasMorePlayers(searchData.players.length === (appliedFilter.limit || DEFAULT_FILTER_STATE.limit!));
  }, [appliedFilter.limit]);

  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: FilterState, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_PLAYERS,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: "network-only",
        });
        return (result.data as { searchPlayers: ISearchPlayerResponse }).searchPlayers;
      } catch (error) {
        console.error("Failed to fetch players:", error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables]
  );

  // Apply filters with reset pagination
  const handleApplyFilters = useCallback(async () => {
    setIsApplyingFilters(true);
    setCurrentOffset(0);

    try {
      const response = await executeSearchQuery(localFilter, 0);
      transformServerData(response.data);
      setAppliedFilter(localFilter);

      // Update URL
      const params = new URLSearchParams();
      Object.entries(localFilter).forEach(([key, value]) => {
        if (value && value !== "") {
          params.set(key, String(value));
        }
      });

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    } catch (error) {
      console.error("Failed to apply filters:", error);
    } finally {
      setIsApplyingFilters(false);
    }
  }, [localFilter, executeSearchQuery, transformServerData, router]);

  // Load more players
  const handleLoadMore = useCallback(async () => {
    if (!hasMorePlayers || isLoadingMore) return;

    setIsLoadingMore(true);
    const newOffset = currentOffset + (appliedFilter.limit || DEFAULT_FILTER_STATE.limit!);

    try {
      const response = await executeSearchQuery(appliedFilter, newOffset);
      const newPlayers = response.data.players || [];
      
      if (newPlayers.length > 0) {
        setAllPlayers(prev => [...prev, ...newPlayers]);
        setCurrentOffset(newOffset);
        
        // Update stats Map with new players' stats
        const newStatsMap = new Map(playerStatsMap);
        response.data.statsOfPlayer?.forEach(({ playerId, stats }) => {
          newStatsMap.set(playerId, stats);
        });
        setPlayerStatsMap(newStatsMap);

        // Update team Map with new teams
        const newTeamMap = new Map(teamMap);
        response.data.teams?.forEach(team => {
          newTeamMap.set(team._id, team);
        });
        setTeamMap(newTeamMap);

        // Check if there are more players
        setHasMorePlayers(newPlayers.length === (appliedFilter.limit || DEFAULT_FILTER_STATE.limit!));
      } else {
        setHasMorePlayers(false);
      }
    } catch (error) {
      console.error("Failed to load more players:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasMorePlayers, 
    isLoadingMore, 
    currentOffset, 
    appliedFilter, 
    executeSearchQuery, 
    playerStatsMap,
    teamMap
  ]);

  // Clear filters
  const handleClearFilters = useCallback(async () => {
    const clearedFilter = { ...DEFAULT_FILTER_STATE };
    
    setLocalFilter(clearedFilter);
    setCurrentOffset(0);

    try {
      const response = await executeSearchQuery(clearedFilter, 0);
      transformServerData(response.data);
      setAppliedFilter(clearedFilter);
      router.replace(window.location.pathname, { scroll: false });
    } catch (error) {
      console.error("Failed to clear filters:", error);
    }
  }, [executeSearchQuery, transformServerData, router]);

  // Filter players based on applied filters (client-side for search)
  const filteredPlayers: IPlayer[] = useMemo(() => {
    return allPlayers.filter((player) => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const matchesSearch =
        !appliedFilter.search ||
        fullName.includes(appliedFilter.search.toLowerCase()) ||
        player.email.toLowerCase().includes(appliedFilter.search.toLowerCase()) ||
        player.username?.toLowerCase().includes(appliedFilter.search.toLowerCase());
      
      const matchesDivision =
        !appliedFilter.division || player.division === appliedFilter.division;

      return matchesSearch && matchesDivision;
    });
  }, [allPlayers, appliedFilter.search, appliedFilter.division]);

  // Update local filter
  const updateLocalFilter = useCallback((key: string, value: string) => {
    setLocalFilter((prev) => ({ 
      ...prev, 
      [key]: value 
    }));
  }, []);

  // Initialize with preloaded data
  useEffect(() => {
    if (initialData?.searchPlayers) {
      transformServerData(initialData.searchPlayers.data);
    }
  }, [initialData, transformServerData]);

  // UI state computations
  const hasActiveFilters = useMemo(() => 
    Object.entries(appliedFilter).some(([key, value]) => 
      value !== "" && key !== 'limit' && key !== 'offset'
    ), 
    [appliedFilter]
  );

  const hasUnsavedChanges = useMemo(() =>
    JSON.stringify({
      search: localFilter.search,
      division: localFilter.division,
      group: localFilter.group,
    }) !== JSON.stringify({
      search: appliedFilter.search,
      division: appliedFilter.division,
      group: appliedFilter.group,
    }),
    [localFilter, appliedFilter]
  );

  const displayedPlayers = useMemo(() => 
    allPlayers.slice(0, currentOffset + (appliedFilter.limit || DEFAULT_FILTER_STATE.limit!) + LOAD_MORE_INCREMENT),
    [allPlayers, currentOffset, appliedFilter.limit]
  );

  

  

  return (
    <div className="animate-fade-in">
      {/* Filters */}
      <FilterContent
        groups={groups}
        divisions={event?.divisions ?? ""}
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
                .filter(([key, value]) => value && key !== 'limit' && key !== 'offset')
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")}
            </span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
              disabled={isApplyingFilters}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Loading state for initial load */}
      {isApplyingFilters && allPlayers.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-gray-300">Loading players...</span>
        </div>
      )}

      {/* Players List */}
      {!isApplyingFilters && (
        <div className="w-full player-standings">
          <PlayerSearchList
            playerList={displayedPlayers}
            matchList={serverData?.matches || []}
            playerStatsMap={playerStatsMap}
            teamMap={teamMap}
          />
        </div>
      )}

      {/* Load More Button */}
      {hasMorePlayers && !isApplyingFilters && displayedPlayers.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-yellow-500 text-gray-900 rounded-md hover:bg-yellow-400 disabled:bg-yellow-700 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoadingMore ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </span>
            ) : (
              `Load More Players`
            )}
          </button>
        </div>
      )}

      {/* No players found */}
      {!isApplyingFilters && displayedPlayers.length === 0 && (
        <div className="text-center py-8 text-gray-400 animate-fade-in">
          No players found matching your criteria.
        </div>
      )}

      {/* End of results */}
      {!hasMorePlayers && displayedPlayers.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No more players to load.
        </div>
      )}
    </div>
  );
}