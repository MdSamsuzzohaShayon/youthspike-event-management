'use client';

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setEventList } from '@/redux/slices/eventSlice';
import { useAppSelector } from '@/redux/hooks';
import { AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/SocketProvider';
import { removeEvent } from '@/utils/localStorage';
import { IEventWMatch } from '@/types';
import EventList from './EventList';


interface IEventMainProps {
  events: IEventWMatch[];
}

function EventMain({ events }: IEventMainProps) {
  // ===== Hooks =====
  const dispatch = useDispatch();
  const socket = useSocket();


  // ===== Redux =====
  const { eventList } = useAppSelector((state) => state.events);
  // console.log(eventList);

  // ===== Local State =====

  useEffect(() => {
    removeEvent();
    dispatch(setEventList(events));
  }, [dispatch, events]);

  // ===== Web Socket Real Time connection =====
  useEffect(() => {
    if (socket) {
      // const eventListener = new Event 
    }
  }, [socket]);


  return (
    <AnimatePresence>
      <div className="event-list mt-4">{eventList && eventList.length > 0 && <EventList eventList={eventList} />}</div>
    </AnimatePresence>
  );
}

export default EventMain;
