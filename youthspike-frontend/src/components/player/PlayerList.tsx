import { IPlayer } from '@/types';
import React from 'react';
import PlayerCard from './PlayerCard';

// eslint-disable-next-line react/require-default-props
function PlayerList({ playerList }: { playerList?: IPlayer[] }) {
  return <div className="playerList w-full flex flex-col gap-1">{playerList && playerList.length > 0 && playerList.map((p) => <PlayerCard player={p} key={p?._id} />)}</div>;
}

export default PlayerList;
