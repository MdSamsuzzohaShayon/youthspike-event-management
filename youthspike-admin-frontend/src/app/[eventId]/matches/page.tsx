'use client'

import Loader from '@/components/elements/Loader'
import Message from '@/components/elements/Message'
import MatchAdd from '@/components/match/MatchAdd'
import MatchList from '@/components/match/MatchList'
import { GET_EVENT_WITH_MATCHES_TEAMS, GET_MATCHES } from '@/graphql/matches'
import { IError } from '@/types'
import { isValidObjectId } from '@/utils/helper'
import { useLazyQuery, useQuery } from '@apollo/client'
import React, { useEffect, useState } from 'react'

function MatchesPage({ params }: { params: { eventId: string } }) {
  const [actErr, setActErr] = useState<IError | null>(null);
  // Fetch teams and players of the teams
  const [fetchEvent, { data, loading, error } ]= useLazyQuery(GET_EVENT_WITH_MATCHES_TEAMS, { variables: { eventId: params.eventId } });

  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        fetchEvent({ variables: { eventId: params.eventId } });
      } else {
        setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [params.eventId]);

  if(loading) return <Loader />;

  const eventData = data?.getEvent?.data;

  return (
    <div className="container mx-auto px-2">
      <h1>Matches</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <MatchAdd eventData={eventData} />
      {eventData?.matches && <MatchList matches={eventData.matches} />}
    </div>
  )
}

export default MatchesPage