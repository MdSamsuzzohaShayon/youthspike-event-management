'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import PlayerAdd from '@/components/player/PlayerAdd';
import { GET_A_PLAYER } from '@/graphql/players';
import { useQuery } from '@apollo/client';
import React, { useState } from 'react';


function PlayerSingle({ params }: { params: { eventId: string, playerId: string } }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { data, error, loading } = useQuery(GET_A_PLAYER, { variables: { playerId: params.playerId } });

  if (loading || isLoading) return <Loader />;

  const prevPlayer = data?.getPlayer?.data;

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1>Player Update</h1>
      {error && <Message error={error} />}
      {prevPlayer && <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} update prevPlayer={prevPlayer} /> }
    </div>
  )
}

export default PlayerSingle;