'use client';

import { IGetTeamWithGroupsAndUnassignedPlayersResponse } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import React, { useMemo, useState } from 'react';
import TeamAdd from './TeamAdd';
import Loader from '../elements/Loader';
import { divisionsOfEvents } from '@/utils/helper';

interface TeamUpdateContainerProps {
  queryRef: QueryRef<{ getTeamWithGroupsAndUnassignedPlayers: IGetTeamWithGroupsAndUnassignedPlayersResponse }>;
  eventId: string;
}

function TeamUpdateContainer({ eventId, queryRef }: TeamUpdateContainerProps) {
  const { data } = useReadQuery(queryRef);

  // Destructure team data safely
  const teamResponse = data?.getTeamWithGroupsAndUnassignedPlayers?.data;
  if (!teamResponse) return <p>Team not found</p>;

  const { events, team, groups, players } = teamResponse;

  // --------------------------
  // Memoized unique divisions
  // --------------------------
  const divisions = useMemo(() => divisionsOfEvents(events), [events]);

  // --------------------------
  // Loading state
  // --------------------------
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Update Team</h1>
      <TeamAdd
        groupList={groups}
        prevTeam={team}
        eventId={eventId}
        setIsLoading={setIsLoading}
        update
        players={players}
        handleClose={() => {}}
        divisions={divisions}
      />
    </div>
  );
}

export default TeamUpdateContainer;