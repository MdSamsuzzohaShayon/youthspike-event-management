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
import PlayerAdd from '@/components/player/PlayerAdd';
import DirectorAdd from '@/components/ldo/DirectorAdd';
import { GET_LDO } from '@/graphql/director';
import { getCookie } from '@/utils/cookie';
import { GET_CAPTAIN } from '@/graphql/captain';

const SettingsPage = ({ params }: { params: { eventId: string } }) => {
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const user = useUser();

  /**
   * Read query from cache or fetch data from server
   */
  const [fetchEvent, { data, loading, error }] = useLazyQuery(GET_A_EVENT, { variables: { eventId: params.eventId } });
  const [fetchCaptain, { data: captainData, error: captainErr, loading: captainLoading }] = useLazyQuery(GET_CAPTAIN);

  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        const user = getCookie('user')
        if (user) {
          const userRes = JSON.parse(user)
          if (userRes.role === UserRole.captain) {
            fetchCaptain({ variables: { userId: userRes._id } });
          } else {
            fetchEvent({ variables: { eventId: params.eventId } });
          }
        }
      } else {
        setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [params.eventId]);

  if (loading || isLoading || captainLoading) return <Loader />;
  const prevEvent = data?.getEvent?.data;

  const precisedCaptain = {
    name: "", logo: "",
    director: {
      firstName: captainData?.getUser?.data?.firstName,
      lastName: captainData?.getUser?.data?.lastName,
      email: "",
      password: "",
      confirmPassword: "",
    }
  };


  // Fetch previous player

  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='capitalize'>{user.info?.role === UserRole.captain ? "Update captain" : "Update Event"}</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {user.info?.role === UserRole.captain ? (captainData && <DirectorAdd update setIsLoading={setIsLoading} prevLdo={precisedCaptain} setActErr={setActErr} />) : (<EventAddUpdate update setIsLoading={setIsLoading} setActErr={setActErr} prevEvent={prevEvent} />)}

    </div>
  )
}

export default SettingsPage;