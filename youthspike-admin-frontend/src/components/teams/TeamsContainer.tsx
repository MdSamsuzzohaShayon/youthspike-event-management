'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { ITeam, ISearchFilter, IGroup, ISearchTeamResponse, ITeamFilter, IEvent, EFilterPage, IPlayer, IEmailcontent, IBadge, EBadgeFor, IFilterState } from '@/types';
import FilterContent from '../event/FilterContent';
import { SEARCH_TEAM_LIST_LIGHT } from '@/graphql/teams';
import SearchTeamList from './SearchTeamList';
import EventNavigation from '../layout/EventNavigation';
import MultiPlayerAddDialog from './MultiPlayerAddDialog';
import { divisionsToOptionList } from '@/utils/helper';
import ActiveFiltersBar from '../event/ActiveFiltersBar';
import BadgeTable from '../badge/BadgeTable';

interface ITeamsContainerProps {
  queryRef: QueryRef<{ searchTeams: ISearchTeamResponse }>;
  initialSearchParams: Partial<ISearchFilter>;
  eventId?: string;
}

const DEFAULT_FILTER_STATE: Omit<IFilterState, 'status'> = {
  search: '',
  division: '',
  group: '',
};

const PAGE_SIZE = 30;

export default function TeamsContainer({ queryRef, eventId, initialSearchParams }: ITeamsContainerProps) {

  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);


  if (!initialData?.searchTeams?.data?.events || initialData?.searchTeams?.data?.events?.length === 0) {
    const error = new Error(`${initialData?.searchTeams?.message || "There is an error fetching Event!"}`);
    error.name = "No event found!";
    throw error;
  }


  const apolloClient = useApolloClient();


  const [appliedFilter, setAppliedFilter] = useState<Omit<IFilterState, 'status'>>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });

  // Server data state
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [playerMap, setPlayerMap] = useState<Map<string, IPlayer>>(new Map());
  const [emailcontents, setEmailcontents] = useState<IEmailcontent[]>([]);
  const [badges, setBadges] = useState<IBadge[]>([]);
  const searchRequestIdRef = useRef<number>(0);

  // Loading states
  const [hasMoreTeams, setHasMoreTeams] = useState<boolean>(true);
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const importerRef = useRef<HTMLDialogElement | null>(null);
  const [currentOffset, setCurrentOffset] = useState<number>(0);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: ITeamFilter, offset: number = 0) => ({
      eventIds: eventId ? [eventId] : [],
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



  const transformServerData = useCallback(
    (searchData: ISearchTeamResponse["data"]) => {
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
      setHasMoreTeams(
        searchData.teams.length ===
        PAGE_SIZE
      );
      setEmailcontents(searchData?.emailcontents || []);
      setBadges(searchData?.badges || []);

    },
    []
  );


  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: ITeamFilter, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_TEAM_LIST_LIGHT,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: 'network-only',
        });
        return (result.data as { searchTeams: ISearchTeamResponse })
          .searchTeams;
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables],
  );



  // Apply filters
  const handleFilterApply = async (
    filter: IFilterState
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



  // Clear filters
  const handleClearFilters = async () => {
    window.location.assign(window.location.pathname);
  };

  // Load more teams
  const handleLoadMore = useCallback(async () => {
    if (!hasMoreTeams || isLoadingMore) return;

    setIsLoadingMore(true);
    const newOffset =
      currentOffset + PAGE_SIZE;

    try {
      const response = await executeSearchQuery(appliedFilter, newOffset);
      const newTeams = response.data.teams || [];

      if (newTeams.length > 0) {
        setTeams((prev) => [...prev, ...newTeams]);
        setCurrentOffset(newOffset);


        setTeams(response.data.teams || []);

        // Check if there are more matches
        setHasMoreTeams(
          newTeams.length ===
          PAGE_SIZE
        );
      } else {
        setHasMoreTeams(false);
      }
    } catch (error) {
      console.error("Failed to load more matches:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasMoreTeams,
    isLoadingMore,
    currentOffset,
    appliedFilter,
    executeSearchQuery,
  ]);








  // Initialize with preloaded data
  useEffect(() => {
    if (initialData?.searchTeams) {
      transformServerData(initialData.searchTeams.data);
    }
  }, [initialData, transformServerData]);


  // Memoization
  const selectedEvent = useMemo(() => { return eventId ? events.find((e) => e._id === eventId) : null }, [events, eventId]);
  const divivionList = useMemo(() => selectedEvent ? divisionsToOptionList(selectedEvent?.divisions) : [], [selectedEvent]);
  const teamBadges = useMemo(() => badges.filter((badge) => badge.badgeFor === EBadgeFor.TEAM), [badges]);



  // UI state computations
  const hasActiveFilters = Object.values(appliedFilter).some((value) => value !== '');
  const isLoading = isApplyingFilters || isLoadingMore;
  const showInitialLoading = isApplyingFilters && teams.length === 0;


  return (
    <div className="animate-fade-in">
      <div className="navigation my-8">
        <EventNavigation event={selectedEvent || null} />
      </div>

      <FilterContent
        eventId={eventId}
        filterPage={EFilterPage.TEAMS}
        groups={groups}
        divisions={selectedEvent?.divisions || ''}
        loading={isApplyingFilters}
        filter={appliedFilter}
        onApplyFilters={handleFilterApply}
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          importerRef.current?.showModal();
        }}
        className="btn-info text-center"
      >
        Import Teams
      </button>

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
              <SearchTeamList
                teamList={teams as unknown as ITeam[]}
                groupList={groups}
                event={selectedEvent || null}
                captainMap={playerMap}
                emailcontents={emailcontents}
                badges={teamBadges}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">No teams found teaming your criteria.</div>
            )}
          </div>

          {/* Load more button */}
          {hasMoreTeams && teams.length > 0 && (
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
          {!hasMoreTeams && teams.length > 0 && <div className="text-center py-4 text-gray-400 text-sm">No more teams to load</div>}
        </div>
      )}

      <div className="w-full mt-6">
        <h2>Badges</h2>
        <BadgeTable badges={teamBadges} />
      </div>

      {eventId && <MultiPlayerAddDialog divisionList={divivionList} eventId={eventId} importerRef={importerRef} setIsLoading={() => { }} />}
    </div>
  );
}
