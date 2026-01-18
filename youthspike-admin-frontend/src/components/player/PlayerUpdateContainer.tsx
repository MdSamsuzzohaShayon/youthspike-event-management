'use client';

import { IEvent, IPlayerAndTeamsResponse } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import EventNavigation from '../layout/EventNavigation';
import PlayerAdd from './PlayerAdd';
import { useEffect } from 'react';
import SessionStorageService from '@/utils/SessionStorageService';
import { TEAM } from '@/utils/constant';

interface IProps {
  queryRef: QueryRef<{ getPlayerAndTeams: IPlayerAndTeamsResponse }>;
  eventId: string;
}
function PlayerUpdateContainer({ eventId, queryRef }: IProps) {
  const { data } = useReadQuery(queryRef);

  const playerData = data?.getPlayerAndTeams?.data;
  if (!playerData) {
    throw new Error('Team not found');
  }

  const { player, teams, event } = playerData;




  return (
    <div>
      <div className="navigation my-8">
        <EventNavigation event={event as unknown as IEvent} />
      </div>
      <h1>Update Team</h1>
      <PlayerAdd eventId={eventId} update prevPlayer={player} teamList={teams || []} />
    </div>
  );
}

export default PlayerUpdateContainer;
