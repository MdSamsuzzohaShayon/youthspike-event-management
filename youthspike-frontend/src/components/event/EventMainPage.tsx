'use client';

import { GET_EVENTS } from '@/graphql/event';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setEventList } from '@/redux/slices/eventSlice';
import { useAppSelector } from '@/redux/hooks';
import { IEvent } from '@/types';
import EventList from './EventList';
import Loader from '../elements/Loader';
import EventPagination from './EventPagination';

function EventMainPage() {
  const EVENT_PAGE_LIMIT = 10;

  // ===== Hooks =====
  const dispatch = useDispatch();

  // ===== GraphQL =====
  const [getEvents, { loading }] = useLazyQuery(GET_EVENTS, { fetchPolicy: 'network-only' });

  // ===== Redux =====
  const { eventList } = useAppSelector((state) => state.events);

  // ===== Local State =====
  const [filteredEventList, setFilteredEventList] = useState<IEvent[]>([]);
  const [listStart, setListStart] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const res = await getEvents();
      if (res?.data?.getEvents?.data) {
        // dispatch(setEventList(res.data.getEvents.data));

        // const dummyEventList = dummyEvents();
        dispatch(setEventList(res.data.getEvents.data));
        setFilteredEventList(res.data.getEvents.data.slice(listStart, EVENT_PAGE_LIMIT));
      }
    })();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto px-2 min-h-screen">
      <h1>Events</h1>
      <div className="event-list mt-4">{filteredEventList && filteredEventList.length > 0 && <EventList eventList={filteredEventList} />}</div>

      <div className="psgination-wrapper w-full mt-4 ">
        <EventPagination EVENT_PAGE_LIMIT={EVENT_PAGE_LIMIT} listStart={listStart} eventList={eventList} setListStart={setListStart} setFilteredEventList={setFilteredEventList} />
      </div>
    </div>
  );
}

export default EventMainPage;
