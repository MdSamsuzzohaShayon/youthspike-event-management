'use client'

import { GET_EVENT_WITH_PLAYERS, GET_PLAYERS } from '@/graphql/players';
import { IPlayer } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import PlayerList from '@/components/player/PlayerList';
import { gql, useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { isValidObjectId } from '@/utils/helper';
import { IError } from '@/types';

function PlayersPage({ params }: { params: { eventId: string } }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);
  const [fetchEvent, { data, loading, error }] = useLazyQuery(GET_EVENT_WITH_PLAYERS, { variables: { eventId: params.eventId } });

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
  
  const players = data?.getEvent?.data?.players ? data.getEvent.data.players : [];

  return (
    <div className='contaimer mx-auto px-2'>
      <h1 className="text-red-500">Read all instractions regarding creating player</h1>
      <h1 className="text-red-500">Model the database according to the instructions</h1>
      <h1 className="text-red-500">Do no follow  existing model</h1>

      <h1>Players</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <p>List of players of the event</p>
      <p>Add Player</p>
      <p>Update player</p>
      <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} />
      <PlayerList playerList={players} eventId={params.eventId} />
    </div>
  )
}

export default PlayersPage;