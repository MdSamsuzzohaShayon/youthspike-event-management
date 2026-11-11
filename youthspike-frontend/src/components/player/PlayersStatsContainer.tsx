// components/player/PlayersMain.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { QueryRef, useReadQuery, useApolloClient, useQuery, useLazyQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import FilterContent from "../event/FilterContent";
import {
  ISearchFilter,
  IGroup,
  IPlayer,
  ITeam, IPlayerStats,
  IEvent, ISearchPlayerStatsResponse,
  IFilterState, IBadge,
  EBadgeFor,
  IFilter,
  INetRelatives,
  IRoundRelatives,
  ISearchPlayerStatsData,
  IEventSearchData,
  IEventSearchVariables,
  EStatsFilter,
  IPlayerStatsSearchFilter
} from "@/types";
import { SEARCH_PLAYER_STATS } from "@/graphql/player";
import PlayerSearchList from "./PlayerSearchList";
import ActiveFiltersBar from "../event/ActiveFiltersBar";
import BadgeTable from "../badge/BadgeTable";
import EventHeader from "../event/EventHeader";
import StatsFilter from "../player-stats/StatsFilter";
import { useFilterState } from "@/hooks/player-stats/useFilterState";
import useStatsFilterData from "@/hooks/player-stats/useStatsFilterData";
import { filterPlayerStats } from "@/utils/player-stats/playerStatsFilter";
import Image from "next/image";
import ActiveFilters from "../player-stats/ActiveFilters";
import { SEARCH_EVENTS } from "@/graphql/event";
import { buildEventSearchFilter } from "@/utils/event/eventSearchFilter";

interface IPlayersStatsContainerProps {
  queryRef: QueryRef<{ searchPlayerStats: ISearchPlayerStatsResponse }>;
  initialSearchParams: Partial<ISearchFilter>;
}



const DEFAULT_FILTER_STATE: Omit<IFilterState, 'status'> = {
  // ce: EGroupType.CONFERENCE,
  search: "",
  division: "",
  group: "",
  // limit: 30,
  // offset: 0,
};

const LOAD_MORE_INCREMENT = 3;
const PAGE_SIZE = 30;

function PlayersStatsContainer({
  queryRef,
  initialSearchParams,
}: IPlayersStatsContainerProps) {


  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);
  const apolloClient = useApolloClient();
  // Filter-options data: fetched once on first open, then cached.
  // `eventsData` holds the cached result for wiring into the StatsFilter options later.
  const [loadEvents, { data: eventsData }] = useLazyQuery<
    { searchEvents: IEventSearchData },
    IEventSearchVariables
  >(SEARCH_EVENTS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });


  // Server data state
  const [serverData, setServerData] = useState<
    ISearchPlayerStatsResponse["data"] | null
  >(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [playerStatsMap, setPlayerStatsMap] = useState<
    Map<string, IPlayerStats[]>
  >(new Map());
  const [teamMap, setTeamMap] = useState<Map<string, ITeam>>(new Map());
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [badges, setBadges] = useState<IBadge[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [isStatsFilterCached, setIsStatsFilterCached] = useState<boolean>(false);
  const [safeRounds, setSafeRounds] = useState<IRoundRelatives[]>([]);
  const [safeNets, setSafeNets] = useState<INetRelatives[]>([]);

  // Filter and pagination states
  const [appliedFilter, setAppliedFilter] = useState<Omit<IFilterState, 'status'>>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });
  const [currentOffset, setCurrentOffset] = useState(0);

  // Loading states
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);

  // Stats filter state (reuse StatsFilter component)
  const { filter: statsFilter, handleInputChange, clearAllFilters } = useFilterState();
  const [isStatsFilterOpen, setIsStatsFilterOpen] = useState<boolean>(false);

  // Stats filter options and filtered stats for multi-player view
  const safePlayers = useMemo(() => allPlayers || [], [allPlayers]);
  const safeMatches = useMemo(() => serverData?.matches || [], [serverData?.matches]);
  const safeTeams = useMemo(() => {
    const teams: ITeam[] = [];
    if (serverData?.teams) {
      teams.push(...serverData.teams);
    }
    return teams;
  }, [serverData?.teams]);
  const safeEvents = useMemo(() => (event ? [event] : []), [event]);

  const representativePlayer = useMemo(() => {
    if (safePlayers.length > 0) return safePlayers[0];
    return null;
  }, [safePlayers]);
  const {
    matchOptions,
    gameOptions,
    eventOptions
  } = useStatsFilterData({
    player: representativePlayer as IPlayer,
    players: safePlayers,
    filter: statsFilter,
    matches: safeMatches,
    rounds: safeRounds,
    nets: safeNets,
    teams: safeTeams,
    events: safeEvents,
  });


  const isMobileViewport = () =>
    typeof window !== "undefined" && window.innerWidth < 768;


  /** Locks page scroll only where the mobile overlay actually covers the page. */
  const setBodyScrollLocked = useCallback((locked: boolean) => {
    document.body.style.overflow = locked && isMobileViewport() ? "hidden" : "";
  }, []);

  /**
   * Fetches the data that feeds the statistics filter options.
   * Runs at most once per successful load — `isStatsFilterCached` is set
   * optimistically, so toggling the panel 3–4 times never re-fetches.
   * Returns the response data, or null when the request failed.
   */
  const fetchStatsFilterEvents = useCallback(
    async (): Promise<IEventSearchData | null> => {
      // Optimistic flag: rapid re-toggles while in-flight never trigger a second request.
      setIsStatsFilterCached(true);

      const matchIds = new Set<string>();
      for (const match of safeMatches) {
        if (match?._id) {
          matchIds.add(match._id);
        }
      }

      const eventSearchFilter = buildEventSearchFilter({
        eventId: event?._id,
        appliedFilter,
        statsFilter: statsFilter,
      });

      eventSearchFilter.match = statsFilter[EStatsFilter.MATCH] ? statsFilter[EStatsFilter.MATCH] as string[] : [...matchIds];

      try {
        const { data, error } = await loadEvents({
          variables: { filter: eventSearchFilter },
        });

        // Some Apollo versions resolve (instead of reject) on failure.
        if (error) {
          throw error;
        }

        // The backend wraps responses in a code/success/message envelope.
        const searchEvents = data?.searchEvents;
        if (!searchEvents?.success) {
          throw new Error(searchEvents?.message || "searchEvents request failed");
        }

        return searchEvents;
      } catch (error) {
        console.error("Failed to load statistics filter events:", error);
        // Reset so the user can retry by closing and reopening the panel.
        setIsStatsFilterCached(false);
        return null;
      }
    },
    [appliedFilter, statsFilter, event?._id, loadEvents]
  );




  const handleStatsFilterClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsStatsFilterOpen(false);
    setBodyScrollLocked(false);
  };

  const handleStatsOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleStatsFilterClose(e);
    }
  };


  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: Omit<IFilterState, 'status'>, offset: number = 0) => ({
      eventId: initialData?.searchPlayerStats.data.event._id,
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
    (searchData: ISearchPlayerStatsResponse["data"]) => {
      if (!searchData) return;

      // Create player stats Map
      const statsMap = new Map<string, IPlayerStats[]>();
      searchData.statsOfPlayer?.forEach(({ playerId, stats }) => {
        statsMap.set(playerId, stats);
      });

      // Create team Map
      const teamsMap = new Map<string, ITeam>();
      searchData.teams?.forEach((team) => {
        teamsMap.set(team._id, team);
      });

      setAllPlayers(searchData.players || []);
      setPlayerStatsMap(statsMap);
      setTeamMap(teamsMap);
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
    async (filter: Omit<IPlayerStatsSearchFilter, 'status'>, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_PLAYER_STATS,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: "network-only",
        });
        return (result.data as { searchPlayerStats: ISearchPlayerStatsResponse })
          .searchPlayerStats;
      } catch (error) {
        console.error("Failed to fetch players:", error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables]
  );

  const handleFilterApply = async (filter: Omit<IPlayerStatsSearchFilter, 'status'>) => {
    setIsApplyingFilters(true);

    try {
      const response = await executeSearchQuery(filter);
      transformServerData(response.data);
      setAppliedFilter(filter);

      // Update URL
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value && typeof value === "string") {
          params.set(key, value);
        } else if (value && Array.isArray(value)) {
          value.forEach((item) => {
            if (typeof item === "string") {
              params.set(key, item);
            }
          });
        }
      });

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      // Set params in the url
      router.replace(newUrl, { scroll: false });
    } catch (error) {
      console.error("Failed to apply filters:", error);
    } finally {
      setIsApplyingFilters(false);
    }
  }


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

        // Update stats Map with new players' stats
        const newStatsMap = new Map(playerStatsMap);
        response.data.statsOfPlayer?.forEach(({ playerId, stats }) => {
          newStatsMap.set(playerId, stats);
        });
        setPlayerStatsMap(newStatsMap);

        // Update team Map with new teams
        const newTeamMap = new Map(teamMap);
        response.data.teams?.forEach((team) => {
          newTeamMap.set(team._id, team);
        });
        setTeamMap(newTeamMap);

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
    playerStatsMap,
    teamMap,
  ]);

  // Clear filters
  const handleClearFilters = async () => {

    window.location.assign(window.location.pathname);

  };

  const handleStatsFilter = <K extends keyof IFilter>(key: K, value: IFilter[K]) => {

    const updatedFilter: Partial<Record<EStatsFilter, string | string[]>> = { ...statsFilter, [key]: value };
    // Now make request with updated filter
    // Make request to the server  
    // Change updated filter  
    const filter: Omit<IPlayerStatsSearchFilter, 'status'> = {
      division: appliedFilter.division,
      group: appliedFilter.group,
      search: appliedFilter.search,
      startDate: updatedFilter[EStatsFilter.START_DATE] as string | undefined,
      endDate: updatedFilter[EStatsFilter.END_DATE] as string | undefined,
      match: updatedFilter[EStatsFilter.MATCH] as string[] | undefined,
    };
    handleFilterApply(filter);
    handleInputChange(key as keyof IFilter, value as string);
  }


  const handleStatsFilterToggle = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Check if there is no cache
    // Check if the menu is opening
    // Make 2 requests here
    // Do not show event if there is a default event
    // One to get players, another to get appropriate filters, for that we can use search matches
    // With previous filter divisionsOfEvents, group, and search in appliedFilter

    // Step by step filter
    // 1. Event
    // 2. Match start date and end date
    // 3. Group match or not
    // 4. Select multiple matches

    const willOpen = !isStatsFilterOpen;

    // First open only — afterwards the cached result is reused (no refetch).
    if (willOpen && !isStatsFilterCached) {
      // Fire-and-forget: the panel opens instantly; options arrive when ready.
      void fetchStatsFilterEvents().then((eventsResult) => {
        console.log("[PlayersStatsContainer] Stats filter events:", eventsResult);
        setSafeRounds(eventsResult?.data?.rounds || []);
        setSafeNets(eventsResult?.data?.nets || []);
      });
    }

    setIsStatsFilterOpen(willOpen);
    setBodyScrollLocked(willOpen);

  };

  // Initialize with preloaded data
  useEffect(() => {
    if (initialData?.searchPlayerStats) {
      transformServerData(initialData.searchPlayerStats.data);
    }
  }, [initialData, transformServerData]);

  // Release the scroll lock if the user resizes to desktop while the panel
  // is open, or when the component unmounts.
  useEffect(() => {
    if (!isStatsFilterOpen) return;

    const handleResize = () => setBodyScrollLocked(true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      setBodyScrollLocked(false);
    };
  }, [isStatsFilterOpen, setBodyScrollLocked]);

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


  const { netMap, allNetIds } = useMemo(() => {
    const map = new Map<string, INetRelatives>();
    const netIds = new Set<string>();
    for (let i = 0; i < safeNets.length; i++) {
      const n = safeNets[i];
      if (n && n._id) {
        map.set(n._id, n);
        netIds.add(n._id);
      }
    }
    return { netMap: map, allNetIds: netIds };
  }, [safeNets]);

  const filteredPlayerStatsMap = useMemo(() => {
    const newMap = new Map<string, IPlayerStats[]>();
    for (const [playerId, stats] of playerStatsMap.entries()) {
      if (!stats || !Array.isArray(stats)) {
        newMap.set(playerId, []);
        continue;
      }
      const playerTeam = teamMap.get(
        safePlayers.find((p) => p._id === playerId)?.teams?.[0] as string
      ) || (safeTeams[0] as ITeam | undefined);
      try {
        const filtered = filterPlayerStats(
          safeEvents,
          stats,
          statsFilter,
          playerId,
          safeMatches,
          netMap,
          allNetIds,
          playerTeam as ITeam
        );
        newMap.set(playerId, filtered);
      } catch (e) {
        newMap.set(playerId, stats);
      }
    }
    return newMap;
  }, [playerStatsMap, statsFilter, safePlayers, safeMatches, netMap, allNetIds, teamMap, safeTeams, safeEvents]);






  return (
    <div className="animate-fade-in">
      {/* Event Wrapper Start  */}
      {event && <EventHeader event={event} eventId={event._id} />}

      {/* Page Content */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 md:mt-6">
        <div className="content w-full rounded-md bg-gray-800 p-3 md:p-4 animate-fade-in-up">

          {/* Filters */}
          <FilterContent
            groups={groups}
            divisions={event?.divisions ?? ""}
            loading={isApplyingFilters}
            filter={appliedFilter}
            onApplyFilters={handleFilterApply}
          />

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <ActiveFiltersBar appliedFilter={appliedFilter} groups={groups} isApplyingFilters={isApplyingFilters} onClearFilters={handleClearFilters} />
          )}

          {/* Stats Filter Toggle and Section */}

          <div className="w-full mt-4 mb-4">
            {!isStatsFilterOpen && (
              <button
                onClick={handleStatsFilterToggle}
                className="btn-info"
              >
                <span className="flex items-center gap-2">
                  <Image
                    src="/icons/filter.svg"
                    width={20}
                    height={20}
                    className="w-5 h-5 svg-black"
                    alt="filter-icon"
                  />
                  <span className="font-semibold">
                    Show Statistics Filters
                  </span>
                </span>
              </button>
            )}

            {/* Stats Filter Content */}
            {isStatsFilterOpen && (
              <div className="w-full">
                {/* Mobile Overlay */}
                <div
                  className="fixed inset-0 z-50 md:hidden"
                  onClick={handleStatsOverlayClick}
                >
                  <div className="absolute inset-0 bg-gray-900/50 transition-opacity duration-300" />
                  <div className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out">
                    <div className="h-full overflow-y-auto p-4">
                      <div className="flex items-center justify-between mb-6 p-4 border-b border-gray-700">
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
                        <button
                          onClick={handleStatsFilterClose}
                          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Image
                            src="/icons/close.svg"
                            width={20}
                            height={20}
                            className="w-6 h-6 svg-white"
                            alt="close-icon"
                          />
                        </button>
                      </div>
                      <StatsFilter
                        filter={statsFilter}
                        handleInputChange={handleStatsFilter}
                        gameOptions={gameOptions}
                        matchOptions={matchOptions}
                        eventOptions={eventOptions}
                      />
                      <div className="mt-4">
                        <ActiveFilters
                          filter={statsFilter}
                          onClearAll={clearAllFilters}
                          gameOptions={gameOptions}
                          matchOptions={matchOptions}
                          eventOptions={eventOptions}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex flex-row md:flex-col gap-4 mt-4">
                  <div className="w-full">
                    <StatsFilter
                      filter={statsFilter}
                      handleInputChange={handleStatsFilter}
                      gameOptions={gameOptions}
                      matchOptions={matchOptions}
                      eventOptions={eventOptions}
                    />
                  </div>
                  <div className="w-full md:w-9/12 flex gap-x-2 items-center">
                    <ActiveFilters
                      filter={statsFilter}
                      onClearAll={clearAllFilters}
                      gameOptions={gameOptions}
                      matchOptions={matchOptions}
                      eventOptions={eventOptions}
                    />
                    {isStatsFilterOpen && (
                      <button
                        onClick={handleStatsFilterToggle}
                        className="btn-danger"
                      >
                        <span className="flex items-center gap-2">
                          <Image
                            src="/icons/filter.svg"
                            width={20}
                            height={20}
                            className="w-5 h-5 svg-white"
                            alt="filter-icon"
                          />
                          <span className="font-semibold">
                            Hide Statistics Filters
                          </span>
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

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
                badges={badges}
                playerList={displayedPlayers}
                matchList={serverData?.matches || []}
                playerStatsMap={filteredPlayerStatsMap}
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


export default PlayersStatsContainer;