"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/lib/UserProvider";
import { useAppDispatch } from "@/redux/hooks";
import { IEvent, IMatch, IPlayer, ITeam, ITeamCaptain } from "@/types";
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
import { QueryRef, useReadQuery } from "@apollo/client";
import InputField from "../elements/InputField";
import { useDebounce } from "use-debounce";

interface IEventDetailProps {
  queryRef: QueryRef<{ getEventDetails: { data: IEventDetailData } }>;
}

function EventDetail({ queryRef }: IEventDetailProps) {
  const { ldoIdUrl } = useLdoId();
  const dispatch = useAppDispatch();
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, error } = useReadQuery(queryRef);

  // Get initial state from query params
  const initialSelectedItem =
    (searchParams.get(EVENT_ITEM) as EEventItem) || EEventItem.MATCH;
  const initialDivision = searchParams.get("division");
  const initialSearch = searchParams.get("search");
  const initialGroup = searchParams.get("group");
  // const initialPlayerPage = parseInt(searchParams.get("pp") ?? "1", 10);
  // const initialTeamPage = parseInt(searchParams.get("tp") ?? "1", 10);
  // const initialMatchPage = parseInt(searchParams.get("mp") ?? "1", 10);

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
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Replace instead of push to avoid cluttering history
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
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

  // Handle loading and error states
  if (error) {
    console.error(error);

    return (
      <div className="min-h-screen flex w-full justify-center items-center">
        <h3 className="text-center">Error loading event details</h3>
      </div>
    );
  }

  if (!data) {
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
  } = data.getEventDetails.data;

  // Sort teams and players alphabetically
  const sortedTeams = useMemo(() => {
    // return [...(teams || [])].sort((a, b) => a.name.localeCompare(b.name));
    return teams;
  }, [teams]);

  const teamMap = new Map<string, ITeam>(teams.map((t) => [t._id, t]));

  const sortedPlayers = useMemo(() => {
    return [...(players || [])].sort((a, b) => {
      const aName = `${a.firstName} ${a.lastName}`;
      const bName = `${b.firstName} ${b.lastName}`;
      return aName.localeCompare(bName);
    });
  }, [players]);

  // @ts-ignore
  const divisionList = useMemo(
    () => divisionsToOptionList(event.divisions || ""),
    [event.divisions]
  );

  const groupList = useMemo(() => {
    if (!currDivision || currDivision === "") {
      return groups || [];
    }
    return (groups || []).filter(
      (group) =>
        group.division?.trim().toLowerCase() ===
        currDivision.trim().toLowerCase()
    );
  }, [groups, currDivision]);

  const filteredData = useMemo(() => {
    const searchLower = search?.toLowerCase() || "";

    const filterByDivision = (item: { division?: string }) =>
      currDivision
        ? item.division?.trim().toLowerCase() ===
          currDivision.trim().toLowerCase()
        : true;

    const filterByGroup = (item: ITeam) => {
      if (!selectedGroup) return true;

      // group might be an object or a string
      const groupId =
        typeof item.group === "string" ? item.group : item.group?._id;

      return groupId === selectedGroup;
    };

    const filterBySearchPlayer = (player: IPlayer) =>
      !searchLower ||
      player.firstName.toLowerCase().includes(searchLower) ||
      player.lastName.toLowerCase().includes(searchLower);

    const filterBySearchTeam = (team: ITeam) =>
      !searchLower || team.name.toLowerCase().includes(searchLower);

    const filterBySearchMatch = (match: IMatch) =>
      !searchLower ||
      match.teamA?.name?.toLowerCase().includes(searchLower) ||
      match.teamB?.name?.toLowerCase().includes(searchLower) ||
      match.description?.toLowerCase().includes(searchLower);

    return {
      teams:
        sortedTeams
          ?.filter(filterByDivision)
          .filter(filterByGroup)
          .filter(filterBySearchTeam) || [],

      matches:
        matches
          ?.filter(filterByDivision)
          .map((m) => ({
            ...m,
            teamA: m.teamA ? teamMap.get(String(m.teamA)) : null,
            teamB: m.teamB ? teamMap.get(String(m.teamB)) : null,
          }))
          .filter((m) => {
            if (!selectedGroup) return true;
            return String(m.teamA?.group) === selectedGroup;
          })
          // @ts-ignore
          .filter(filterBySearchMatch) || [],

      players:
        sortedPlayers?.filter(filterByDivision).filter(filterBySearchPlayer) ||
        [],
    };
  }, [
    sortedTeams,
    sortedPlayers,
    matches,
    currDivision,
    selectedGroup,
    search,
  ]);

  const playerStatsMap = useMemo(() => {
    return new Map(statsOfPlayer.map((ps) => [ps.playerId, ps.stats]));
  }, [statsOfPlayer]);

  const initializeLists = useCallback(() => {
    const rankingMap = new Map<string, number>();
    const teamsPlayerRanking = sortedTeams?.reduce((rankings: any[], team) => {
      if (team?.playerRanking && !team.playerRanking.rankLock) {
        rankings.push({
          ...team.playerRanking,
          team: {
            _id: team._id,
            name: team.name,
            division: team.division,
            event: event._id,
          },
        });

        team.playerRanking.rankings?.forEach(
          // @ts-ignore
          ({ player, rank }: { player: { _id: string }; rank: number }) => {
            rankingMap.set(player._id, rank);
          }
        );
      }
      return rankings;
    }, []);

    dispatch(setTeamsPlayerRanking(teamsPlayerRanking || []));
    dispatch(setRankingMap(Array.from(rankingMap.entries())));
  }, [dispatch, event._id, sortedTeams]);

  // Update the handlers to use the setter functions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value || null);
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrDivision(e.target.value || null);
    setSelectedGroup(null); // Reset group when division changes
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGroup(e.target.value || null);
  };

  const handleItemSelect = (item: EEventItem) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    initializeLists();

    // Only initialize once from query params
    if (!selectedItem) {
      const eventItem = searchParams.get(EVENT_ITEM) as EEventItem;
      if (eventItem && Object.values(EEventItem).includes(eventItem)) {
        setSelectedItem(eventItem);
      }
    }
  }, [event, initializeLists]);

  // Working
  const renderContent = useMemo(() => {
    const renderMap = {
      [EEventItem.PLAYER]: (
        <PlayerStandings
          playerList={filteredData.players}
          matchList={filteredData.matches as IMatch[]}
          playerStatsMap={playerStatsMap}
        />
      ),
      [EEventItem.TEAM]: (
        <TeamList
          teamList={filteredData.teams as ITeamCaptain[]}
          selectedGroup={selectedGroup}
          matchList={filteredData.matches as IMatch[]}
          nets={nets}
          rounds={rounds}
        />
      ),
      [EEventItem.MATCH]: (
        <MatchList
          matchList={filteredData.matches as IMatch[]}
          nets={nets}
          rounds={rounds}
        />
      ),
    };
    return renderMap[selectedItem] || null;
  }, [filteredData, selectedGroup, selectedItem]);

  const renderSponsors = useMemo(
    () => (
      <>
        <div className="w-20" key="default-logo">
          <Image
            width={imgW.xs}
            height={imgW.xs}
            src="/free-logo.png"
            alt={`${APP_NAME}-logo`}
          />
        </div>
        {sponsors?.map((sponsor) => (
          <CldImage
            key={sponsor._id}
            alt={sponsor.company}
            width="200"
            height="200"
            className="w-20"
            src={sponsor.logo.toString()}
          />
        ))}
      </>
    ),
    [sponsors]
  );

  if (players?.length === 0 && teams?.length === 0 && matches?.length === 0) {
    return (
      <div className="min-h-screen flex w-full justify-center items-center">
        <h3 className="text-center">
          No matches, teams, or players have been created yet!
        </h3>
      </div>
    );
  }

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

      {!user.token && sponsors && sponsors.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold">Sponsors</h3>
          <div className="flex gap-4 flex-wrap justify-center">
            {renderSponsors}
          </div>
        </div>
      )}

      <div className="search-filter w-full mx-auto mt-8 space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* <div className="w-full flex justify-between items-end">
            <div className="w-10/12">
              <InputField
                key="search-input"
                type="text"
                name="search"
                label="Search"
                defaultValue={search || ""}
                handleInputChange={handleSearchChange}
              />
            </div>
            <div className="w-2/12 py-1 rounded-md border border-gray-700">
              <Image
                src="/icons/close.svg"
                className="w-3/6 svg-white"
                alt="close"
                height={20}
                width={20}
              />
            </div>
          </div> */}

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

              {/* Close button inside input */}
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
            defaultValue={selectedGroup || ""}
            name="group"
            optionList={[
              { id: 1, value: "", text: "All Groups" },
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
            {[EEventItem.PLAYER, EEventItem.TEAM, EEventItem.MATCH].map(
              (item) => (
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
              )
            )}
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
