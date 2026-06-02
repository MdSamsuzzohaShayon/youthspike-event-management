'use client';

import { IGetEventsWithTeamsResponse } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import PlayerAdd from './PlayerAdd';

interface IProps {
  queryRef: QueryRef<{ getEventsWithTeams: IGetEventsWithTeamsResponse }>;
}

function PlayerAddContainer({ queryRef }: IProps) {
  const { data } = useReadQuery(queryRef);

  const eventsTeamsData = data?.getEventsWithTeams?.data;

  if (!eventsTeamsData) throw new Error('Event not found!');

  return (
    <div>
      <h1>Add New Player</h1>

      <PlayerAdd events={eventsTeamsData?.events || []} teams={eventsTeamsData?.teams || []} />
    </div>
  );
}

export default PlayerAddContainer;
