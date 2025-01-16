import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IMatchExpRel, IPlayer, IPlayerRecord } from '@/types';
import { tableVariant } from '@/utils/animation';
import { calculatePlayerRecords } from '@/utils/scoreCalc';
import PlayerRow from './PlayerRow';

interface IPlayerStandingsProps {
  playerList: IPlayer[];
  matchList: IMatchExpRel[];
  selectedGroup: string | null;
}

function PlayerStandings({ playerList, matchList, selectedGroup }: IPlayerStandingsProps) {
  // const [playerRecords, setPlayerRecords] = useState<Map<string, IPlayerRecord>>(new Map());
  const [players, setPlayers] = useState<IPlayerRecord[]>([]);

  useEffect(() => {
    if (!playerList?.length) return;
    let newMatchList: IMatchExpRel[] = [];
    if(matchList.length > 0) newMatchList = matchList;
    const newPlayerList = calculatePlayerRecords(playerList, newMatchList);

    // Sort the player records based on the criteria
    const sortedRecords = newPlayerList.sort((a, b) => {
      // First, compare by number of wins (descending)
      if (a.wins !== b.wins) return b.wins - a.wins;

      // If wins are tied, compare by number of losses (ascending)
      if (a.losses !== b.losses) return a.losses - b.losses;

      // If both wins and losses are tied, compare by averagePointsDiff (descending)
      return b.averagePointsDiff - a.averagePointsDiff;
    });

    // Update state with the sorted Map
    setPlayers(sortedRecords);
  }, [playerList, matchList]);

  return (
    <div className="teamList w-full flex flex-col lg:gap-4 bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="overflow-x-auto">
        <motion.table className="w-full text-left text-sm text-gray-300 bg-gray-900 rounded-lg overflow-hidden min-w-[600px]" variants={tableVariant} initial="hidden" animate="visible">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Player</th>
              {selectedGroup && <th className="py-3 px-4">Record</th>}
              <th className="py-3 px-4">Running</th>
              <th className="py-3 px-4">GM PT DIFF/AVG</th>
              <th className="py-3 px-4">Overall</th>
            </tr>
          </thead>
          <motion.tbody>
            {players.map((player, index) => (
              <PlayerRow key={player._id} index={index} player={player} selectedGroup={selectedGroup} />
            ))}
          </motion.tbody>
        </motion.table>
      </div>
    </div>
  );
}

export default PlayerStandings;
