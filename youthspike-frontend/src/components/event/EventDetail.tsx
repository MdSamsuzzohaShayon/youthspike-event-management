"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/lib/UserProvider";
import { useAppDispatch } from "@/redux/hooks";
import {
  IEvent,
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
import { EVENT_ITEM, imgW, APP_NAME } from "@/utils/constant";

import { useLdoId } from "@/lib/LdoProvider";
import MatchList from "../match/MatchList";
import TeamList from "../team/TeamList";
import SelectInput from "../elements/SelectInput";
import PlayerStandings from "../player/PlayerStandings";
import { CldImage } from "next-cloudinary";
import { useDebounce } from "use-debounce";

interface IEventDetailProps {
  eventData: IEventDetailData;
}

function EventDetail({ eventData }: IEventDetailProps) {
  const { ldoIdUrl } = useLdoId();
  const dispatch = useAppDispatch();
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Memoize search params access
  const searchParamsString = searchParams.toString();
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

  if (!eventData) {
    return (
      <div className="min-h-screen flex w-full justify-center items-center">
        <h3 className="text-center">Loading...</h3>
      </div>
    );
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

  // Optimize filtered data computation
  const filteredData = useMemo(() => {
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

    const filterBySearchMatch = (match: IMatch) =>
      !hasSearch ||
      match.teamA?.name?.toLowerCase().includes(searchLower) ||
      match.teamB?.name?.toLowerCase().includes(searchLower) ||
      match.description?.toLowerCase().includes(searchLower);

    const filterByGroupPlayer = (player: IPlayer) => {
      if (!hasGroup) return true;
      return player.teams?.some((teamId) => groupTeamIds?.has(String(teamId)));
    };

    const filterByGroupMatch = (match: IMatch) => {
      if (!hasGroup) return true;
      return String(match.teamA?.group) === selectedGroup;
    };

    // Filter teams
    const filteredTeams = teams.filter(
      (team) =>
        filterByDivision(team) &&
        filterByGroupTeam(team) &&
        filterBySearchTeam(team)
    );

    // Filter matches with team resolution
    const filteredMatches = matches
      .filter(filterByDivision)
      .map((match) => ({
        ...match,
        teamA: match.teamA ? teamMap.get(String(match.teamA)) : null,
        teamB: match.teamB ? teamMap.get(String(match.teamB)) : null,
      }))
      // @ts-ignore
      .filter(filterByGroupMatch)
      // @ts-ignore
      .filter(filterBySearchMatch);

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
    };
  }, [
    teams,
    sortedPlayers,
    matches,
    teamMap,
    currDivision,
    selectedGroup,
    search,
  ]);

  // Initialize rankings with optimized data structures
  const initializeLists = useCallback(() => {
    const rankingMap = new Map<string, number>();
    const teamsPlayerRanking = [];

    for (const team of teams) {
      if (team?.playerRanking && !team.playerRanking.rankLock) {
        teamsPlayerRanking.push({
          ...team.playerRanking,
          team: {
            _id: team._id,
            name: team.name,
            division: team.division,
            event: event._id,
          },
        });

        if (team.playerRanking.rankings) {
          for (const ranking of team.playerRanking.rankings) {
            // @ts-ignore
            if (ranking.player?._id) {
              // @ts-ignore
              rankingMap.set(ranking.player._id, ranking.rank);
            }
          }
        }
      }
    }

    // @ts-ignore
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

  // Memoize render content to avoid unnecessary re-renders
  const renderContent = useMemo(() => {
    switch (selectedItem) {
      case EEventItem.PLAYER:
        return (
          <PlayerStandings
            playerList={filteredData.players}
            matchList={filteredData.matches as IMatch[]}
            playerStatsMap={playerStatsMap}
            teamMap={teamMap}
          />
        );
      case EEventItem.TEAM:
        return (
          <TeamList
            teamList={filteredData.teams as ITeamCaptain[]}
            selectedGroup={selectedGroup}
            matchList={filteredData.matches as IMatch[]}
            nets={nets}
            rounds={rounds}
          />
        );
      case EEventItem.MATCH:
        return (
          <MatchList
            matchList={filteredData.matches as IMatch[]}
            nets={nets}
            rounds={rounds}
          />
        );
      default:
        return null;
    }
  }, [filteredData, selectedGroup, selectedItem, playerStatsMap, nets, rounds]);

  // Memoize sponsors rendering
  const renderSponsors = useMemo(() => {
    if (!user.token && sponsors?.length) {
      return (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold">Sponsors</h3>
          <div className="flex gap-4 flex-wrap justify-center">
            <div className="w-20" key="default-logo">
              <Image
                width={imgW.xs}
                height={imgW.xs}
                src="/free-logo.png"
                alt={`${APP_NAME}-logo`}
              />
            </div>
            {sponsors.map((sponsor) => (
              <CldImage
                key={sponsor._id}
                alt={sponsor.company}
                width="200"
                height="200"
                className="w-20"
                src={sponsor.logo.toString()}
              />
            ))}
          </div>
        </div>
      );
    }
    return null;
  }, [user.token, sponsors]);

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

  // Memoize navigation items
  const navItems = useMemo(
    () => [EEventItem.PLAYER, EEventItem.TEAM, EEventItem.MATCH],
    []
  );

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="text-center w-full flex flex-col items-center mb-6">
        <Link href={`/${ldoIdUrl}`}>
          <Image
            height={100}
            width={100}
            src="/free-logo.png"
            alt="youthspike-logo"
            className="w-24"
          />
        </Link>
        <h1 className="text-2xl font-bold mt-2">{event.name}</h1>
      </div>

      {renderSponsors}

      <div className="search-filter w-full mx-auto mt-8 space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="w-full">
            <label
              htmlFor="search"
              className="block text-lg font-semibold text-gray-200 mb-2"
            >
              Search
            </label>
            <div className="relative">
              <input
                id="search"
                name="search"
                type="text"
                placeholder="Type to search..."
                className="w-full px-4 pr-10 py-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={search || ""}
                onChange={handleSearchChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-white focus:outline-none"
                onClick={() => setSearch("")}
              >
                <img
                  src="/icons/close.svg"
                  alt="Clear search"
                  className="w-5 h-5 invert"
                />
              </button>
            </div>
          </div>

          <SelectInput
            key="division-input"
            handleSelect={handleDivisionChange}
            defaultValue={currDivision || ""}
            name="division"
            optionList={divisionList}
            label="Division"
          />
          <SelectInput
            key="group-input"
            handleSelect={handleGroupChange}
            value={selectedGroup || ""}
            name="group"
            optionList={[
              // { id: 1, value: "", text: "All Groups" },
              ...groupList.map((g, index) => ({
                id: index + 2,
                value: g._id,
                text: g.name,
              })),
            ]}
            label="Group"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        <div className="side-bar w-full lg:w-1/4 bg-gray-800 p-4 rounded-md lg:max-h-screen overflow-auto">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => (
              <li
                key={item}
                className={`cursor-pointer p-2 rounded-md uppercase text-center transition-colors ${
                  selectedItem === item
                    ? "bg-yellow-500 text-black font-semibold"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
                onClick={() => handleItemSelect(item)}
              >
                {item === EEventItem.TEAM ? "Standings / Teams" : item}
              </li>
            ))}
          </ul>
        </div>

        <div className="content w-full lg:w-3/4 rounded-md bg-gray-800 p-4">
          {renderContent}
        </div>
      </div>
    </div>
  );
}

export default EventDetail;
