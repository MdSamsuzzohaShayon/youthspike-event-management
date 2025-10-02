// app/events/[eventId]/matches/MatchesMain.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useReadQuery } from "@apollo/client";
import { SEARCH_MATCHES } from "@/graphql/matches";
import { QueryRef } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import MatchList from "./MatchList";
import SearchMatchList from "./SearchMatchList";
import { EEventPeriod, INetRelatives, IRoundRelatives, ITeam } from "@/types";

interface MatchesMainProps {
  queryRef: QueryRef<{ searchMatches: any }>;
  eventId: string;
  initialSearchParams: {
    search: string;
    division: string;
    group: string;
    status: string;
  };
}

enum EMatchStatus {
  COMPLETED = "COMPLETED",
  IN_PROGRESS = "IN_PROGRESS",
  NOT_STARTED = "NOT_STARTED",
}

// Memoize static data outside component to prevent recreation
const FILTER_OPTIONS = [
  { id: 4, text: EMatchStatus.IN_PROGRESS },
  { id: 1, text: EEventPeriod.CURRENT },
  { id: 2, text: EEventPeriod.PAST },
  { id: 3, text: EMatchStatus.COMPLETED },
  { id: 5, text: EMatchStatus.NOT_STARTED },
];

const ALL_OPTION = { value: "", label: "All" };

export default function MatchesMain({
  queryRef,
  eventId,
  initialSearchParams,
}: MatchesMainProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: initialData } = useReadQuery(queryRef);

  // State optimizations
  const [search, setSearch] = useState(initialSearchParams.search);
  const [currDivision, setCurrDivision] = useState(initialSearchParams.division);
  const [selectedGroup, setSelectedGroup] = useState(initialSearchParams.group);
  const [matchStatus, setMatchStatus] = useState(initialSearchParams.status);
  const [offset, setOffset] = useState(0);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  // Debounce search to avoid too many requests
  const [debouncedSearch] = useDebounce(search, 500);

  // Memoized URL update handler
  const updateURL = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");

    if (currDivision) params.set("division", currDivision);
    else params.delete("division");

    if (selectedGroup) params.set("group", selectedGroup);
    else params.delete("group");

    if (matchStatus) params.set("status", matchStatus);
    else params.delete("status");

    router.replace(`/events/${eventId}/matches?${params.toString()}`, {
      scroll: false,
    });
  }, [debouncedSearch, currDivision, selectedGroup, matchStatus, eventId, router, searchParams]);

  // Optimized URL update effect
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Memoized filter variables for query
  const filterVariables = useMemo(() => ({
    eventId,
    filter: {
      limit: 30,
      offset: 0,
      search: debouncedSearch,
      division: currDivision,
      group: selectedGroup,
      status: matchStatus,
    },
  }), [eventId, debouncedSearch, currDivision, selectedGroup, matchStatus]);

  // Background query for filtered data
  const {
    data: filteredData,
    loading,
    refetch,
  } = useQuery(SEARCH_MATCHES, {
    variables: filterVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });

  // Optimized data update with batched state updates
  useEffect(() => {
    if (filteredData?.searchMatches?.data?.matches) {
      const newMatches = filteredData.searchMatches.data.matches;
      // Batch state updates to prevent unnecessary re-renders
      setAllMatches(newMatches);
      setHasMore(newMatches.length === 30);
      setOffset(0);
    }
  }, [filteredData]);

  // Memoized load more function
  const loadMore = useCallback(async () => {
    const newOffset = offset + 30;

    const { data } = await refetch({
      eventId,
      filter: {
        limit: 30,
        offset: newOffset,
        search: debouncedSearch,
        division: currDivision,
        group: selectedGroup,
        status: matchStatus,
      },
    });

    if (data?.searchMatches?.data?.matches) {
      const newMatches = data.searchMatches.data.matches;
      // Functional update to avoid dependency on allMatches
      setAllMatches(prev => {
        const updatedMatches = [...prev, ...newMatches];
        setHasMore(newMatches.length === 30);
        setOffset(newOffset);
        return updatedMatches;
      });
    }
  }, [eventId, debouncedSearch, currDivision, selectedGroup, matchStatus, offset, refetch]);

  // Extract data from initial or filtered response
  const responseData = useMemo(() => 
    filteredData?.searchMatches?.data || initialData?.searchMatches?.data,
    [filteredData, initialData]
  );

  // Memoized data extraction
  const {
    event,
    groups = [],
    teams = [],
    nets = [],
    rounds = [],
  } = responseData || {};

  // Optimized divisions computation
  const divisions = useMemo(() => {
    if (!event?.divisions) return [ALL_OPTION];
    
    const divisionArray = event.divisions.split(",").map((div: string) => ({
      value: div.trim(),
      label: div.trim(),
    }));
    
    return [ALL_OPTION, ...divisionArray];
  }, [event?.divisions]);

  // Optimized team map with proper typing
  const teamMap = useMemo(() => {
    return new Map(teams.map((t: ITeam) => [t._id, t]));
  }, [teams]);

  // ✅ Pre-index rounds by matchId for O(1) lookup
  const roundsByMatch = useMemo(() => {
    const map = new Map<string, IRoundRelatives[]>();
    for (const r of rounds) {
      if (!r?.match) continue;
      if (!map.has(r.match)) map.set(r.match, []);
      map.get(r.match)!.push(r);
    }
    return map;
  }, [rounds]);

  const normalizedNets = useMemo(() => {
    return (nets || []).map((n: any) => ({
      ...n,
      round: n?.round?._id || n?.round, // ensure round field is _id
    }));
  }, [nets]);
  
  // 3️⃣ Pre-index nets by roundId
  const netsByRound = useMemo(() => {
    const map = new Map<string, INetRelatives[]>();
    for (const n of normalizedNets) {
      if (!n?.round) continue;
      if (!map.has(n.round)) map.set(n.round, []);
      map.get(n.round)!.push(n);
    }
    return map;
  }, [normalizedNets]);
  

  // Optimized match list with enriched team data
  const matchList = useMemo(() => {
    return allMatches.map(match => {
      const matchRounds = roundsByMatch.get(match._id) || [];
      const roundsWithNets = matchRounds.map(round => ({
        ...round,
        nets: netsByRound.get(round._id) || [], // attach nets to round
      }));

      const matchNets = roundsWithNets.flatMap(r => r.nets);
  
      return {
        ...match,
        teamA: teamMap.get(match.teamA),
        teamB: teamMap.get(match.teamB),
        rounds: roundsWithNets,
        nets: matchNets
      };
    });
  }, [allMatches, teamMap, roundsByMatch, netsByRound]);

  

  // Optimized groups filtering
  const filteredGroups = useMemo(() => 
    currDivision 
      ? groups.filter((group: any) => group.division === currDivision)
      : groups,
    [groups, currDivision]
  );

  // Memoized event handlers to prevent recreating functions
  const handleDivisionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrDivision(e.target.value);
    setSelectedGroup("");
  }, []);

  const handleGroupChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroup(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setMatchStatus(e.target.value);
  }, []);

  // Memoized loading state
  const isLoading = loading && offset === 0;

  return (
    <div className="animate-fade-in">
      {/* Filters Section */}
      <div className="w-full bg-gray-800 rounded-md pt-4 mb-4 animate-slide-down">
        <div className="w-full">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="division"
                className="text-xs font-medium text-gray-300 capitalize"
              >
                Division
              </label>
              <select
                name="division"
                id="division"
                value={currDivision}
                onChange={handleDivisionChange}
                className="text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white transition-all duration-300"
                disabled={loading}
              >
                {divisions.map((div) => (
                  <option
                    key={div.value}
                    value={div.value}
                    className="capitalize bg-gray-800 text-white"
                  >
                    {div.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="group"
                className="text-xs font-medium text-gray-300 capitalize"
              >
                Group
              </label>
              <select
                name="group"
                id="group"
                value={selectedGroup}
                onChange={handleGroupChange}
                className="text-sm p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-white transition-all duration-300"
                disabled={loading}
              >
                <option value="" className="bg-gray-600 text-gray-300">
                  All
                </option>
                {filteredGroups.map((group: any) => (
                  <option
                    key={group._id}
                    value={group._id}
                    className="capitalize bg-gray-800 text-white"
                  >
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative mt-3">
            <input
              id="search"
              placeholder="Search matches..."
              value={search}
              onChange={handleSearchChange}
              className="w-full px-3 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm transition-all duration-300"
              type="text"
              disabled={loading}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-300">Loading matches...</span>
        </div>
      )}

      {/* Matches Content */}
      {!isLoading && (
        <div className="matchList w-full flex flex-col gap-y-4">
          {/* Match Status Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="matchStatus"
              className="text-sm font-medium text-gray-300 mb-1 capitalize"
            >
              Match Status
            </label>
            <select
              name="matchStatus"
              id="matchStatus"
              value={matchStatus}
              onChange={handleStatusChange}
              className="p-2 rounded-md bg-gray-800 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm text-white transition-all duration-300"
            >
              <option value="" className="bg-gray-600 text-gray-300">
                All Statuses
              </option>
              <option
                value="IN_PROGRESS"
                className="capitalize bg-gray-800 text-white"
              >
                IN PROGRESS
              </option>
              <option
                value="CURRENT"
                className="capitalize bg-gray-800 text-white"
              >
                CURRENT
              </option>
              <option
                value="PAST"
                className="capitalize bg-gray-800 text-white"
              >
                PAST
              </option>
              <option
                value="COMPLETED"
                className="capitalize bg-gray-800 text-white"
              >
                COMPLETED
              </option>
              <option
                value="NOT_STARTED"
                className="capitalize bg-gray-800 text-white"
              >
                NOT STARTED
              </option>
            </select>
          </div>

          {/* Matches Grid */}
          <div className="grid gap-4">
            {matchList.length > 0 ? (
              <SearchMatchList
                nets={nets}
                rounds={rounds}
                matchList={matchList}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                No matches found matching your criteria.
              </div>
            )}
          </div>

          {/* Load More Button */}
          {hasMore && allMatches.length > 0 && (
            <div className="w-full mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="flex items-center px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold transition-all duration-300 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading...
                  </>
                ) : (
                  "Load More Matches"
                )}
              </button>
            </div>
          )}

          {/* No more matches message */}
          {!hasMore && allMatches.length > 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              No more matches to load
            </div>
          )}
        </div>
      )}
    </div>
  );
}