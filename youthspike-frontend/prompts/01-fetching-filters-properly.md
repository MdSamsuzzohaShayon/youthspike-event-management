I am creating a project with nest.js, graphql, mongodb in the backend and in the frontend I have next.js and apollo client. 
I am using all latest packages or libraries.
Here is my PlayersStatsContainer page:

```
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
  IEventSearchData
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
  const [leadEvents,{
    data: eventsData,
    error: refreshError,
    refetch,
    loading: isRefreshing,
  }] = useLazyQuery<IEventSearchData>(SEARCH_EVENTS, {
    // variables: { filter },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
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
  const { filter, handleInputChange, clearAllFilters } = useFilterState();
  const [isStatsFilterOpen, setIsStatsFilterOpen] = useState<boolean>(false);

  // Stats filter options and filtered stats for multi-player view
  const safePlayers = useMemo(() => allPlayers || [], [allPlayers]);
  const safeMatches = useMemo(() => serverData?.matches || [], [serverData?.matches]);
  const safeRounds: IRoundRelatives[] = useMemo(() => (serverData as ISearchPlayerStatsData)?.rounds || [], [serverData]);
  const safeNets: INetRelatives[] = useMemo(() => (serverData as ISearchPlayerStatsData)?.nets || [], [serverData]);
  const safeTeams = useMemo(() => {
    const teams: ITeam[] = [];
    if (serverData?.teams) {
      teams.push(...serverData.teams);
    }
    return teams;
  }, [serverData?.teams]);
  const safeEvents = useMemo(() => (event ? [event] : []), [event]);


  const isMobileViewport = () =>
    typeof window !== "undefined" && window.innerWidth < 768;

  const handleStatsFilterToggle = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Check if there is no cache
    // Check if the menu is opening
    if (!isStatsFilterOpen && !isStatsFilterCached) {
      // Make 2 requests here
      // One to get players, another to get appropriate filters, for that we can use search matches
      // With previous filter divisionsOfEvents, group, and search in appliedFilter

      // Step by step filter
      // 1. Event
      // 2. Match start date and end date
      // 3. Group match or not
      // 4. Select multiple matches
      setIsStatsFilterCached(true);
    }
    setIsStatsFilterOpen((prev) => {
      const newState = !prev;
      // Only lock scroll on mobile where the overlay actually covers the page
      document.body.style.overflow =
        newState && isMobileViewport() ? "hidden" : "";
      return newState;
    });
  };


  const handleStatsFilterClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsStatsFilterOpen(false);
    document.body.style.overflow = "";
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
    async (filter: Omit<IFilterState, 'status'>, offset: number = 0) => {
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

  const handleFilterApply = async (filter: Omit<IFilterState, 'status'>) => {
    setIsApplyingFilters(true);

    try {
      const response = await executeSearchQuery(filter);
      transformServerData(response.data);
      setAppliedFilter(filter);

      // Update URL
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
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

  // Initialize with preloaded data
  useEffect(() => {
    if (initialData?.searchPlayerStats) {
      transformServerData(initialData.searchPlayerStats.data);
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
    filter,
    matches: safeMatches,
    rounds: safeRounds,
    nets: safeNets,
    teams: safeTeams,
    events: safeEvents
  });

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
          filter,
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
  }, [playerStatsMap, filter, safePlayers, safeMatches, netMap, allNetIds, teamMap, safeTeams, safeEvents]);


  // Release the scroll lock if the user resizes to desktop while the panel is open,
  // or when the component unmounts.
  useEffect(() => {
    if (!isStatsFilterOpen) return;

    const handleResize = () => {
      document.body.style.overflow = isMobileViewport() ? "hidden" : "";
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
    };
  }, [isStatsFilterOpen]);



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
            <button
              onClick={handleStatsFilterToggle}
              className="btn-secondary"
            >
              <span className="flex items-center gap-2">
                <Image
                  src="/icons/filter.svg"
                  width={20}
                  height={20}
                  className="w-5 h-5 svg-white"
                  alt="filter-icon"
                />
                <span className="text-yellow-logo font-semibold">
                  {isStatsFilterOpen ? "Hide Statistics Filters" : "Show Statistics Filters"}
                </span>
              </span>
            </button>

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
                        filter={filter}
                        handleInputChange={<K extends keyof IFilter>(
                          key: K,
                          value: IFilter[K]
                        ) => handleInputChange(key as keyof IFilter, value as string)}
                        gameOptions={gameOptions}
                        matchOptions={matchOptions}
                        eventOptions={eventOptions}
                      />
                      <div className="mt-4">
                        <ActiveFilters
                          filter={filter}
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
                  <div className="w-full rounded-xl p-4">
                    <button className="flex items-center justify-between mb-4 border-b border-gray-500 w-full">
                      <span>
                        <Image
                          src="/icons/filter.svg"
                          width={20}
                          height={20}
                          className="w-8 svg-white"
                          alt="filter-icon"
                        />
                      </span>
                      Filter Stats
                    </button>
                    <StatsFilter
                      filter={filter}
                      handleInputChange={<K extends keyof IFilter>(
                        key: K,
                        value: IFilter[K]
                      ) => handleInputChange(key as keyof IFilter, value as string)}
                      gameOptions={gameOptions}
                      matchOptions={matchOptions}
                      eventOptions={eventOptions}
                    />
                  </div>
                  <div className="w-full md:w-9/12">
                    <ActiveFilters
                      filter={filter}
                      onClearAll={clearAllFilters}
                      gameOptions={gameOptions}
                      matchOptions={matchOptions}
                      eventOptions={eventOptions}
                    />
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

```


Here is my SearchEvents query:

```

const SEARCH_EVENTS = gql`
query SearchEvents($filter: EventSearchInput){
  searchEvents(filter:$filter){
    code
    success
    message
    data{
      events{
        _id
        name
        location
        logo
        defaulted
        description
      }
      matches{
        _id 
        division
        description
        date
        group
        rounds
        nets
        location
        completed
      }
      games{
        _id
        division
      }
    }
  }
}
`;



```


Here is my EventSearchInput (filter type) from the backend:
```

@InputType()
export class EventSearchInput {
  @Field(() => String, { nullable: true })
  event: string;

  @Field(() => String, { nullable: true })
  startDate?: string;

  @Field(() => String, { nullable: true })
  endDate?: string;

  @Field(() => String, { nullable: true })
  group?: string;

  @Field(() => String, { nullable: true })
  specificGroup?: string;

  @Field(() => String, { nullable: true })
  division?: string;

  @Field(() => [String], { nullable: true })
  matches?: string[];

  @Field(() => String, { nullable: true })
  ce?: EGroupType;

}

```


Here is my handleInputChange function:

```
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

```


Now you need to do:
1. Complete handleStatsFilterToggle function
2. When someone open the filter, we will call leadEvents and get data
3. If someone click on the filter 3 or 4 times, then do not fetch multiple times, instead cache them
4. Get division, specificGroup, and search value from applied filter and startDate, endDate, ce, matches (array of string) from filter of useFilterState
5. Console log the result in handleStatsFilterToggle

Follow the coding style below:
1. Use clear, meaningful, and self-explanatory names for all variables and functions.
2. Apply the KISS (Keep It Simple) and DRY (Don’t Repeat Yourself) principles to ensure the code is clean, readable, and maintainable.
3. Add proper TypeScript typings to improve type safety and reduce potential runtime errors. Try not to use any type
4. Optimize the implementation for better time and space complexity, ensuring improved performance and scalability where possible.
5. Identify and fix any existing errors so the code runs correctly, without altering the original business logic.
6. Break down complex logic into smaller helper functions or subcomponents where it improves readability and structure. Try to make pure functions if possible. Must Apply Single Responsibility Principle (SRP)
7. Implement robust and clean error handling, ensuring edge cases are handled gracefully.
