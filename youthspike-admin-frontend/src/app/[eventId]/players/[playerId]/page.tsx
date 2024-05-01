'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import PlayerAdd from '@/components/player/PlayerAdd';
import { GET_A_EVENT } from '@/graphql/event';
import { GET_A_PLAYER } from '@/graphql/players';
import { IError, IPlayerExpRel } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import { useQuery } from '@apollo/client';
import React, { useState } from 'react';


function PlayerSingle({ params }: { params: { eventId: string, playerId: string } }) {
  // ====== Local State ========
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actErr, setActErr]= useState<IError | null>(null);


  const { data, error, loading } = useQuery(GET_A_PLAYER, { variables: { playerId: params.playerId } });
  const { data: eventData, error: eventErr, loading: eventLoading } = useQuery(GET_A_EVENT, { variables: { eventId: params.eventId } });

  // ======  Callback functions ====== 
  const playerUpdateCB = (playerData: IPlayerExpRel) => { }

  if (loading || isLoading || eventLoading) return <Loader />;

  const prevPlayer = data?.getPlayer?.data;
  

  const teamList = eventData?.getEvent?.data?.teams ? eventData?.getEvent?.data?.teams : [];

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1>Player Update</h1>
      {actErr && <Message error={actErr} />}
      {error && <Message error={error} />}
      {prevPlayer && <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} update prevPlayer={prevPlayer} teamList={teamList} playerUpdateCB={playerUpdateCB} setActErr={setActErr} />}
    </div>
  )
}

export default PlayerSingle;