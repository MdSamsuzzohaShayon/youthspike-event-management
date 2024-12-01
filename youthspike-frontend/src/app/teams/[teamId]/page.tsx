'use client';

import React, { useEffect, useState } from 'react';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { IError } from '@/types';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client';
import TeamDetail from '@/components/team/TeamDetail';
import { GET_A_TEAM } from '@/graphql/team';

interface TeamSinglePageProps {
  params: { teamId: string };
}

function TeamSinglePage({ params: { teamId } }: TeamSinglePageProps) {
  const [fetchTeam, { data, loading, error }] = useLazyQuery(GET_A_TEAM, { variables: { teamId }, fetchPolicy: 'network-only' });
  const [actErr, setActErr] = useState<IError | null>(null);


  useEffect(() => {
    if (teamId) {
      if (isValidObjectId(teamId)) {
        fetchTeam({ variables: { teamId } });
      } else {
        setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId!' });
      }
    }
  }, [fetchTeam, teamId]);

  if (loading ) return <Loader />;

  const teamData = data?.getTeam?.data;
  const eventData = data?.getTeam?.data?.event;
  

  return (
    <div className="container mx-auto px-2 min-h-screen">
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {teamData && <TeamDetail event={eventData} team={teamData} />}
    </div>
  );
}

export default TeamSinglePage;
