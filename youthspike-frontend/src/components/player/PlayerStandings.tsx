import React, { useEffect, useState } from "react";
import {
  IMatch,
  IMatchExpRel,
  IPlayer,
  IPlayerRecord,
  IPlayerStats,
  IServerReceiverSinglePlay,
} from "@/types";
import { calculatePlayerRecords } from "@/utils/scoreCalc";
import { useAppSelector } from "@/redux/hooks";
import PlayerRow from "./PlayerRow";
import Pagination from "../elements/Pagination";
import Image from "next/image";

interface IPlayerStandingsProps {
  teamRank?: boolean;
  playerList: IPlayer[];
  matchList: IMatch[];
  playerStatsMap: Map<string, IPlayerStats[]>;
}

const ITEMS_PER_PAGE = 30;

function PlayerStandings({
  playerList,
  matchList,
  teamRank,
  playerStatsMap,
}: IPlayerStandingsProps) {
  // Local state
  const [players, setPlayers] = useState<IPlayerRecord[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Redux state
  const { rankingMap } = useAppSelector((state) => state.playerRanking);

  useEffect(() => {
    if (!playerList) return;
    let newMatchList: IMatchExpRel[] = [];
    if (matchList.length > 0) newMatchList = matchList;

    const newRankingMap = new Map<string, number>(rankingMap);
    const newPlayerList = calculatePlayerRecords(
      playerList,
      newMatchList,
      newRankingMap
    );

    // Sort the player records based on the criteria
    let sortedRecords = [];
    if (teamRank) {
      // @ts-ignore
      sortedRecords = newPlayerList.sort((a, b) => a.rank - b.rank);
    } else {
      sortedRecords = newPlayerList.sort((a, b) => {
        // First, compare by number of wins (descending)
        const aGamesPlayed = a.numOfGame - a.running;
        const bGamesPlayed = b.numOfGame - b.running;

        const aWinPercentage =
          aGamesPlayed > 0 ? (a.wins / aGamesPlayed) * 100 : 0;
        const bWinPercentage =
          bGamesPlayed > 0 ? (b.wins / bGamesPlayed) * 100 : 0;

        // First, compare by win percentage (descending)
        if (aWinPercentage !== bWinPercentage) {
          return bWinPercentage - aWinPercentage;
        }

        if (a.wins !== b.wins) return b.wins - a.wins;

        // If wins are tied, compare by number of losses (ascending)
        if (a.losses !== b.losses) return a.losses - b.losses;

        // If both wins and losses are tied, compare by averagePointsDiff (descending)
        return b.averagePointsDiff - a.averagePointsDiff;
      });
    }

    // Paginated
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPlayers = sortedRecords.slice(start, start + ITEMS_PER_PAGE);

    // Update state with the sorted Map
    setPlayers(paginatedPlayers);
  }, [playerList, matchList, teamRank, rankingMap, currentPage]);

  return (
    <div className="playerList w-full flex flex-col">
      <div className="overflow-x-auto w-full">
        <div className="min-w-[1000px] w-full">
          {" "}
          {/* Increased min-width to accommodate all columns */}
          <div className="relative w-full">
            <table className="w-full text-left text-sm text-gray-300 bg-gray-900">
              <thead>
                <tr className="bg-yellow-500 text-black font-semibold">
                  <th className="py-3 px-3 sticky left-0 top-0 shadow-md z-20 bg-yellow-500 min-w-[120px] max-w-[120px]">
                    Player
                  </th>
                  <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>Serve %</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>+/-</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>Ace %</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>Receive %</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>Hitting %</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>Set Assists %</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>Defense %</span>
                    </div>
                  </th>
                  {/* <th className="py-3 px-4 sticky top-0 shadow-md z-10 bg-yellow-500 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <Image
                        width={20}
                        height={20}
                        className="w-5 svg-black rotate-90 mr-1"
                        alt="arrow"
                        src="/icons/right-arrow.svg"
                      />
                      <span>Win %</span>
                    </div>
                  </th> */}
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <PlayerRow
                    key={player?._id}
                    index={index}
                    player={player}
                    teamRank={teamRank}
                    playerStats={playerStatsMap.get(player?._id) || []}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="w-full mt-6">
        <Pagination
          currentPage={currentPage}
          itemList={playerList || []}
          setCurrentPage={setCurrentPage}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
}

export default PlayerStandings;
