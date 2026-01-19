// components/player/PlayersMainContainer.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { QueryRef, useReadQuery, useApolloClient } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import FilterContent from '../event/FilterContent';
import { ISearchFilter, ISearchPlayerResponse, IPlayer, ITeam, IEvent, EGroupType, EFilterPage, IGroup } from '@/types';
import { SEARCH_PLAYERS } from '@/graphql/players';
import PlayerSearchList from './PlayerSearchList';
import EventNavigation from '../layout/EventNavigation';

interface PlayersMainContainerProps {
  queryRef: QueryRef<{ searchPlayers: ISearchPlayerResponse }>;
  initialSearchParams: Partial<ISearchFilter>;
}

interface IFilterState extends Partial<ISearchFilter> {
  search: string;
  division: string;
  group: string;
}

const DEFAULT_FILTER_STATE: IFilterState = {
  ce: EGroupType.CONFERENCE,
  search: '',
  division: '',
  group: '',
  limit: 30,
  offset: 0,
};

const LOAD_MORE_INCREMENT = 3;

export default function PlayersMainContainer({ queryRef, initialSearchParams }: PlayersMainContainerProps) {
  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);
  const apolloClient = useApolloClient();

  // Server data state
  const [serverData, setServerData] = useState<ISearchPlayerResponse['data'] | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [groupList, setGroupList] = useState<IGroup[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);

  

  // Filter and pagination states
  const [localFilter, setLocalFilter] = useState<IFilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });
  const [appliedFilter, setAppliedFilter] = useState<IFilterState>(localFilter);
  const [currentOffset, setCurrentOffset] = useState(0);

  // Loading states
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: IFilterState, offset: number = 0) => ({
      eventId: initialData?.searchPlayers.data.event._id,
      filter: {
        search: filter.search || undefined,
        division: filter.division || undefined,
        group: filter.group || undefined,
        limit: filter.limit,
        offset: offset,
      },
    }),
    [initialData],
  );

  // Transform server data into usable maps
  const transformServerData = useCallback(
    (searchData: ISearchPlayerResponse['data']) => {
      if (!searchData) return;

      setAllPlayers(searchData.players || []);
      setTeamList(searchData.teams || []);
      setGroupList(searchData.groups || []);
      setEvent(searchData.event);
      setServerData(searchData);
      

      // Check if there are more players to load
      setHasMorePlayers(searchData.players.length === (appliedFilter.limit || DEFAULT_FILTER_STATE.limit!));
    },
    [appliedFilter.limit],
  );
  

  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: IFilterState, offset: number = 0) => {
      try {
        const result = await apolloClient.query<{ searchPlayers: ISearchPlayerResponse }>({
          query: SEARCH_PLAYERS,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: 'network-only',
        });

        if (!result.data) {
          console.error(result);
          
          throw new Error('No data returned from query');
        }

        return result.data.searchPlayers;
      } catch (error) {
        console.error('Failed to fetch players:', error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables],
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
        if (value && value !== '') {
          params.set(key, String(value));
        }
      });

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    } catch (error) {
      console.error('Failed to apply filters:', error);
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
        setAllPlayers((prev) => [...prev, ...newPlayers]);
        setCurrentOffset(newOffset);

        setTeamList(response.data.teams || []);
        setGroupList(response.data.groups || []);

        // Check if there are more players
        setHasMorePlayers(newPlayers.length === (appliedFilter.limit || DEFAULT_FILTER_STATE.limit!));
      } else {
        setHasMorePlayers(false);
      }
    } catch (error) {
      console.error('Failed to load more players:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMorePlayers, isLoadingMore, currentOffset, appliedFilter, executeSearchQuery]);

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
      console.error('Failed to clear filters:', error);
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

      const matchesDivision = !appliedFilter.division || player.division === appliedFilter.division;

      return matchesSearch && matchesDivision;
    });
  }, [allPlayers, appliedFilter.search, appliedFilter.division]);

  // Update local filter
  const updateLocalFilter = useCallback((key: string, value: string) => {
    setLocalFilter((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Initialize with preloaded data
  useEffect(() => {
    if (initialData?.searchPlayers) {
      transformServerData(initialData.searchPlayers.data);
    }
  }, [initialData, transformServerData]);

  // UI state computations
  const hasActiveFilters = useMemo(() => Object.entries(appliedFilter).some(([key, value]) => value !== '' && key !== 'limit' && key !== 'offset'), [appliedFilter]);

  const hasUnsavedChanges = useMemo(
    () =>
      JSON.stringify({
        search: localFilter.search,
        division: localFilter.division,
        group: localFilter.group,
      }) !==
      JSON.stringify({
        search: appliedFilter.search,
        division: appliedFilter.division,
        group: appliedFilter.group,
      }),
    [localFilter, appliedFilter],
  );

  const displayedPlayers = useMemo(
    () => allPlayers.slice(0, currentOffset + (appliedFilter.limit || DEFAULT_FILTER_STATE.limit!) + LOAD_MORE_INCREMENT),
    [allPlayers, currentOffset, appliedFilter.limit],
  );



  return (
    <div className="animate-fade-in">
      <div className="navigation my-8">
        <EventNavigation event={event} />
      </div>

      {/* Filters */}
      <FilterContent
        eventId={event?._id || ''}
        filterPage={EFilterPage.PLAYERS}
        groups={groupList}
        divisions={event?.divisions ?? ''}
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
        <div className="mb-4 p-4 bg-gray-900 border border-gray-700 rounded-xl shadow-md">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400 font-medium">Active Filters:</span>

              {/* Render filter tags */}
              {appliedFilter.division && <span className="px-3 py-1 bg-gray-800 text-yellow-300 text-xs rounded-full border border-gray-700 shadow-sm">Division: {appliedFilter.division}</span>}

              {appliedFilter.group &&
                (() => {
                  const group = groupList.find((g) => g._id === appliedFilter.group);
                  return group && <span className="px-3 py-1 bg-gray-800 text-yellow-300 text-xs rounded-full border border-gray-700 shadow-sm">Group: {group.name}</span>;
                })()}

              {appliedFilter.search && <span className="px-3 py-1 bg-gray-800 text-yellow-300 text-xs rounded-full border border-gray-700 shadow-sm">Search: {appliedFilter.search}</span>}

              {/* If no filters */}
              {!appliedFilter.division && !appliedFilter.group && !appliedFilter.search && <span className="text-xs text-gray-500 italic">No active filters</span>}
            </div>

            <button onClick={handleClearFilters} disabled={isApplyingFilters} className="btn-danger">
              Clear All
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
          <PlayerSearchList playerList={displayedPlayers} teamList={teamList} eventId={event?._id || ""} />
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
      {!isApplyingFilters && displayedPlayers.length === 0 && <div className="text-center py-8 text-gray-400 animate-fade-in">No players found matching your criteria.</div>}

      {/* End of results */}
      {!hasMorePlayers && displayedPlayers.length > 0 && <div className="text-center py-4 text-gray-500 text-sm">No more players to load.</div>}
    </div>
  );
}
