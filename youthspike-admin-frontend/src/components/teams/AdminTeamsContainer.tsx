'use client'

import { EFilterPage, IEvent, IEventRelatives, IGetTeamsResponse, IGroup, IPlayer, ISearchFilter, ISearchTeamResponse, ITeam, ITeamFilter } from '@/types';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import TeamTable from './TeamTable';
import { notFound, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GET_TEAMS_MIN, SEARCH_TEAM_LIST_LIGHT } from '@/graphql/teams';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';
import Image from 'next/image';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import { divisionsOfEvents, divisionsToOptionList } from '@/utils/helper';
import FilterContent from '../event/FilterContent';
import ActiveFiltersBar from '../event/ActiveFiltersBar';

const PAGE_SIZE = 30;


const DEFAULT_FILTER_STATE: ITeamFilter = {
  search: '',
  division: '',
  group: '',
};

interface ITeamsContainerProps {
  queryRef: QueryRef<{ searchTeams: ISearchTeamResponse }>;
  initialSearchParams: Partial<ISearchFilter>;
}

function TeamsContainer({ queryRef, initialSearchParams }: ITeamsContainerProps) {
  const { data: initialData } = useReadQuery(queryRef);


  if (!initialData?.searchTeams?.data?.events || initialData?.searchTeams?.data?.events?.length === 0) {
    const error = new Error(`${initialData?.searchTeams?.message || "There is an error fetching Event!"}`);
    error.name = "No event found!";
    throw error;
  }


  const apolloClient = useApolloClient();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();

  // Filter states
  const [localFilter, setLocalFilter] = useState<ITeamFilter>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });

  const [appliedFilter, setAppliedFilter] = useState<ITeamFilter>(localFilter);

  const isInitial = useRef<boolean>(true);
  // Server data state
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [playerMap, setPlayerMap] = useState<Map<string, IPlayer>>(new Map());

  // Loading states
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const importerEl = useRef<HTMLDialogElement | null>(null);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: ITeamFilter, offset: number = 0) => ({
      eventIds: [],
      filter: {
        limit: PAGE_SIZE,
        offset,
        search: filter.search || undefined,
        division: filter.division || SessionStorageService.getItem(DIVISION) || undefined,
        group: filter.group || undefined,
      },
    }),
    [],
  );

  // Update all server data from response
  const updateAllData = useCallback((responseData: { searchTeams: ISearchTeamResponse }) => {
    const searchData = responseData?.searchTeams?.data;
    if (!searchData) return;

    setTeams(searchData.teams || []);
    setGroups(searchData.groups || []);
    const map = new Map<string, IPlayer>();
    for (let i = 0; i < (searchData.captains || []).length; i++) {
      const cap = searchData.captains[i];
      map.set(cap._id, cap);
    }
    setPlayerMap(map);
    setEvents(searchData.events || []);
    setHasMore((searchData.teams || []).length === PAGE_SIZE);
  }, []);

  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: ITeamFilter, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_TEAM_LIST_LIGHT,
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


  // const selectedEvent = useMemo(()=> {return events.find((e)=> e._id === eventId)}, [events, eventId]);
  const divisions = useMemo(() => divisionsOfEvents(events), [events]);
  // const divivionList = useMemo(() => divisionsToOptionList(divisions), [divisions]);



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
    <div className="min-h-screen">
      <div className="w-full border-b border-yellow-logo">
        <div className='mx-auto max-w-5xl px-4 py-10 md:px-12'>
          <div className="flex justify-start items-center gap-x-2">
            {/* <p className="mb-1 font-mono text-xs uppercase tracking-[0.25em] text-yellow-logo">
              Admin Dashboard
            </p> */}
            <h1 className="text-5xl font-black tracking-tight md:text-6xl">
              <span className="text-yellow-logo uppercase">Teams</span>
            </h1>
            {/* <p className="mt-2 text-sm text-gray-400">
              {teams.length} team{teams.length !== 1 ? 's' : ''} loaded
            </p> */}
          </div>
          <FilterContent
            filterPage={EFilterPage.TEAMS}
            groups={groups}
            divisions={divisions}
            loading={isApplyingFilters}
            filter={localFilter}
            updateFilter={updateLocalFilter}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
            hasUnsavedChanges={hasUnsavedChanges}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>
      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-12">




        {/* Active filters indicator */}
        {hasActiveFilters && (
          <ActiveFiltersBar appliedFilter={appliedFilter} groups={groups} isApplyingFilters={isApplyingFilters} onClearFilters={handleClearFilters} />
        )}


        {/* card wrapper with golden border accent */}
        <div className="relative shadow-2xl ring-1 ring-yellow-400/10 bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700
        ">
          {/* top accent bar */}
          <div className="h-px w-full rounded-t-2xl bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />

          <div className="overflow-hidden rounded-2xl">
            <TeamTable teams={teams} events={events as IEventRelatives[]} />
          </div>
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
    </div>
  );

}

export default TeamsContainer;