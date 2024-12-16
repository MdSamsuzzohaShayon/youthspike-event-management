"use client"

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import UserMenuList from '@/components/layout/UserMenuList';
import TeamAdd from '@/components/teams/TeamAdd';
import { GET_A_TEAM } from '@/graphql/teams';
import { IError, IEventExpRel, IPlayer } from '@/types';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

function TeamUpdatePage({ params }: { params: { eventId: string, teamId: string } }) {
  const [fetchTeam, { data, loading, error, refetch }] = useLazyQuery(GET_A_TEAM, { variables: { teamId: params.teamId }, fetchPolicy: "network-only" });

  const [actErr, setActErr] = useState<IError | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClose = () => {

  }

  const handleRefetch = async () => {
    // You can call refetch here to manually refetch the data
    await refetch({ variables: { teamId: params.teamId } });
  };

  useEffect(() => {
    if (params.teamId) {
      if (isValidObjectId(params.teamId)) {
        fetchTeam({ variables: { teamId: params.teamId } });
      } else {
        setActErr({ success: false, message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }

  }, [params.teamId]);

  const teamData = data?.getTeam?.data;

  const groupList = teamData?.event?.groups ?? [];


  if (isLoading || loading) return <Loader />

  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='mb-8 text-center'>Update Team</h1>
      <div className="navigator mb-4">
        <UserMenuList eventId={params.eventId} />
      </div>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {teamData && <TeamAdd groupList={groupList} eventId={params.eventId} availablePlayers={availablePlayers} handleClose={handleClose} setActErr={setActErr}
        setAvailablePlayers={setAvailablePlayers} setIsLoading={setIsLoading} prevTeam={teamData} update refetchFunc={handleRefetch} />}
    </div>
  )
}

export default TeamUpdatePage;