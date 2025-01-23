import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IMatchExpRel, IPlayer, IPlayerRecord } from '@/types';
import { tableVariant } from '@/utils/animation';
import { calculatePlayerRecords } from '@/utils/scoreCalc';
import { useAppSelector } from '@/redux/hooks';
import PlayerRow from './PlayerRow';

interface IPlayerStandingsProps {
  // eslint-disable-next-line react/require-default-props, react/no-unused-prop-types
  teamRank?: boolean;
  playerList: IPlayer[];
  matchList: IMatchExpRel[];
}

function PlayerStandings({ playerList, matchList, teamRank }: IPlayerStandingsProps) {
  // const [playerRecords, setPlayerRecords] = useState<Map<string, IPlayerRecord>>(new Map());
  const [players, setPlayers] = useState<IPlayerRecord[]>([]);
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

    // Update state with the sorted Map
    setPlayers(sortedRecords);
  }, [playerList, matchList, teamRank, rankingMap]);

  return (
    <div className="teamList w-full flex flex-col rounded-lg shadow-lg">
      <div className="overflow-x-auto">
        <motion.table className="w-full text-left text-sm text-gray-300 bg-gray-900 rounded-lg overflow-hidden" variants={tableVariant} initial="hidden" animate="visible">
          <thead>
            <tr className="bg-yellow-500 text-black font-semibold">
              <th className="py-3 px-2 sticky top-0 shadow-md">Player</th>
              <th className="py-3 px-2 sticky top-0 shadow-md">Wins %</th>
              <th className="py-3 px-2 sticky top-0 shadow-md">GM PT DIFF/AVG</th>
              <th className="py-3 px-2 sticky top-0 shadow-md">Record</th>
            </tr>
          </thead>
          <motion.tbody>
            {players.map((player, index) => (
              <PlayerRow key={player._id} index={index} player={player} teamRank={teamRank} />
            ))}
          </motion.tbody>
        </motion.table>
      </div>
    </div>
  );
}

export default PlayerStandings;
