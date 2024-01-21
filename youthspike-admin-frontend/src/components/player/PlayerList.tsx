import React, { Touch, useEffect, useRef, useState } from 'react';
import PlayerCard from './PlayerCard';
import { IPlayer, PlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYERS } from '@/graphql/players';

interface IPlayerListProps {
  playerList: IPlayer[];
  eventId: string;
  teamId: string | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  rankControls?: boolean;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  showRank?: boolean;
}

interface IPlayerRank {
  _id: string;
  rank: number;
}

function PlayerList({ playerList, eventId, teamId, setIsLoading, rankControls, setAddPlayer, showRank }: IPlayerListProps) {

  const [rankPlayers, { data, error, loading }] = useMutation(UPDATE_PLAYERS);

  const [playerActiveClone, setPlayerActiveClone] = useState<IPlayer[]>([]);
  const [playerInactiveClone, setPlayerInactiveClone] = useState<IPlayer[]>([]);
  const [playerRanking, setPlayerRanking] = useState<IPlayerRank[]>([]);

  const dragPI = useRef<number>(0);
  const dragOverPI = useRef<number>(0);

  /**
   * Handle events
   */
  const handleUpdate = async (upr: IPlayerRank[]) => { // upr = update player ranking
    if (!rankControls) return;
    if (upr.length > 0) {
      try {
        console.log("Update ranks");
        
        setIsLoading(true)
        // Submit to the server
        await rankPlayers({ variables: { input: upr } });
        if (setAddPlayer) setAddPlayer(false);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    }
  }

  /**
   * Drag or touch event for players rankings
   */
  const handleDragStart = (index: number) => {
    if (!rankControls) return;
    dragPI.current = index;
  };
  const handleDragEnter = (index: number) => {
    if (!rankControls) return;
    dragOverPI.current = index;
  };
  const handleDragEnd = async (index: number, playerId: string) => {
    if (!rankControls) return;
    // Create a new list to submit
    let activeList = [...playerActiveClone];
    const draggedPlayer = activeList.splice(dragPI.current, 1);
    if (draggedPlayer && draggedPlayer.length > 0) {
      activeList.splice(dragOverPI.current, 0, draggedPlayer[0]);
    } else {
      activeList = [...playerActiveClone];
    }
    const updatedRanking = activeList.map((p, i) => ({ rank: i += 1, _id: p._id }));
    setPlayerRanking(updatedRanking);
    setPlayerActiveClone(activeList);
    await handleUpdate(updatedRanking)
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!rankControls) return;
    e.preventDefault(); // Prevent scrolling
  }


  useEffect(() => {
    if (playerList && playerList.length > 0) {
      setPlayerActiveClone(playerList.filter((p) => p.status === PlayerStatus.ACTIVE));
      setPlayerInactiveClone(playerList.filter((p) => p.status === PlayerStatus.INACTIVE));
    }
  }, [playerList]);

  return (
    <div className='mt-2'>
      <ul className='flex flex-wrap items-center gap-2'>
        {playerActiveClone.length > 0 && playerActiveClone.map((player: IPlayer, index) => <PlayerCard key={player._id} eventId={eventId} player={player} index={index} teamId={teamId}
          setIsLoading={setIsLoading} touchDragStart={handleDragStart} touchDragEnter={handleDragEnter} touchDragEnd={handleDragEnd} touchMove={handleTouchMove} rankControls={rankControls} showRank={showRank} />)}
      </ul>
      <h3 className="mt-4">Inactive Players</h3>
      <ul className='flex flex-wrap items-center gap-2'>
        {playerInactiveClone.length > 0 && playerInactiveClone.map((player: IPlayer, index) => <PlayerCard key={player._id} eventId={eventId} player={player} index={index} teamId={teamId}
          setIsLoading={setIsLoading} touchDragStart={handleDragStart} touchDragEnter={handleDragEnter} touchDragEnd={handleDragEnd} touchMove={handleTouchMove} rankControls={rankControls} showRank={showRank} />)}
      </ul>
    </div>
  )
}

export default PlayerList;