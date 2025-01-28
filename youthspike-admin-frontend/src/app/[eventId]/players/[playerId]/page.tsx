'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import PlayerAdd from '@/components/player/PlayerAdd';
import { GET_A_EVENT } from '@/graphql/event';
import { GET_A_PLAYER } from '@/graphql/players';
import { useError } from '@/lib/ErrorContext';
import { IError, IPlayerExpRel } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import { useQuery } from '@apollo/client';
import React, { useEffect, useRef, useState } from 'react';


function PlayerSingle({ params }: { params: { eventId: string, playerId: string } }) {
  // ====== Local State ========
  const [isLoading, setIsLoading] = useState<boolean>(false);
    const {setActErr} = useError();
  


  const { data, error, loading, refetch } = useQuery(GET_A_PLAYER, { variables: { playerId: params.playerId }, fetchPolicy: "network-only" });
  const { data: eventData, error: eventErr, loading: eventLoading } = useQuery(GET_A_EVENT, { variables: { eventId: params.eventId } });

  // ======  Callback functions ====== 
  const playerUpdateCB = (playerData: IPlayerExpRel) => { }
  
  const refetchFunc= async ()=>{
    await refetch();
  }

  if (loading || isLoading || eventLoading) return <Loader />;


  const prevPlayer = data?.getPlayer?.data;

  const teamList = eventData?.getEvent?.data?.teams ? eventData?.getEvent?.data?.teams : [];

  if(error){
    console.log(error);
    
  }

  
  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1>Player Update</h1>
      {prevPlayer && <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} update prevPlayer={prevPlayer} refetchFunc={refetchFunc} teamList={teamList} playerUpdateCB={playerUpdateCB} 
       />}
    </div>
  )
}

export default PlayerSingle;