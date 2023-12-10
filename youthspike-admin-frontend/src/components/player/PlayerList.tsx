import { useQuery } from '@apollo/client';
import React from 'react';
import PlayerCard from './PlayerCard';
import { IPlayer } from '@/types/player';

interface PlayerListProps {
  playerList: IPlayer[]; 
  eventId: string; 
  teamId: string | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

function PlayerList({ playerList, eventId, teamId, setIsLoading }: PlayerListProps) {

  return (
    <div>
      <h1>Players List</h1>
      <ul className='flex flex-wrap items-center'>
        {playerList.length > 0 && playerList.map((player: IPlayer, index) => <PlayerCard key={player._id} player={player} index={index} teamId={teamId} setIsLoading={setIsLoading} />)}
      </ul>
    </div>
  )
}

export default PlayerList;