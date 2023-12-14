import React, { useEffect, useRef, useState } from 'react';
import PlayerCard from './PlayerCard';
import { IPlayer, PlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYERS } from '@/graphql/players';

interface IPlayerListProps {
  playerList: IPlayer[];
  eventId: string;
  teamId: string | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

interface IPlayerRank {
  _id: string;
  rank: number;
}

function PlayerList({ playerList, eventId, teamId, setIsLoading }: IPlayerListProps) {

  const [rankPlayers, { data, error, loading }] = useMutation(UPDATE_PLAYERS);

  const [playerActiveClone, setPlayerActiveClone] = useState<IPlayer[]>([]);
  const [playerInactiveClone, setPlayerInactiveClone] = useState<IPlayer[]>([]);
  const [playerRanking, setPlayerRanking] = useState<IPlayerRank[]>([]);

  const dragPI = useRef<number>(0);
  const dragOverPI = useRef<number>(0);

  /**
   * Drag or touch event for players rankings
   */
  const handleDragStart = (index: number) => {
    dragPI.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOverPI.current = index;
  };
  const handleDragEnd = (index: number, playerId: string) => {
    // Create a new list to submit
    console.log(`Drag start index: ${dragPI.current}, drag over index: ${dragOverPI.current}`);
    let activeList = [...playerActiveClone];
    const draggedPlayer = activeList.splice(dragPI.current, 1);
    if (draggedPlayer && draggedPlayer.length > 0) {
      activeList.splice(dragOverPI.current, 0, draggedPlayer[0]);
    } else {
      activeList = [...playerActiveClone];
    }
    setPlayerRanking(activeList.map((p, i) => ({ rank: i += 1, _id: p._id })));
    setPlayerActiveClone(activeList);
  };

  const handleUpdate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (playerRanking.length > 0) {
      try {
        setIsLoading(true)
        // Submit to the server
        await rankPlayers({ variables: { input: playerRanking } });
      } catch (error) {
        console.log(error);

      } finally {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    if (playerList && playerList.length > 0) {
      setPlayerActiveClone(playerList.filter((p) => p.status === PlayerStatus.ACTIVE));
      setPlayerInactiveClone(playerList.filter((p) => p.status === PlayerStatus.INACTIVE));
    }
  }, [playerList]);

  return (
    <div>
      <h1 className='mb-8'>Players</h1>
      <ul className='flex flex-wrap items-center gap-2'>
        {playerActiveClone.length > 0 && playerActiveClone.map((player: IPlayer, index) => <PlayerCard key={player._id} eventId={eventId} player={player} index={index} teamId={teamId}
          setIsLoading={setIsLoading} touchDragStart={handleDragStart} touchDragEnter={handleDragEnter} touchDragEnd={handleDragEnd} />)}
      </ul>
      <h3 className="mt-4">Inactive Players</h3>
      <ul className='flex flex-wrap items-center gap-2'>
        {playerInactiveClone.length > 0 && playerInactiveClone.map((player: IPlayer, index) => <PlayerCard key={player._id} eventId={eventId} player={player} index={index} teamId={teamId}
          setIsLoading={setIsLoading} touchDragStart={handleDragStart} touchDragEnter={handleDragEnter} touchDragEnd={handleDragEnd} />)}
      </ul>
      <button className="btn-secondary mt-4" type='button' onClick={handleUpdate}>Update</button>
    </div>
  )
}

export default PlayerList;