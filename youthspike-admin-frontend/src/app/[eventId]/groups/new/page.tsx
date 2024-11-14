'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import GroupAddOrUpdate from '@/components/group/GroupAddOrUpdate';
import { GET_EVENT_WITH_GROUP } from '@/graphql/group';
import { GET_EVENT_WITH_MATCHES_TEAMS } from '@/graphql/matches';
import { IError, IGroupAdd, IGroupRelatives, ITeam } from '@/types';
import { handleResponse } from '@/utils/handleError';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

interface INetGroupProps {
  params: {
    eventId: string;
  }
}

function NewGroup({ params: { eventId } }: INetGroupProps) {

  // Get event with divisions, teams and groups
  const [getEvent, { data, loading, error }] = useLazyQuery(GET_EVENT_WITH_GROUP, { variables: { eventId }, fetchPolicy: 'network-only' });

  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [divisions, setDivisions] = useState<string>('');

  const fetchEvent = async () => {
    const eventResponse = await getEvent();
    const success = handleResponse({ response: eventResponse?.data?.getEvent, setActErr });
    if (success) {
      if (eventResponse?.data?.getEvent?.data?.teams) setTeamList(eventResponse?.data?.getEvent?.data?.teams);
      if (eventResponse?.data?.getEvent?.data?.divisions) setDivisions(eventResponse?.data?.getEvent?.data?.divisions);
    }
  }

  useEffect(() => {
    fetchEvent();
  }, []);

  console.log(teamList, divisions);
  

  if (isLoading) return <Loader />;


  return (
    <div className="container mx-auto px-2 min-h-screen">
      <h1 className="my-4 text-center">New Group</h1>
      <div className="new-event-wrapper mb-5">
        {actErr && <Message error={actErr} />}
        <GroupAddOrUpdate update={false} setActErr={setActErr} setIsLoading={setIsLoading} divisions={divisions} teamList={teamList} eventId={eventId} />
      </div>
    </div>
  );
}

export default NewGroup