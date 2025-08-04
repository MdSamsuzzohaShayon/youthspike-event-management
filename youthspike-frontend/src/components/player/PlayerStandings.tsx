import React, { useEffect, useState } from 'react';
import { IMatchExpRel, IPlayer, IPlayerRecord } from '@/types';
import { calculatePlayerRecords } from '@/utils/scoreCalc';
import { useAppSelector } from '@/redux/hooks';
import PlayerRow from './PlayerRow';
import Pagination from '../elements/Pagination';

interface IPlayerStandingsProps {
  // eslint-disable-next-line react/require-default-props, react/no-unused-prop-types
  teamRank?: boolean;
  playerList: IPlayer[];
  matchList: IMatchExpRel[];
}

const ITEMS_PER_PAGE = 50;

function PlayerStandings({ playerList, matchList, teamRank }: IPlayerStandingsProps) {
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
    const newPlayerList = calculatePlayerRecords(playerList, newMatchList, newRankingMap);

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

        const aWinPercentage = aGamesPlayed > 0 ? (a.wins / aGamesPlayed) * 100 : 0;
        const bWinPercentage = bGamesPlayed > 0 ? (b.wins / bGamesPlayed) * 100 : 0;

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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300 bg-gray-900 rounded-lg overflow-hidden" 
        >
          <thead>
            <tr className="bg-yellow-500 text-black font-semibold">
              <th className="py-3 px-2 sticky top-0 shadow-md">Player</th>
              <th className="py-3 px-2 sticky top-0 shadow-md">Wins %</th>
              <th className="py-3 px-2 sticky top-0 shadow-md">GM PT DIFF/AVG</th>
              <th className="py-3 px-2 sticky top-0 shadow-md">Record</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <PlayerRow key={player._id} index={index} player={player} teamRank={teamRank} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="w-full mt-6">
        <Pagination currentPage={currentPage} itemList={playerList || []} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
      </div>
    </div>
  );
}

export default PlayerStandings;
