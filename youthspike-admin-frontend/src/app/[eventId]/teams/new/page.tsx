'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import TeamAdd from '@/components/teams/TeamAdd';
import { GET_EVENT_WITH_PLAYERS, GET_PLAYERS } from '@/graphql/players';
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
  const [fetchPlayers, { loading, data, error }] = useLazyQuery(GET_EVENT_WITH_PLAYERS);
  const [actErr, setActErr] = useState<IError | null>(null);
  const [divisions, setDivisions] = useState<string>('');


  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
  }

  useEffect(() => {
    (async () => {
      if (params.eventId) {
        if (isValidObjectId(params.eventId)) {
          const playerRes = await fetchPlayers({ variables: { eventId: params.eventId } });
          if (playerRes?.data?.getEvent?.data?.players) {
            console.log(playerRes?.data?.getEvent?.data);

            // Get all team ids
            const newAvailablePlayers = playerRes.data.getEvent.data.players.filter((p: IPlayer) => !p.teams || p.teams.length === 0);
            if (newAvailablePlayers.length > 0) setAvailablePlayers(newAvailablePlayers);
            // const [divisions, setDivisions] = useState<string>('');
            setDivisions(playerRes?.data?.getEvent?.data?.divisions ? playerRes.data.getEvent.data.divisions : '');
          }
        } else {
          setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
        }
      }
    })()
  }, [params.eventId]);

  if (loading || isLoading) return <Loader />;

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='mt-4 text-center'>Teams</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <TeamAdd setIsLoading={setIsLoading} availablePlayers={availablePlayers} handleClose={handleClose} eventId={params.eventId} divisions={divisions} />
    </div>
  )
}

export default TeamsPage;