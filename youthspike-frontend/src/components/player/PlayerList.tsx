/* eslint-disable react/require-default-props */
import { IMatchExpRel, IPlayer, IPlayerRecord } from '@/types';
import React, { useEffect, useState } from 'react';
import { useAppSelector } from '@/redux/hooks';
import { calculatePlayerRecords } from '@/utils/scoreCalc';
import PlayerCard from './PlayerCard';

interface IPlayerListProps {
  showRank?: boolean;
  playerList?: IPlayer[];
  matchList?: IMatchExpRel[];
}

function PlayerList({ showRank, playerList, matchList }: IPlayerListProps) {
  const [players, setPlayers] = useState<IPlayerRecord[]>([]);
  const { rankingMap } = useAppSelector((state) => state.playerRanking);

  const handleContextMenu = (e: React.SyntheticEvent) => {
    e.preventDefault(); // Prevent the default context menu from showing
  };

  useEffect(() => {
    if (!playerList?.length) return;

    const newRankingMap = new Map<string, number>(rankingMap);
    let newMatchList: IMatchExpRel[] = [];
    if (matchList && matchList?.length > 0) newMatchList = matchList;
    const newPlayerList = calculatePlayerRecords(playerList, newMatchList, newRankingMap);

    // Sort the player records based on the criteria
    const sortedPlayers = newPlayerList.sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : 0));

    setPlayers(sortedPlayers);
  }, [matchList, playerList, rankingMap]);

  return (
    <div className="playerList w-full flex flex-col gap-1" onContextMenu={handleContextMenu}>
      {players?.map((player) => <PlayerCard showRank={showRank} key={player._id} player={player} />)}
    </div>
  );
}

export default PlayerList;
