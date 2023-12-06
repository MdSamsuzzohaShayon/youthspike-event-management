'use client'

import React, { useState, useEffect } from 'react';
import Message from '@/components/elements/Message';
import EventAddUpdate from '@/components/event/EventAddUpdate';
import { IError } from '@/types';
import { useLazyQuery, useQuery } from '@apollo/client';
import { GET_A_EVENT } from '@/graphql/event';
import Loader from '@/components/elements/Loader';
import { isValidObjectId } from '@/utils/helper';

const SettingsPage = ({ params }: { params: { eventId: string } }) => {
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /**
   * Read query from cache or fetch data from server
   */
  const [fetchEvent, { data, loading, error }] = useLazyQuery(GET_A_EVENT, { variables: { eventId: params.eventId } });

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
  const prevEvent = data?.getEvent?.data;


  return (
    <div className='container mx-auto px-2'>
      <h1>Update Event</h1>
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      <EventAddUpdate update setIsLoading={setIsLoading} setActErr={setActErr} prevEvent={prevEvent} />
    </div>
  )
}

export default SettingsPage;