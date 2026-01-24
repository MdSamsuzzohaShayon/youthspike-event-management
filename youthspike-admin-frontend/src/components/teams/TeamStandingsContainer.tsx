'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { ITeam, IRoundRelatives, ISearchFilter, IGroup, INetRelatives, ISearchTeamResponse, ITeamFilter, IMatch, IEvent, EFilterPage } from '@/types';
import FilterContent from '../event/FilterContent';
import { SEARCH_TEAMS } from '@/graphql/teams';
import TeamStandings from './TeamStandings';
import EventNavigation from '../layout/EventNavigation';
import ActiveFiltersBar from '../event/ActiveFiltersBar';

interface ITeamStandingsContainerProps {
  queryRef: QueryRef<{ searchTeams: ISearchTeamResponse }>;
  eventId: string;
  initialSearchParams: Partial<ISearchFilter>;
}

const DEFAULT_FILTER_STATE: ITeamFilter = {
  search: '',
  division: '',
  group: '',
};

const PAGE_SIZE = 30;

export default function TeamStandingsContainer({ queryRef, eventId, initialSearchParams }: ITeamStandingsContainerProps) {
  const isInitial = useRef<boolean>(true);
  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);
  const apolloClient = useApolloClient();

  // Filter states
  const [localFilter, setLocalFilter] = useState<ITeamFilter>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });

  const [appliedFilter, setAppliedFilter] = useState<ITeamFilter>(localFilter);

  // Server data state
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [nets, setNets] = useState<INetRelatives[]>([]);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [rounds, setRounds] = useState<IRoundRelatives[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);

  // Loading states
  const [hasMore, setHasMore] = useState(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: ITeamFilter, offset: number = 0) => ({
      eventId,
      filter: {
        limit: PAGE_SIZE,
        offset,
        search: filter.search || undefined,
        division: filter.division || undefined,
        group: filter.group || undefined,
      },
    }),
    [eventId],
  );

  // Update all server data from response
  const updateAllData = useCallback((responseData: { searchTeams: ISearchTeamResponse }) => {
    const searchData = responseData?.searchTeams?.data;
    if (!searchData) return;

    setTeams(searchData.teams || []);
    setNets(searchData.nets || []);
    setMatches(searchData.matches || []);
    setRounds(searchData.rounds || []);
    setGroups(searchData.groups || []);
    setEvent(searchData.event || null);
    setHasMore((searchData.teams || []).length === PAGE_SIZE);
  }, []);

  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: ITeamFilter, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_TEAMS,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: 'network-only',
        });
        return result.data as { searchTeams: ISearchTeamResponse };
      } catch (error) {
        console.error('Failed to fetch teams:', error);
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

  // Load more teams
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);

    try {
      const offset = teams.length;
      const responseData = await executeSearchQuery(appliedFilter, offset);
      const newTeams = responseData?.searchTeams?.data?.teams || [];

      if (newTeams.length > 0) {
        setTeams((prev) => [...prev, ...newTeams]);
        setHasMore(newTeams.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more teams:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [teams.length, appliedFilter, executeSearchQuery]);

  // Initialize with preloaded data
  useEffect(() => {
    if (isInitial.current && initialData) {
      updateAllData(initialData);
      isInitial.current = false;
    }
  }, [initialData, updateAllData]);

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

  const netsByMatchId = useMemo(() => {
    const map = new Map<string, INetRelatives[]>();
    nets.forEach((n) => {
      if (n?.match) {
        const existingNets = map.get(n.match) || [];
        map.set(n.match, [...existingNets, n]);
      }
    });
    return map;
  }, [nets]);

  // Optimized data lookups
  const matchesByTeamId = useMemo(() => {
    const matchList = matches.map((m) => ({
      ...m,
      rounds: roundsByMatchId.get(m._id) || [],
      nets: netsByMatchId.get(m._id) || [],
    }));

    const map = new Map<string, IMatch[]>();
    matchList.forEach((m) => {
      if (m.teamA) {
        const existingMatches = map.get(String(m.teamA)) || [];
        map.set(String(m.teamA), [...existingMatches, m as unknown as IMatch]);
      }
      if (m.teamB) {
        const existingMatches = map.get(String(m.teamB)) || [];
        map.set(String(m.teamB), [...existingMatches, m as unknown as IMatch]);
      }
    });
    return map;
  }, [matches, roundsByMatchId, netsByMatchId]);

  // Update local filter
  const updateLocalFilter = (key: string, value: string) => {
    setLocalFilter((prev) => ({ ...prev, [key]: value }));
  };

  // UI state computations
  const hasActiveFilters = Object.values(appliedFilter).some((value) => value !== '');
  const hasUnsavedChanges = JSON.stringify(localFilter) !== JSON.stringify(appliedFilter);
  const isLoading = isApplyingFilters || isLoadingMore;
  const showInitialLoading = isApplyingFilters && teams.length === 0;

  return (
    <div className="animate-fade-in">
      <div className="navigation my-8">
        <EventNavigation event={event} />
      </div>

      <FilterContent
        eventId={eventId}
        filterPage={EFilterPage.TEAMS}
        groups={groups}
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
        <ActiveFiltersBar appliedFilter={appliedFilter} groups={groups} isApplyingFilters={isApplyingFilters} onClearFilters={handleClearFilters} />
      )}

      {/* Loading state */}
      {showInitialLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-gray-300">Loading teams...</span>
        </div>
      )}

      {/* Content */}
      {!showInitialLoading && (
        <div className="team-list w-full flex flex-col gap-y-4">
          <div className="grid gap-4">
            {teams.length > 0 ? (
              <TeamStandings matchList={matches} selectedGroup={appliedFilter?.group} teamList={teams as unknown as ITeam[]} nets={nets} rounds={rounds} />
            ) : (
              <div className="text-center py-8 text-gray-400">No teams found teaming your criteria.</div>
            )}
          </div>

          {/* Load more button */}
          {hasMore && teams.length > 0 && (
            <div className="w-full mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="btn-info"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Teams'
                )}
              </button>
            </div>
          )}

          {/* No more teams indicator */}
          {!hasMore && teams.length > 0 && <div className="text-center py-4 text-gray-400 text-sm">No more teams to load</div>}
        </div>
      )}
    </div>
  );
}
