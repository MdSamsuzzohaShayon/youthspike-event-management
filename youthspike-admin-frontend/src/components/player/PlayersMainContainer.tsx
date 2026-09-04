// components/player/PlayersMain.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryRef, useReadQuery, useApolloClient } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterContent from "../event/FilterContent";
import {
  ISearchFilter,
  IGroup,
  IPlayer,
  ITeam,
  IPlayerStats,
  IEvent,
  IFilterState,
  IBadge,
  EBadgeFor,
  ISearchPlayerResponse,
  EFilterPage,
} from "@/types";
import PlayerSearchList from "./PlayerSearchList";
import ActiveFiltersBar from "../event/ActiveFiltersBar";
import BadgeTable from "../badge/BadgeTable";
import { SEARCH_PLAYERS } from "@/graphql/players";
import EventNavigation from "../layout/EventNavigation";

interface IPlayersMainContainerProps {
  queryRef: QueryRef<{ searchPlayers: ISearchPlayerResponse }>;
  initialSearchParams: Partial<ISearchFilter>;
}



const DEFAULT_FILTER_STATE: Omit<IFilterState, 'status'> = {
  // ce: EGroupType.CONFERENCE,
  search: "",
  division: "",
  group: "",
};

const LOAD_MORE_INCREMENT = 3;
const PAGE_SIZE = 30;

function PlayersMainContainer({
  queryRef,
  initialSearchParams,
}: IPlayersMainContainerProps) {
  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);
  const apolloClient = useApolloClient();


  // Server data state
  const [serverData, setServerData] = useState<
    ISearchPlayerResponse["data"] | null
  >(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [badges, setBadges] = useState<IBadge[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);

  const searchRequestIdRef = useRef<number>(0);

  // Filter and pagination states
  const [appliedFilter, setAppliedFilter] = useState<Omit<IFilterState, 'status'>>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });
  const [currentOffset, setCurrentOffset] = useState(0);

  // Loading states
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMorePlayers, setHasMorePlayers] = useState<boolean>(true);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: Omit<IFilterState, 'status'>, offset: number = 0) => ({
      eventId: initialData?.searchPlayers.data.event._id,
      filter: {
        search: filter.search || undefined,
        division: filter.division || undefined,
        group: filter.group || undefined,
        limit: PAGE_SIZE,
        offset: offset,
      },
    }),
    [initialData]
  );

  // Transform server data into usable maps
  const transformServerData = useCallback(
    (searchData: ISearchPlayerResponse["data"]) => {
      if (!searchData) return;

      setAllPlayers(searchData.players || []);
      setTeams(searchData.teams || []);
      setGroups(searchData.groups || []);
      setBadges(searchData.badges || []);
      setServerData(searchData);
      setEvent(searchData.event || null);

      // Check if there are more players to load
      setHasMorePlayers(
        searchData.players.length ===
        PAGE_SIZE
      );
    },
    []
  );

  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: Omit<IFilterState, 'status'>, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_PLAYERS,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: "network-only",
        });
        return (result.data as { searchPlayers: ISearchPlayerResponse })
          .searchPlayers;
      } catch (error) {
        console.error("Failed to fetch players:", error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables]
  );

  const handleFilterApply = async (
    filter: Omit<IFilterState, 'status'>
  ) => {
    const requestId = ++searchRequestIdRef.current;

    setIsApplyingFilters(true);

    try {
      const response = await executeSearchQuery(filter);

      // Ignore stale response.
      if (requestId !== searchRequestIdRef.current) {
        return;
      }

      transformServerData(response.data);
      setAppliedFilter(filter);

      const params = new URLSearchParams();

      Object.entries(filter).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      const queryString = params.toString();

      router.replace(
        queryString
          ? `${window.location.pathname}?${queryString}`
          : window.location.pathname,
        { scroll: false }
      );
    } catch (error) {
      if (requestId === searchRequestIdRef.current) {
        console.error("Failed to apply filters:", error);
      }
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsApplyingFilters(false);
      }
    }
  };

  // Load more players
  const handleLoadMore = useCallback(async () => {
    if (!hasMorePlayers || isLoadingMore) return;

    setIsLoadingMore(true);
    const newOffset =
      currentOffset + PAGE_SIZE;

    try {
      const response = await executeSearchQuery(appliedFilter, newOffset);
      const newPlayers = response.data.players || [];

      if (newPlayers.length > 0) {
        setAllPlayers((prev) => [...prev, ...newPlayers]);
        setCurrentOffset(newOffset);


        setTeams(response.data.teams || []);

        // Check if there are more players
        setHasMorePlayers(
          newPlayers.length ===
          PAGE_SIZE
        );
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
  ]);

  // Clear filters
  const handleClearFilters = async () => {

    window.location.assign(window.location.pathname);

  };

  // Initialize with preloaded data
  useEffect(() => {
    if (initialData?.searchPlayers) {
      transformServerData(initialData.searchPlayers.data);
    }
  }, [initialData, transformServerData]);

  // UI state computations
  const hasActiveFilters = useMemo(
    () =>
      Object.entries(appliedFilter).some(
        ([key, value]) => value !== "" && key !== "limit" && key !== "offset"
      ),
    [appliedFilter]
  );

  const playerBadges = useMemo(() => {
    return badges.filter((badge) => badge.badgeFor === EBadgeFor.PLAYER)
  }, [badges]);

  const displayedPlayers = useMemo(
    () =>
      allPlayers.slice(
        0,
        currentOffset +
        PAGE_SIZE +
        LOAD_MORE_INCREMENT
      ),
    [allPlayers, currentOffset]
  );



  return (
    <div className="animate-fade-in">
      {/* Event Wrapper Start  */}
      <div className="navigation my-8">
        <EventNavigation event={event} />
      </div>

      {/* Page Content */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 md:mt-6">
        <div className="content w-full rounded-md bg-gray-800 p-3 md:p-4 animate-fade-in-up">

          {/* Filters */}
          <FilterContent
            groups={groups}
            divisions={event?.divisions ?? ""}
            loading={isApplyingFilters}
            filter={appliedFilter}
            filterPage={EFilterPage.PLAYERS}
            onApplyFilters={handleFilterApply}
          />

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <ActiveFiltersBar appliedFilter={appliedFilter} groups={groups} isApplyingFilters={isApplyingFilters} onClearFilters={handleClearFilters} />
          )}

          {/* Loading state for initial load */}
          {isApplyingFilters && allPlayers.length === 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-2 border-yellow-logo border-t-transparent rounded-full animate-spin" />
              <span className="ml-2 text-gray-300">Loading players...</span>
            </div>
          )}

          {/* Players List */}
          {!isApplyingFilters && (
            <div className="w-full player-standings">
              <PlayerSearchList
                playerList={displayedPlayers}
                teamList={teams}
                events={event ? [event] : []}
                badges={playerBadges}
                selectedEvent={event}
              />
            </div>
          )}

          {/* Load More Button */}
          {hasMorePlayers && !isApplyingFilters && displayedPlayers.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2 bg-yellow-logo text-gray-900 rounded-md hover:bg-yellow-logo disabled:bg-yellow-700 disabled:cursor-not-allowed transition-colors font-medium"
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

          <div className="w-full mt-6">
            <h4>Badges</h4>
            <BadgeTable badges={playerBadges} />
          </div>
        </div>
      </div>

      {/* Event Wrapper End  */}

    </div>
  );
}


export default PlayersMainContainer;