'use client';

import Loader from '@/components/elements/Loader';
import EventDetail from '@/components/event/EventDetail';
import { GET_AN_EVENT } from '@/graphql/event';
import { IError } from '@/types';
import { isValidObjectId } from '@/utils/helper';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';

function EventSingle({ params }: { params: { eventId: string } }) {
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Read query from cache or fetch data from server
   */
  const [fetchEvent, { data, loading }] = useLazyQuery(GET_AN_EVENT, { variables: { eventId: params.eventId }, fetchPolicy: 'network-only' });

  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        fetchEvent({ variables: { eventId: params.eventId } });
      } else {
        setActErr({ message: 'Can not fetch data due to invalid event ObjectId!' });
      }
    }
  }, [fetchEvent, params.eventId]);

  if (loading || isLoading) return <Loader />;

  const prevEvent = data?.getEvent?.data;

  return <div className="container mx-auto px-2 min-h-screen">{prevEvent && <EventDetail event={prevEvent} />}</div>;
}

export default EventSingle;
