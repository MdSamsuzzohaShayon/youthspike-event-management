'use client'

import React, { useEffect, useState } from 'react';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import TeamDetail from '@/components/teams/TeamDetail';
import { GET_A_TEAM } from '@/graphql/teams';
import { IError } from '@/types';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { useLazyQuery, useQuery } from '@apollo/client';
import Link from 'next/link';
import { removeTeamFromStore, setTeamToStore } from '@/utils/localStorage';

interface TeamSingleMainProps {
  params: { teamId: string, eventId: string },
}

function TeamSingleMain({ params: { teamId, eventId } }: TeamSingleMainProps) {
  /**
   * Need to test drag and drop with mobile (important)
   * Figma Link (Page 6) - https://www.figma.com/proto/PoBQKYzuq9IgmCLZMVu9MT/Dashboard-for-spikeball-app-(Client-file)?type=design&node-id=201-1660&t=a8dHq7FKsr2km2dX-1&scaling=min-zoom&page-id=0%3A1
   * League director can change captain
   * Captain can change team player ranking
   * 
   */
  const [fetchTeam, { data, loading, error, refetch }] = useLazyQuery(GET_A_TEAM, { variables: { teamId } });
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetchFunc = async () => {
    await refetch();
  }

  useEffect(() => {
    if (teamId) {
      if (isValidObjectId(teamId)) {
        fetchTeam({ variables: { teamId } });
        setTeamToStore(teamId);
      } else {
        setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [teamId]);

  if (loading || isLoading) return <Loader />;

  const teamData = data?.getTeam?.data;
  const eventData = data?.getTeam?.data?.event;
  const divisionList = data?.getTeam?.data?.event?.divisions ? divisionsToOptionList(data?.getTeam?.data?.event?.divisions) : [];
  const teamList = data?.getTeam?.data?.event?.teams ? data?.getTeam?.data?.event?.teams : [];


  return (
    <div className='container mx-auto px-2 min-h-screen'>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {teamData && <TeamDetail event={eventData} team={teamData} eventId={eventId} setIsLoading={setIsLoading} divisionList={divisionList} teamList={teamList} setActErr={setActErr} refetchFunc={refetchFunc} />}
    </div>
  )
}

export default TeamSingleMain;