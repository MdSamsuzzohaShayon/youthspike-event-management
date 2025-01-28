'use client';

import { GET_EVENTS } from '@/graphql/event';
import { useLazyQuery } from '@apollo/client';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setEventList } from '@/redux/slices/eventSlice';
import { useAppSelector } from '@/redux/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { useSocket } from '@/lib/SocketProvider';
import { imgW } from '@/utils/constant';
import { logoAnimate } from '@/utils/animation';
import { APP_NAME } from '@/utils/keys';
import Image from 'next/image';
import { removeEvent } from '@/utils/localStorage';
import EventList from './EventList';
import Loader from '../elements/Loader';

const { animate, initial, exit, transition } = logoAnimate;

function EventMainPage() {
  // ===== Hooks =====
  const dispatch = useDispatch();
  const socket = useSocket();

  // ===== GraphQL =====
  const [getEvents, { loading }] = useLazyQuery(GET_EVENTS, { fetchPolicy: 'network-only' });

  // ===== Redux =====
  const { eventList } = useAppSelector((state) => state.events);
  // console.log(eventList);

  // ===== Local State =====

  useEffect(() => {
    (async () => {
      // Remove specific event
      removeEvent();
      const res = await getEvents();
      console.log(res?.data?.getEvents);
      
      if (res?.data?.getEvents?.data) {
        dispatch(setEventList(res.data.getEvents.data));
      }
    })();
  }, [dispatch, getEvents]);

  // ===== Web Socket Real Time connection =====
  useEffect(() => {
    if (socket) {
      // const eventListener = new Event 
    }
  }, [socket]);

  if (loading) return <Loader />;

  return (
    <AnimatePresence>
      <div className="container mx-auto px-2 min-h-screen">
        <motion.div initial={initial} animate={animate} exit={exit} transition={transition} className="logo-wrapper w-full flex items-center justify-center mt-4">
          <Image src="/free-logo.png" height={imgW.xs} width={imgW.xs} alt={APP_NAME} className="w-32" />
        </motion.div>
        <motion.h1 initial={initial} animate={animate} exit={exit} transition={transition} className="mt-8">
          Events
        </motion.h1>

        <div className="event-list mt-4">{eventList && eventList.length > 0 && <EventList eventList={eventList} />}</div>
      </div>
    </AnimatePresence>
  );
}

export default EventMainPage;
