"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/lib/UserProvider";
import { useAppDispatch } from "@/redux/hooks";
import {
  IEvent,
  IMatch,
  IMatchExpRel,
  IPlayer,
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
import { QueryRef, useReadQuery } from "@apollo/client";

interface IEventDetailProps {
  queryRef: QueryRef<{ getEventDetails: { data: IEventDetailData } }>;
}

function EventDetail({ queryRef }: IEventDetailProps) {
  const { ldoIdUrl } = useLdoId();
  const dispatch = useAppDispatch();
  const user = useUser();
  const searchParams = useSearchParams();
  const { data, error } = useReadQuery(queryRef);

  const [selectedItem, setSelectedItem] = useState<EEventItem>(EEventItem.TEAM);
  const [currDivision, setCurrDivision] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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
  } = data.getEventDetails.data;

  // Sort teams and players alphabetically
  const sortedTeams = useMemo(() => {
    return [...(teams || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [teams]);

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
    const filterByDivision = (item: { division?: string }) =>
      currDivision
        ? item.division?.trim().toLowerCase() ===
          currDivision.trim().toLowerCase()
        : true;

        

    const filterByGroup = (item: { group?: string }) =>
      selectedGroup ? item.group === selectedGroup : true;

    return {
      // @ts-ignore
      teams: sortedTeams?.filter(filterByDivision).filter(filterByGroup) || [],
      matches: matches?.filter(filterByDivision) || [],
      players: sortedPlayers?.filter(filterByDivision) || [],
    };
  }, [sortedTeams, sortedPlayers, matches, currDivision, selectedGroup]);

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

  useEffect(() => {
    initializeLists();
    const eventItem = searchParams.get(EVENT_ITEM) as EEventItem;
    if (eventItem && Object.values(EEventItem).includes(eventItem)) {
      setSelectedItem(eventItem);
    }
  }, [event, initializeLists, searchParams]);

  const renderContent = useMemo(() => {
    const renderMap = {
      [EEventItem.PLAYER]: (
        <PlayerStandings
          playerList={filteredData.players}
          matchList={filteredData.matches}
        />
      ),
      [EEventItem.TEAM]: (
        <TeamList
          teamList={filteredData.teams as ITeamCaptain[]}
          selectedGroup={selectedGroup}
          matchList={filteredData.matches as IMatch[]}
        />
      ),
      [EEventItem.MATCH]: (
        <MatchList matchList={filteredData.matches as IMatch[]} nets={nets} rounds={rounds} />
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

      <div className="search-filter w-full max-w-2xl mx-auto mt-8 space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectInput
            key="division-input"
            handleSelect={(e) => {
              setCurrDivision(e.target.value || null);
              setSelectedGroup(null); // Reset group when division changes
            }}
            defaultValue=""
            name="division"
            optionList={divisionList}
            label="Division"
          />
          <SelectInput
            key="group-input"
            handleSelect={(e) => setSelectedGroup(e.target.value || null)}
            defaultValue=""
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
                  onClick={() => setSelectedItem(item)}
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
