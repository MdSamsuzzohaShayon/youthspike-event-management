import { IPlayer } from '@/types';
import React from 'react';
import { useAppSelector } from '@/redux/hooks';
import PlayerCard from './PlayerCard';

// eslint-disable-next-line react/require-default-props
function PlayerList({ playerList }: { playerList?: IPlayer[] }) {
  // rankingMap
  const { rankingMap } = useAppSelector((state) => state.playerRanking);

  const newRankingMap = new Map(rankingMap);  

  return (
    <div className="playerList w-full flex flex-col gap-1">
      {playerList && playerList.length > 0 && playerList.map((p) => <PlayerCard rank={newRankingMap.get(p._id) ?? null} player={p} key={p?._id} />)}
    </div>
  );
}

export default PlayerList;
