'use client'

import React, { useState, useEffect } from 'react';
import Message from '@/components/elements/Message';
import EventAddUpdate from '@/components/event/EventAddUpdate';
import { IError, } from '@/types';
import { UserRole } from '@/types/user';
import { useLazyQuery, useQuery } from '@apollo/client';
import { GET_A_EVENT } from '@/graphql/event';
import Loader from '@/components/elements/Loader';
import { isValidObjectId } from '@/utils/helper';
import { useUser } from '@/lib/UserProvider';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import { getCookie } from '@/utils/cookie';
import { GET_CAPTAIN } from '@/graphql/captain';
import PlayerAdd from '@/components/player/PlayerAdd';
import { GET_A_PLAYER } from '@/graphql/players';

const SettingsPage = ({ params }: { params: { eventId: string } }) => {
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const user = useUser();

  /**
   * Read query from cache or fetch data from server
   */
  const [fetchEvent, { data, loading, error, client }] = useLazyQuery(GET_A_EVENT, { variables: { eventId: params.eventId } }); 
  const [fetchPlayer, { data: playerData, error: playerErr, loading: playerLoading }] = useLazyQuery(GET_A_PLAYER);

  // 65d8b250efd88fce90a62619
  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        const user = getCookie('user')
        if (user) {
          const userRes = JSON.parse(user)
          if (userRes.role === UserRole.captain) {
            if(userRes.captainplayer){
              fetchPlayer({ variables: { playerId: userRes.captainplayer } });
            }else if(userRes.cocaptainplayer){
              fetchPlayer({ variables: { playerId: userRes.cocaptainplayer } });
            }
          } else {
            fetchEvent({ variables: { eventId: params.eventId } });
          }
        }
      } else {
        setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [params.eventId]);

  if (loading || isLoading || playerLoading) return <Loader />;
  
  const prevEvent = data?.getEvent?.data;  
  const prevPlayer = playerData?.getPlayer?.data;

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='capitalize'>{user.info?.role === UserRole.captain ? "Update captain" : "Update Event"}</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {user.info?.role === UserRole.captain
        ? (prevPlayer && <PlayerAdd eventId={params.eventId} setIsLoading={setIsLoading} update prevPlayer={prevPlayer} divisionList={[]} teamList={[]} />)
        : (prevEvent && <EventAddUpdate update setIsLoading={setIsLoading} setActErr={setActErr} prevEvent={prevEvent} />)}

    </div>
  )
}

export default SettingsPage;