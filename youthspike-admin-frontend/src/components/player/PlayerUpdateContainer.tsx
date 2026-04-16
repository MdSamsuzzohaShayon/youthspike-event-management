'use client';

import { IPlayerAndTeamsResponse } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import PlayerAdd from './PlayerAdd';

interface IProps {
  queryRef: QueryRef<{ getPlayerAndTeams: IPlayerAndTeamsResponse }>;
  eventId?: string;
}
function PlayerUpdateContainer({ eventId, queryRef }: IProps) {
  const { data } = useReadQuery(queryRef);

  const playerData = data?.getPlayerAndTeams?.data;
  if (!playerData) {
    throw new Error('Team not found');
  }

  const { player, teams, events } = playerData;




  return (
    <div className='min-h-screen container mx-auto px-4'>
      <h1>Update Team</h1>
      <PlayerAdd eventId={eventId} update prevPlayer={player} teamList={teams || []} />
    </div>
  );
}

export default PlayerUpdateContainer;
