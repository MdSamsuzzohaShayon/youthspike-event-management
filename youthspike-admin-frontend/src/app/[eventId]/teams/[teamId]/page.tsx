'use client'

import React, { useEffect, useState } from 'react';
import Loader from '@/components/elements/Loader';
import TeamDetail from '@/components/teams/TeamDetail';
import { GET_A_TEAM } from '@/graphql/teams';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client';
import { setTeamToStore } from '@/utils/localStorage';
import { useError } from '@/lib/ErrorContext';
import { GET_MATCHES } from '@/graphql/matches';

interface TeamSingleMainProps {
  params: { teamId: string, eventId: string },
}

function TeamSingleMain({ params: { teamId, eventId } }: TeamSingleMainProps) {

  const [fetchTeam, { data, loading, error, refetch }] = useLazyQuery(GET_A_TEAM, { variables: { teamId }, fetchPolicy: "network-only" });
  const [fetchMatches, { data: matchesData, refetch: matchesFetch }] = useLazyQuery(GET_MATCHES, { variables: { filter: { event: eventId } }, fetchPolicy: "network-only" });
  const { setActErr } = useError();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetchFunc = async () => {
    await refetch();
    await matchesFetch();
  }

  useEffect(() => {
    if (teamId) {
      if (isValidObjectId(teamId)) {
        fetchTeam({ variables: { teamId } });
        fetchMatches({ variables: { filter: { event: eventId } } });
        setTeamToStore(teamId);
      } else {
        setActErr({ success: false, message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [teamId]);

  if (loading || isLoading) return <Loader />;

  const teamData = data?.getTeam?.data;
  const eventData = data?.getTeam?.data?.event;
  const divisionList = data?.getTeam?.data?.event?.divisions ? divisionsToOptionList(data?.getTeam?.data?.event?.divisions) : [];
  const teamList = data?.getTeam?.data?.event?.teams ? data?.getTeam?.data?.event?.teams : [];
  const playerList = data?.getTeam?.data?.event?.players ? data?.getTeam?.data?.event?.players : [];
  const playerRanking = data?.getTeam?.data?.playerRanking;
  const matchList = matchesData?.getMatches?.data || [];

  if (error) {
    console.log(error);

  }


  console.log({playerRanking, data});
  

  return (
    <div className='container mx-auto px-4 min-h-screen'>
      {teamData && <TeamDetail event={eventData} team={teamData} eventId={eventId} setIsLoading={setIsLoading}
        divisionList={divisionList} teamList={teamList} refetchFunc={refetchFunc} playerList={playerList} playerRanking={playerRanking} matchList={matchList} />}

    </div>
  )
}

export default TeamSingleMain;