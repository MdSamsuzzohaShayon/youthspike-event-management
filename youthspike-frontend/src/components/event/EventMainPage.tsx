'use client';

import { GET_EVENTS } from '@/graphql/event';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setEventList } from '@/redux/slices/eventSlice';
import { useAppSelector } from '@/redux/hooks';
import { imgW } from '@/utils/constant';
import { APP_NAME } from '@/utils/keys';
import Image from 'next/image';
import EventList from './EventList';
import Loader from '../elements/Loader';

function EventMainPage() {
  // ===== Hooks =====
  const dispatch = useDispatch();

  // ===== GraphQL =====
  const [getEvents, { loading }] = useLazyQuery(GET_EVENTS, { fetchPolicy: 'network-only' });

  // ===== Redux =====
  const { eventList } = useAppSelector((state) => state.events);

  // ===== Local State =====

  useEffect(() => {
    (async () => {
      const res = await getEvents();
      if (res?.data?.getEvents?.data) {
        dispatch(setEventList(res.data.getEvents.data));
      }
    })();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto px-2 min-h-screen">
      <div className="logo-wrapper w-full flex items-center justify-center mt-4">
        <Image src="/free-logo.png" height={imgW.xs} width={imgW.xs} alt={APP_NAME} className="w-32" />
      </div>
      <h1 className="mt-8">Events</h1>

      <div className="event-list mt-4">{eventList && eventList.length > 0 && <EventList eventList={eventList} />}</div>
    </div>
  );
}

export default EventMainPage;
