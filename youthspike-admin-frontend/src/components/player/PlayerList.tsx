import React, { Touch, useEffect, useRef, useState } from 'react';
import PlayerCard from './PlayerCard';
import { IPlayer, IPlayerExpRel, EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import { UPDATE_PLAYERS } from '@/graphql/players';
import { GET_A_TEAM } from '@/graphql/teams';
import { IOption, ITeam } from '@/types';

interface IPlayerListProps {
  playerList: IPlayerExpRel[];
  eventId: string;
  teamId?: string | null;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  rankControls?: boolean;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  showRank?: boolean;
  teamIds?: string[];
  divisionList?: IOption[];
  teamList?: ITeam[];
}

interface IPlayerRank {
  _id: string;
  rank: number;
}

function PlayerList({ playerList, eventId, teamId, setIsLoading, rankControls, setAddPlayer, showRank, teamIds, divisionList, teamList }: IPlayerListProps) {

  const [rankPlayers, { data, error, loading, client }] = useMutation(UPDATE_PLAYERS);

  const dragPI = useRef<number>(0);
  const dragOverPI = useRef<number>(0);

  /**
   * Handle events
   */
  const handleUpdate = async (upr: IPlayerRank[]) => { // upr = update player ranking
    if (!rankControls) return;
    if (upr.length > 0) {
      try {
        setIsLoading(true)
        // Submit to the server
        await rankPlayers({ variables: { input: upr } });
        client.refetchQueries({ include: [GET_A_TEAM] })
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
    let activeList = [...playerList.filter((p)=> p.status === EPlayerStatus.ACTIVE)];
    const draggedPlayer = activeList.splice(dragPI.current, 1);
    if (draggedPlayer && draggedPlayer.length > 0) {
      activeList.splice(dragOverPI.current, 0, draggedPlayer[0]);
    } else {
      activeList = [...playerList];
    }
    const updatedRanking = activeList.map((p, i) => ({ rank: i += 1, _id: p._id }));
    // setPlayerRanking(updatedRanking);
    // setPlayerActiveClone(activeList);
    await handleUpdate(updatedRanking);
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!rankControls) return;
    e.preventDefault(); // Prevent scrolling
  }

  const checkAssignments = (pt?: ITeam[]): boolean => {
    let assigned = false;
    if (pt) {
      const teamsOfPlayer = pt.map((t) => t._id);      
      for (let i = 0; i < teamsOfPlayer.length; i += 1) {
        if (teamIds?.includes(teamsOfPlayer[i])) assigned = true;
      }
    }  
    return assigned;
  }




  return (
    <div className='mt-2'>
      <ul className='flex flex-wrap items-center gap-2'>
        {playerList.map((player: IPlayerExpRel, index) => player.status === EPlayerStatus.ACTIVE && <PlayerCard key={player._id} eventId={eventId} player={player} index={index} teamId={teamId}
          setIsLoading={setIsLoading} touchDragStart={handleDragStart} touchDragEnter={handleDragEnter} isAssigned={checkAssignments(player?.teams)}
          touchDragEnd={handleDragEnd} touchMove={handleTouchMove} rankControls={rankControls} showRank={showRank} divisionList={divisionList} teamList={teamList} />)}
      </ul>
      <h3 className="mt-4">Inactive Players</h3>
      <ul className='flex flex-wrap items-center gap-2'>
        {playerList.map((player: IPlayerExpRel, index) => player.status === EPlayerStatus.INACTIVE && <PlayerCard key={player._id} eventId={eventId} player={player} index={index} teamId={teamId}
          setIsLoading={setIsLoading} touchDragStart={handleDragStart} touchDragEnter={handleDragEnter} isAssigned={checkAssignments(player?.teams)}
          touchDragEnd={handleDragEnd} touchMove={handleTouchMove} divisionList={divisionList} teamList={teamList} />)}
      </ul>
    </div>
  )
}

export default PlayerList;