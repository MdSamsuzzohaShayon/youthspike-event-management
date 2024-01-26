'use client'

import { GET_EVENT_WITH_PLAYERS, GET_PLAYERS } from '@/graphql/players';
import { IPlayer } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import PlayerList from '@/components/player/PlayerList';
import { gql, useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IError, IEventExpRel, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';

function PlayersPage({ params }: { params: { eventId: string } }) {

  const user = useUser();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);
  const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
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
  const teamIds = data?.getEvent?.data?.teams ? data?.getEvent?.data?.teams.map((t: ITeam) => t._id) : [];
  const teamList = data?.getEvent?.data?.teams ? data?.getEvent?.data?.teams : [];
  const divisionList = data?.getEvent?.data?.divisions ? divisionsToOptionList(data?.getEvent?.data?.divisions) : [];


  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='mb-8 text-center'>Players</h1>
      {data?.getEvent?.data && (<CurrentEvent currEvent={data?.getEvent?.data} />)}
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {addPlayer ? (<>
        <h3 className='mt-4'>Player Add</h3>
        <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(false)} >Player List</button>
        <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} update={false} setAddPlayer={setAddPlayer} divisionList={divisionList} teamList={teamList} />
      </>) : (<>
        <h3 className='mt-4' >Player List</h3>
        {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
          <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(true)} >Add player</button>
        )}
        <PlayerList playerList={players} eventId={params.eventId} teamId={null} setIsLoading={setIsLoading} setAddPlayer={setAddPlayer} teamIds={teamIds} />
      </>)}
    </div>
  )
}

export default PlayersPage;