'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import CurrentEvent from '@/components/event/CurrentEvent';
import MatchAdd from '@/components/match/MatchAdd';
import MatchList from '@/components/match/MatchList';
import { GET_EVENT_WITH_MATCHES_TEAMS } from '@/graphql/matches';
import { useUser } from '@/lib/UserProvider';
import { IDefaultEventMatch, IDefaultMatchProps, IError, IEvent, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { isValidObjectId, toMatchDefaultData } from '@/utils/helper';
import { useLazyQuery, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';


/**
 * Test Match
 * alex.cooper@youthspike.com
 * lily.ward@youthspike.com
 */

function MatchesPage({ params }: { params: { eventId: string } }) {
  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addMatch, setAddMatch] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);

  // Hooks
  const user = useUser();

  // Fetch teams and players of the teams
  const [fetchEvent, { data, loading, error }] = useLazyQuery(GET_EVENT_WITH_MATCHES_TEAMS, { variables: { eventId: params.eventId } });

  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        fetchEvent({ variables: { eventId: params.eventId } });
      } else {
        setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [params.eventId]);

  if (loading || isLoading) return <Loader />;

  const eventData = data?.getEvent?.data;

  return (
    <div className="container mx-auto px-2 min-h-screen">
      <h1 className='mb-8 text-center'>Matches</h1>
      {data?.getEvent?.data && (<CurrentEvent currEvent={data?.getEvent?.data} />)}
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {addMatch ? <>
        {/* Only director and admin can create match  */}
        {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
          <>
            <button type="button" className='btn-info mb-4' onClick={() => setAddMatch(false)}>Match List</button>
            <MatchAdd matchData={toMatchDefaultData(eventData)} eventId={params.eventId} setActErr={setActErr} setIsLoading={setIsLoading} showAddMatch={setAddMatch} />
          </>
        )}
      </> : <>
        {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && <button type="button" className='btn-info mb-4' onClick={() => setAddMatch(true)}>Add Match</button>}
        <br />
        {eventData?.matches && eventData?.matches.length > 0 ? <MatchList eventId={params.eventId} divisions={eventData.divisions} matchList={eventData.matches} /> : <p>No match created yet!</p>}
      </>}
      <br />
    </div>
  )
}

export default MatchesPage