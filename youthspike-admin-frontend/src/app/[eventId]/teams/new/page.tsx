'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import TeamAdd from '@/components/teams/TeamAdd';
import { GET_PLAYERS } from '@/graphql/players';
import { IError } from '@/types';
import { IPlayer } from '@/types/player';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

interface ITeamsPageProps {
  params: { eventId: string }
}

function TeamsPage({ params }: ITeamsPageProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);
  const [fetchPlayers, { loading, data, error }] = useLazyQuery(GET_PLAYERS);
  const [actErr, setActErr] = useState<IError | null>(null);

  
  const handleTeamAdd=(e: React.SyntheticEvent)=>{
    e.preventDefault();
  }

  const handleClose=(e: React.SyntheticEvent)=>{
    e.preventDefault();
  }
  
  useEffect(() => {
    (async () => {
      if (params.eventId) {
        if(isValidObjectId(params.eventId)){
          const playerRes = await fetchPlayers({ variables: { eventId: params.eventId } });
          if (playerRes?.data?.getPlayers?.data) {
            const newAvailablePlayers = playerRes.data.getPlayers.data.filter((p:IPlayer) => !p.team);
            if (newAvailablePlayers.length > 0) setAvailablePlayers(newAvailablePlayers);
          }
        }else{
          setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
        }
      }
    })()
  }, [params.eventId]);
  if(loading || isLoading) return <Loader />;

  return (
    <div className='container mx-auto px-2'>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <p>List of teams</p>
      <p>Add New Team(Assign players to the team)</p>
      <p>Make captain</p>
      <p>Handle error</p>
      <TeamAdd setIsLoading={setIsLoading} availablePlayers={availablePlayers} handleClose={handleClose} eventId={params.eventId} />
    </div>
  )
}

export default TeamsPage;