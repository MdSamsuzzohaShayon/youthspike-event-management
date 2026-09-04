'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SEARCH_MATCHES } from '@/graphql/matches';
import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { IMatch, IRoundRelatives, ISearchFilter, ISearchMatchResponse, ITeam, IGroup, INetRelatives, IEvent, EFilterPage, IFilterState } from '@/types';
import FilterContent from '../event/FilterContent';
import SearchMatchList from './SearchMatchList';
import EventNavigation from '../layout/EventNavigation';
import ActiveFiltersBar from '../event/ActiveFiltersBar';

interface MatchesMainContainerProps {
  queryRef: QueryRef<{ searchMatches: ISearchMatchResponse }>;
  initialSearchParams: Partial<ISearchFilter>;
  eventId?: string;
}



const DEFAULT_FILTER_STATE: IFilterState = {
  search: '',
  division: '',
  group: '',
  status: '',
};

const PAGE_SIZE = 30;

export default function MatchesMainContainer({ queryRef, eventId, initialSearchParams }: MatchesMainContainerProps) {
  const router = useRouter();
  const { data: initialData } = useReadQuery(queryRef);


  const apolloClient = useApolloClient();




  const [appliedFilter, setAppliedFilter] = useState<IFilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialSearchParams,
  });

  // Server data state
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [nets, setNets] = useState<INetRelatives[]>([]);
  const [rounds, setRounds] = useState<IRoundRelatives[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [event, setEvent] = useState<IEvent | null>(null);
  const searchRequestIdRef = useRef<number>(0);

  // Loading states
  const [isApplyingFilters, setIsApplyingFilters] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const [hasMoreMatches, setHasMoreMatches] = useState<boolean>(true);

  // Build query variables
  const buildQueryVariables = useCallback(
    (filter: IFilterState, offset: number = 0) => ({
      ...(eventId ? { eventId } : {}),
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



  // Execute GraphQL query
  const executeSearchQuery = useCallback(
    async (filter: IFilterState, offset: number = 0) => {
      try {
        const result = await apolloClient.query({
          query: SEARCH_MATCHES,
          variables: buildQueryVariables(filter, offset),
          fetchPolicy: 'network-only',
        });
        return (result.data as { searchMatches: ISearchMatchResponse })
          .searchMatches;
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        throw error;
      }
    },
    [apolloClient, buildQueryVariables],
  );

  const transformServerData = useCallback(
    (searchData: ISearchMatchResponse["data"]) => {
      if (!searchData) return;

      setMatches(searchData?.matches || []);
      setTeams(searchData?.teams || {});
      setNets(searchData?.nets || []);
      setRounds(searchData?.rounds || []);
      setGroups(searchData?.groups || []);
      setEvent(searchData?.event || null);

      setHasMoreMatches(
        searchData.matches.length ===
        PAGE_SIZE
      );
    },
    []
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

  // Load more matches
  const handleLoadMore = useCallback(async () => {
    if (!hasMoreMatches || isLoadingMore) return;

    setIsLoadingMore(true);
    const newOffset =
      currentOffset + PAGE_SIZE;

    try {
      const response = await executeSearchQuery(appliedFilter, newOffset);
      const newMatches = response.data.matches || [];

      if (newMatches.length > 0) {
        setMatches((prev) => [...prev, ...newMatches]);
        setCurrentOffset(newOffset);


        setTeams(response.data.teams || []);

        // Check if there are more matches
        setHasMoreMatches(
          newMatches.length ===
          PAGE_SIZE
        );
      } else {
        setHasMoreMatches(false);
      }
    } catch (error) {
      console.error("Failed to load more matches:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    hasMoreMatches,
    isLoadingMore,
    currentOffset,
    appliedFilter,
    executeSearchQuery,
  ]);

    // Initialize with preloaded data
    useEffect(() => {
      if (initialData?.searchMatches) {
        transformServerData(initialData.searchMatches.data);
      }
    }, [initialData, transformServerData]);



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


  // UI state computations
  const hasActiveFilters = Object.values(appliedFilter).some((value) => value !== '');
  const isLoading = isApplyingFilters || isLoadingMore;
  const showInitialLoading = isApplyingFilters && matches.length === 0;



  return (
    <div className="animate-fade-in">
      <div className="navigation my-8">
        <EventNavigation event={event} />
      </div>
      <FilterContent
        groups={groups}
        divisions={event?.divisions ?? ''}
        loading={isApplyingFilters}
        filter={appliedFilter}
        onApplyFilters={handleFilterApply}
        filterPage={EFilterPage.MATCHES}
        showStatus
        eventId={eventId}
      />



      {/* Active filters indicator */}
      {hasActiveFilters && (
        <ActiveFiltersBar appliedFilter={appliedFilter} groups={groups} isApplyingFilters={isApplyingFilters} onClearFilters={handleClearFilters} />
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
          {hasMoreMatches && matches.length > 0 && (
            <div className="w-full mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="flex items-center btn-info"
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
          {!hasMoreMatches && matches.length > 0 && <div className="text-center py-4 text-gray-400 text-sm">No more matches to load</div>}
        </div>
      )}
    </div>
  );
}
