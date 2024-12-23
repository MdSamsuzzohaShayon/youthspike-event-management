'use client';

import React, { useEffect } from 'react';
import Loader from '@/components/elements/Loader';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client';
import TeamDetail from '@/components/team/TeamDetail';
import { GET_A_TEAM } from '@/graphql/team';
import { useAppDispatch } from '@/redux/hooks';
import { setActErr } from '@/redux/slices/elementSlice';

interface TeamSinglePageProps {
  params: { teamId: string };
}

function TeamSinglePage({ params: { teamId } }: TeamSinglePageProps) {
  const [fetchTeam, { data, loading }] = useLazyQuery(GET_A_TEAM, { variables: { teamId }, fetchPolicy: 'network-only' });
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (teamId) {
      if (isValidObjectId(teamId)) {
        fetchTeam({ variables: { teamId } });
      } else {
        dispatch(setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId!' }));
      }
    }
  }, [dispatch, fetchTeam, teamId]);

  if (loading) return <Loader />;

  const teamData = data?.getTeam?.data;
  const eventData = data?.getTeam?.data?.event;

  return <div className="container mx-auto px-2 min-h-screen">{teamData && <TeamDetail event={eventData} team={teamData} />}</div>;
}

export default TeamSinglePage;
