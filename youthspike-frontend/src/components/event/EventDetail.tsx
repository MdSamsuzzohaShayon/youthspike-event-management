"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/lib/UserProvider";
import { useAppDispatch } from "@/redux/hooks";
import {
  EMatchStatus,
  IEventDetailProps,
  IMatch,
  IPlayer,
  IPlayerRankingExpRel,
  ITeam,
  ITeamCaptain,
} from "@/types";
import { EEventItem, IEventDetailData } from "@/types/event";
import {
  setRankingMap,
  setTeamsPlayerRanking,
} from "@/redux/slices/playerRankingSlice";
import { divisionsToOptionList } from "@/utils/helper";
import { EVENT_ITEM } from "@/utils/constant";
import { useDebounce } from "use-debounce";
import { motion, AnimatePresence } from "framer-motion";
import EventSponsors from "./EventSponsors";
import EventHeader from "./EventHeader";
import EventFilter from "./EventFilter";
import EventNavigationTabs from "./EventNavigationTabs";
import { useQuery, useReadQuery } from "@apollo/client/react";
import { GET_AN_EVENT } from "@/graphql/event";
import Loader from "../elements/Loader";
import { containerVariants, fadeIn, fadeInUp } from "@/utils/animation";
import EventContent from "./EventContent";
import { getMatchStatus } from "@/utils/match/getMatchStatus";
import { createNetMapByMatch, createRoundMapByMatch } from "@/utils/match/mapByMatch";

// Sub-components

function EventDetail({ queryRef, eventId }: IEventDetailProps) {
  // Hooks
  const { data: lightData, error: lightError } = useReadQuery(queryRef);
  const dispatch = useAppDispatch();
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Background query: full data (no filter)
  const { data: heavyData } = useQuery(GET_AN_EVENT, {
    variables: { eventId, filter: {} },
    fetchPolicy: "network-only", // always refetch fresh
  });

  // Memoize search params access
  const searchParamsString = searchParams.toString();

  // Memoization
  const initialSelectedItem = useMemo(() => {
    const item = searchParams.get(EVENT_ITEM);
    return item && Object.values(EEventItem).includes(item as EEventItem)
      ? (item as EEventItem)
      : EEventItem.MATCH;
  }, [searchParamsString]);

  const initialDivision = useMemo(
    () => searchParams.get("division"),
    [searchParamsString]
  );
  const initialSearch = useMemo(
    () => searchParams.get("search"),
    [searchParamsString]
  );
  const initialGroup = useMemo(
    () => searchParams.get("group"),
    [searchParamsString]
  );

  const [selectedItem, setSelectedItem] =
    useState<EEventItem>(initialSelectedItem);
  const [currDivision, setCurrDivision] = useState<string | null>(
    initialDivision
  );
  const [search, setSearch] = useState<string | null>(initialSearch);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    initialGroup
  );

  // Debounce search to avoid too many URL updates
  const [debouncedSearch] = useDebounce(search, 300);

  // Function to update query params
  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParamsString);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const newParams = params.toString();
      if (newParams !== searchParamsString) {
        router.replace(`${pathname}?${newParams}`, { scroll: false });
      }
    },
    [searchParamsString, router, pathname]
  );

  // Update URL when filters change
  useEffect(() => {
    updateQueryParams({
      [EVENT_ITEM]: selectedItem,
      division: currDivision,
      search: debouncedSearch,
      group: selectedGroup,
    });
  }, [
    selectedItem,
    currDivision,
    debouncedSearch,
    selectedGroup,
    updateQueryParams,
  ]);

  // ✅ Safely extract data
  const eventData: IEventDetailData | null =
    (heavyData as any)?.getEventDetails?.data ||
    (lightData as any)?.getEventDetails?.data ||
    null;

  console.log("Event data ==============");
  console.log(eventData);
  

  if (!eventData) {
    const error = new Error(
      "The requested event might not exist or has been removed."
    );
    error.name = "No event data found";
    throw error;
  }

  const {
    event,
    matches,
    teams,
    players,
    ldo,
    nets,
    rounds,
    groups,
    sponsors,
    statsOfPlayer,
  } = eventData;

  

  // Precompute teamMap once
  const teamMap = useMemo(
    () => new Map<string, ITeam>(teams.map((t) => [t._id, t])),
    [teams]
  );

  // Memoize sorted players with stable sorting
  const sortedPlayers = useMemo(() => {
    const playersCopy = [...players];
    return playersCopy.sort((a, b) => {
      const aName = `${a.firstName} ${a.lastName}`;
      const bName = `${b.firstName} ${b.lastName}`;
      return aName.localeCompare(bName);
    });
  }, [players]);

  // Memoize division list
  const divisionList = useMemo(
    () => divisionsToOptionList(event.divisions || ""),
    [event.divisions]
  );

  // Memoize filtered group list
  const groupList = useMemo(() => {
    if (!currDivision) return groups || [];

    const divisionLower = currDivision.trim().toLowerCase();
    return (groups || []).filter(
      (group) => group.division?.trim().toLowerCase() === divisionLower
    );
  }, [groups, currDivision]);

  // Memoize player stats map
  const playerStatsMap = useMemo(
    () => new Map(statsOfPlayer.map((ps) => [ps.playerId, ps.stats])),
    [statsOfPlayer]
  );

  // Map of matchId => IRoundRelatives[]
  const roundMapByMatch = useMemo(() => createRoundMapByMatch(rounds), [rounds]);
  const netMapByMatch = useMemo(() => createNetMapByMatch(nets), [nets]);

  // Optimize filtered data computation
  const filteredData: any = useMemo(() => {
    const searchLower = search?.toLowerCase() || "";
    const divisionLower = currDivision?.trim().toLowerCase();
    const hasSearch = searchLower.length > 0;
    const hasDivision = !!divisionLower;
    const hasGroup = !!selectedGroup;

    // Precompute group team IDs if needed
    const groupTeamIds = hasGroup
      ? new Set(
          teams
            .filter((t) => {
              const groupId =
                typeof t.group === "string" ? t.group : t.group?._id;
              return groupId === selectedGroup;
            })
            .map((t) => t._id)
        )
      : null;

    // Filter functions
    const filterByDivision = (item: { division?: string }) =>
      !hasDivision || item.division?.trim().toLowerCase() === divisionLower;

    const filterByGroupTeam = (team: ITeam) => {
      if (!hasGroup) return true;
      const groupId =
        typeof team.group === "string" ? team.group : team.group?._id;
      return groupId === selectedGroup;
    };

    const filterBySearchPlayer = (player: IPlayer) =>
      !hasSearch ||
      player.firstName.toLowerCase().includes(searchLower) ||
      player.lastName.toLowerCase().includes(searchLower);

    const filterBySearchTeam = (team: ITeam) =>
      !hasSearch || team.name.toLowerCase().includes(searchLower);

    const filterByGroupPlayer = (player: IPlayer) => {
      if (!hasGroup) return true;
      return player.teams?.some((teamId) => groupTeamIds?.has(String(teamId)));
    };

    // Filter teams
    const filteredTeams = teams.filter(
      (team) =>
        filterByDivision(team) &&
        filterByGroupTeam(team) &&
        filterBySearchTeam(team)
    );

    const filteredMatches: IMatch[] = [];

    for (let i = 0; i < matches.length; i++) {
      const match: IMatch = { ...matches[i] } as IMatch;

      // 1. Check division
      const matchDivision = match.division?.trim().toLowerCase();
      if (divisionLower && matchDivision !== divisionLower) continue;

      // 2. Check group
      const matchGroupId =
        typeof match.group === "string" ? match.group : match.group?._id;

      if (selectedGroup && matchGroupId !== selectedGroup) continue;

      // 3. Search match (if search term is present)
      const teamA = match.teamA ? teamMap.get(String(match.teamA)) : null;
      const teamB = match.teamB ? teamMap.get(String(match.teamB)) : null;
      if (searchLower) {
        const descriptionMatch = match.description
          ?.toLowerCase()
          .includes(searchLower);
        const teamAMatch = teamA?.name.toLowerCase().includes(searchLower);
        const teamBMatch = teamB?.name.toLowerCase().includes(searchLower);

        if (!descriptionMatch && !teamAMatch && !teamBMatch) {
          continue;
        }
      }

      match.teamA = teamA as ITeamCaptain;
      match.teamB = teamB as ITeamCaptain;
      // Set status of the match
      const roundsOfMatch = roundMapByMatch.get(match._id);
      const netsOfMatch = netMapByMatch.get(match._id);
      let status = getMatchStatus(
        match as IMatch,
        roundsOfMatch || [],
        netsOfMatch || []
      );
      match.status = status;

      filteredMatches.push(match);
    }

    filteredMatches.sort((a, b) => {
      // Define the order priority
      const statusOrder: Record<EMatchStatus, number> = {
        [EMatchStatus.LIVE]: 1,
        [EMatchStatus.ASSIGNING]: 2,
        [EMatchStatus.SCHEDULED]: 3,
        [EMatchStatus.UPCOMING]: 4,
        [EMatchStatus.COMPLETED]: 5,
      };

      // First, compare by status priority
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;

      // If same status, sort by date (latest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Filter players
    const filteredPlayers = sortedPlayers.filter(
      (player) =>
        filterByDivision(player) &&
        filterBySearchPlayer(player) &&
        filterByGroupPlayer(player)
    );

    return {
      teams: filteredTeams,
      matches: filteredMatches,
      players: filteredPlayers,
      matchesNoGroupFilter: matches,
      matchList: matches,
    };
  }, [
    teams,
    sortedPlayers,
    matches,
    teamMap,
    currDivision,
    selectedGroup,
    search,
    netMapByMatch,
    roundMapByMatch,
  ]);

  // Initialize rankings with optimized data structures
  const initializeLists = useCallback(() => {
    const rankingMap = new Map<string, number>();
    const teamsPlayerRanking: IPlayerRankingExpRel[] = [];

    for (const team of teams) {
      if (team?.playerRanking && !team.playerRanking.rankLock) {
        teamsPlayerRanking.push({
          ...team.playerRanking,
          team: {
            _id: team._id,
            name: team.name,
            division: team.division,
            // @ts-ignore
            event: event._id,
          },
        });

        if (team.playerRanking.rankings) {
          for (const ranking of team.playerRanking.rankings as any[]) {
            if (ranking.player?._id) {
              rankingMap.set(String(ranking.player._id), ranking.rank);
            }
          }
        }
      }
    }

    dispatch(setTeamsPlayerRanking(teamsPlayerRanking));
    dispatch(setRankingMap(Array.from(rankingMap.entries())));
  }, [dispatch, event._id, teams]);

  // Event handlers
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value || null);
    },
    []
  );

  const handleDivisionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCurrDivision(e.target.value || null);
      setSelectedGroup(null);
    },
    []
  );

  const handleGroupChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedGroup(e.target.value || null);
    },
    []
  );

  const handleItemSelect = useCallback((item: EEventItem) => {
    setSelectedItem(item);
  }, []);

  // Initialize once
  useEffect(() => {
    initializeLists();
  }, [initializeLists]);

  if (!eventData) {
    return <Loader />;
  }
  // Early return for empty data
  if (players.length === 0 && teams.length === 0 && matches.length === 0) {
    return (
      <div className="min-h-screen flex w-full justify-center items-center">
        <h3 className="text-center">
          No matches, teams, or players have been created yet!
        </h3>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-2 md:px-4 mb-6 md:mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <EventHeader event={event} />

      <EventSponsors sponsors={sponsors} userToken={user.token} />

      <EventNavigationTabs
        selectedItem={selectedItem}
        handleItemSelect={handleItemSelect}
        isMobile
      />

      <EventFilter
        search={search}
        handleSearchChange={handleSearchChange}
        currDivision={currDivision}
        handleDivisionChange={handleDivisionChange}
        selectedGroup={selectedGroup}
        handleGroupChange={handleGroupChange}
        divisionList={divisionList}
        groupList={groupList}
        isMobile
      />

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 md:mt-6">
        <EventNavigationTabs
          selectedItem={selectedItem}
          handleItemSelect={handleItemSelect}
        />

        <div className="block md:hidden">
          <EventFilter
            search={search}
            handleSearchChange={handleSearchChange}
            currDivision={currDivision}
            handleDivisionChange={handleDivisionChange}
            selectedGroup={selectedGroup}
            handleGroupChange={handleGroupChange}
            divisionList={divisionList}
            groupList={groupList}
          />
        </div>

        <motion.div
          className="content w-full lg:w-3/4 rounded-md bg-gray-800 p-3 md:p-4"
          variants={fadeIn}
          key={selectedItem}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedItem}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <EventContent
                filteredData={filteredData}
                nets={nets}
                playerStatsMap={playerStatsMap}
                rounds={rounds}
                selectedGroup={selectedGroup}
                selectedItem={selectedItem}
                teamMap={teamMap}
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default EventDetail;
