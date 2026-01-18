'use client';

import { IEvent, IGetMatchResponse, IGetTeamWithGroupsAndUnassignedPlayersResponse } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import React, { useState } from 'react';
import EventNavigation from '../layout/EventNavigation';
import TeamAdd from './TeamAdd';

interface IProps {
  queryRef: QueryRef<{ getTeamWithGroupsAndUnassignedPlayers: IGetTeamWithGroupsAndUnassignedPlayersResponse }>;
  eventId: string;
}
function TeamUpdateContainer({ eventId, queryRef }: IProps) {
  const { data } = useReadQuery(queryRef);

  const teamData = data?.getTeamWithGroupsAndUnassignedPlayers?.data;
  if (!teamData) {
    throw new Error('Team not found');
  }

  const { event, team, groups, players } = teamData;

  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div>
      <div className="navigation my-8">
        <EventNavigation event={event as unknown as IEvent} />
      </div>
      <h1>Update Team</h1>
      {teamData && <TeamAdd groupList={groups} prevTeam={team} eventId={eventId} setIsLoading={setIsLoading} update players={players} handleClose={() => {}} />}
    </div>
  );
}

export default TeamUpdateContainer;
