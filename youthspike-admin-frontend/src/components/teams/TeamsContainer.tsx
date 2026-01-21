'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { ITeam, IRoundRelatives, ISearchFilter, IGroup, INetRelatives, ISearchTeamResponse, ITeamFilter, IMatch, IEvent, EFilterPage } from '@/types';
import FilterContent from '../event/FilterContent';
import { SEARCH_TEAMS } from '@/graphql/teams';
import SearchTeamList from './SearchTeamList';
import EventNavigation from '../layout/EventNavigation';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import MultiPlayerAddDialog from './MultiPlayerAddDialog';
import { divisionsToOptionList } from '@/utils/helper';

interface ITeamsContainerProps {
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

export default function TeamsContainer({ queryRef, eventId, initialSearchParams }: ITeamsContainerProps) {
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
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const importerEl = useRef<HTMLDialogElement | null>(null);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: ITeamFilter, offset: number = 0) => ({
      eventId,
      filter: {
        limit: PAGE_SIZE,
        offset,
        search: filter.search || undefined,
        division: filter.division || SessionStorageService.getItem(DIVISION) || undefined,
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

  const divivionList = useMemo(() => {
    return event?.divisions ? divisionsToOptionList(event?.divisions) : [];
  }, [event?.divisions]);

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

  const groupMap = useMemo(() => {
    const map = new Map<string, IGroup>();
    for (const group of groups) {
      map.set(group._id, group);
    }
    return map;
  }, [groups])

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

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          importerEl.current?.showModal();
        }}
        className="btn-info text-center"
      >
        Import Teams
      </button>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-gray-800 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">
              Active filters: {Object.entries(appliedFilter)
                .filter(([key, value]) => key !== 'group' && value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
              {appliedFilter?.group && groupMap.has(appliedFilter?.group) && <span>{groupMap.get(appliedFilter?.group)?.name}</span>}
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
          <span className="ml-2 text-gray-300">Loading teams...</span>
        </div>
      )}

      {/* Content */}
      {!showInitialLoading && (
        <div className="team-list w-full flex flex-col gap-y-4">
          <div className="grid gap-4">
            {teams.length > 0 ? (
              <SearchTeamList teamList={teams as unknown as ITeam[]} groupList={groups} event={event} />
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

      <MultiPlayerAddDialog divisionList={divivionList} eventId={eventId} importerEl={importerEl} setIsLoading={() => { }} />
    </div>
  );
}
