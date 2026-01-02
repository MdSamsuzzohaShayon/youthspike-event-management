'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SEARCH_MATCHES } from '@/graphql/matches';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IMatch, IRoundRelatives, ISearchFilter, ISearchMatchResponse, ITeam, IGroup, INetRelatives, IEvent, EFilterPage } from '@/types';
import FilterContent from '../event/FilterContent';
import SearchMatchList from './SearchMatchList';
import EventNavigation from '../layout/EventNavigation';

interface MatchesMainProps {
  queryRef: QueryRef<{ searchMatches: ISearchMatchResponse }>;
  eventId: string;
  initialSearchParams: Partial<ISearchFilter>;
}

interface FilterState {
  search: string;
  division: string;
  group: string;
  status: string;
}

const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  division: '',
  group: '',
  status: '',
};

const PAGE_SIZE = 30;

export default function MatchesMain({ queryRef, eventId, initialSearchParams }: MatchesMainProps) {
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
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [nets, setNets] = useState<INetRelatives[]>([]);
  const [rounds, setRounds] = useState<IRoundRelatives[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);

  // Loading states
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: FilterState, offset: number = 0) => ({
      eventId,
      filter: {
        limit: PAGE_SIZE,
        offset,
        search: filter.search || undefined,
        division: filter.division || undefined,
        group: filter.group || undefined,
        status: filter.status || undefined,
      },
    }),
    [eventId],
  );

  // Update all server data from response
  const updateAllData = useCallback((responseData: { searchMatches: ISearchMatchResponse }) => {
    const searchData = responseData?.searchMatches?.data;
    if (!searchData) return;

    setMatches(searchData.matches || []);
    setTeams(searchData.teams || []);
    setNets(searchData.nets || []);
    setRounds(searchData.rounds || []);
    setGroups(searchData.groups || []);
    setEvent(searchData.event || null);
    setHasMore((searchData.matches || []).length === PAGE_SIZE);
  }, []);

  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: FilterState, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_MATCHES,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: 'network-only',
        });
        return result.data as { searchMatches: ISearchMatchResponse };
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables],
  );

  // Apply filters
  const handleApplyFilters = useCallback(async () => {
    setIsApplyingFilters(true);

    try {
      const responseData = await executeSearchQuery(localFilter);
      updateAllData(responseData);
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
      console.error('Failed to apply filters:', error);
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
      updateAllData(responseData);
      setAppliedFilter(clearedFilter);
      router.replace(window.location.pathname, { scroll: false });
    } catch (error) {
      console.error('Failed to clear filters:', error);
    }
  }, [executeSearchQuery, updateAllData, router]);

  // Load more matches
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);

    try {
      const offset = matches.length;
      const responseData = await executeSearchQuery(appliedFilter, offset);
      const searchData = responseData?.searchMatches?.data;

      if (searchData) {
        // Append new matches to existing ones
        const newMatches = searchData.matches || [];
        if (newMatches.length > 0) {
          setMatches((prev) => [...prev, ...newMatches]);
          setHasMore(newMatches.length === PAGE_SIZE);
        } else {
          setHasMore(false);
        }

        // Update other entities with the latest data from server
        // This ensures all related data is in sync
        setTeams((prev) => [...prev, ...(searchData.teams || [])]);
        setNets((prev) => [...prev, ...(searchData.nets || [])]);
        setRounds((prev) => [...prev, ...(searchData.rounds || [])]);
      }
    } catch (error) {
      console.error('Failed to load more matches:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [matches.length, appliedFilter, executeSearchQuery]);

  // Initialize with preloaded data
  useEffect(() => {
    if (initialData && matches.length === 0) {
      updateAllData(initialData);
    }
  }, [initialData, matches.length, updateAllData]);

  // Optimized data lookups
  const teamById = useMemo(() => new Map(teams.map((team) => [team._id, team])), [teams]);

  const roundsByMatchId = useMemo(() => {
    const map = new Map<string, IRoundRelatives[]>();
    rounds.forEach((round) => {
      if (round?.match) {
        const existingRounds = map.get(round.match) || [];
        map.set(round.match, [...existingRounds, round]);
      }
    });
    return map;
  }, [rounds]);

  const normalizedNets = useMemo(
    () =>
      nets.map((net) => ({
        ...net,
        round: (net as any)?.round?._id ?? (net as any)?.round,
      })),
    [nets],
  );

  // Enrich matches with related data
  const enrichedMatches = useMemo(() => {
    return matches.map((match) => {
      const matchRounds = roundsByMatchId.get(match._id) || [];
      const matchNets = normalizedNets.filter((net) => net.round && matchRounds.some((round) => round._id === net.round));

      const teamA = typeof match.teamA === 'string' ? teamById.get(match.teamA) : match.teamA;

      const teamB = typeof match.teamB === 'string' ? teamById.get(match.teamB) : match.teamB;

      return {
        ...match,
        teamA: teamA as ITeam,
        teamB: teamB as ITeam,
        rounds: matchRounds,
        nets: matchNets,
      };
    });
  }, [matches, teamById, roundsByMatchId, normalizedNets]);

  // Update local filter
  const updateLocalFilter = (key: string, value: string) => {
    setLocalFilter((prev) => ({ ...prev, [key]: value }));
  };

  // UI state computations
  const hasActiveFilters = Object.values(appliedFilter).some((value) => value !== '');
  const hasUnsavedChanges = JSON.stringify(localFilter) !== JSON.stringify(appliedFilter);
  const isLoading = isApplyingFilters || isLoadingMore;
  const showInitialLoading = isApplyingFilters && matches.length === 0;

  return (
    <div className="animate-fade-in">
      <div className="navigation my-8">
        <EventNavigation event={event} />
      </div>
      <FilterContent
        eventId={eventId}
        groups={groups}
        divisions={event?.divisions ?? ''}
        loading={isApplyingFilters}
        filter={localFilter}
        updateFilter={updateLocalFilter}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        hasUnsavedChanges={hasUnsavedChanges}
        hasActiveFilters={hasActiveFilters}
        filterPage={EFilterPage.MATCHES}
        showStatus
      />

      

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-gray-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">
              Active filters:{' '}
              {Object.entries(appliedFilter)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </span>
            <button onClick={handleClearFilters} className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {showInitialLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-gray-300">Loading matches...</span>
        </div>
      )}

      {/* Content */}
      {!showInitialLoading && (
        <div className="match-list w-full flex flex-col gap-y-4">
          <div className="grid gap-4">
            {enrichedMatches.length > 0 ? (
              <SearchMatchList eventId={eventId} matchList={enrichedMatches as unknown as IMatch[]} />
            ) : (
              <div className="text-center py-8 text-gray-400">No matches found matching your criteria.</div>
            )}
          </div>

          {/* Load more button */}
          {hasMore && matches.length > 0 && (
            <div className="w-full mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="flex items-center px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:bg-yellow-500 disabled:opacity-50 transition-colors"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Matches'
                )}
              </button>
            </div>
          )}

          {/* No more matches indicator */}
          {!hasMore && matches.length > 0 && <div className="text-center py-4 text-gray-400 text-sm">No more matches to load</div>}
        </div>
      )}
    </div>
  );
}
