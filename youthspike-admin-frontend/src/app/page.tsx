/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '@/lib/UserProvider';
import { CLONE_EVENT, DELETE_AN_EVENT, SEND_CREDENTIALS } from '@/graphql/event';
import { useLazyQuery, useMutation } from '@apollo/client';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import EventCard from '@/components/event/EventCard';
import { IEvent, IError } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { GET_LDO } from '@/graphql/director';
import cld from '@/config/cloudinary.config';
import { AdvancedImage } from '@cloudinary/react';
import { IUserContext, UserRole } from '@/types/user';
import Link from 'next/link';
import { handleResponse } from '@/utils/handleError';
import { getUserFromCookie } from '@/utils/cookie';
import { removeDivisionFromStore } from '@/utils/localStorage';
import Image from 'next/image';
import { useLdoId } from '@/lib/LdoProvider';
import { motion } from "framer-motion";
import { useError } from '@/lib/ErrorContext';

interface IItem {
  id: number;
  text: string;
}

const itemList: IItem[] = [
  { id: 1, text: 'Upcoming' },
  { id: 2, text: 'A-Z' },
  { id: 3, text: 'Upcoming Matches' },
  { id: 4, text: 'Orlando' },
];

function EventsPage() {
  // Hooks
  const user = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {ldoIdUrl} = useLdoId();
  const {setActErr} = useError();

  // Local States
  const [filteredItems, setFilteredItems] = useState<IItem[]>([]);
  const [eventList, setEventList] = useState<IEvent[]>([]);
  const [ldoId, setLdoId] = useState<string | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);
  const filterListEl = useRef<HTMLDialogElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // GraphQL Queries
  const [getLDO, { loading: ldoLoading, error: ldoError, data: ldoData }] = useLazyQuery(GET_LDO, { fetchPolicy: 'network-only' });
  const [cloneEvent] = useMutation(CLONE_EVENT);
  const [deleteEvent] = useMutation(DELETE_AN_EVENT);
  const [sendCredentials] = useMutation(SEND_CREDENTIALS);

  const fetchLDO = async () => {
    try {
      const instantUser: IUserContext = getUserFromCookie();
      if (instantUser.info?.role === UserRole.admin) {
        const newLdoId = searchParams.get('ldoId');
        if (!newLdoId) {
          router.push('/admin');
          return;
        }
        setLdoId(newLdoId);
        const ldoRes = await getLDO({ variables: { dId: newLdoId } }); // ldo id and director id Both will match

        const success = handleResponse({ response: ldoRes?.data?.getEventDirector, setActErr });
        if (success) {
          const newDirectorId = ldoRes?.data?.getEventDirector?.data?.director?._id;
          setDirectorId(newDirectorId);
        }
        if (ldoRes?.data?.getEventDirector?.data?.events) setEventList(ldoRes.data.getEventDirector.data.events);
      } else {
        setDirectorId(instantUser.info?._id ? instantUser.info._id : null);
        const ldoRes = await getLDO();
        const success = handleResponse({ response: ldoRes?.data?.getEventDirector, setActErr });
        if (success) {
          if (ldoRes?.data?.getEventDirector?.data?.events) setEventList(ldoRes.data.getEventDirector.data.events);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Events handle
  const handleFilter = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!filterListEl.current) return;
    filterListEl.current.showModal();
  };

  const handleSelectItem = (e: React.SyntheticEvent, iid: number) => {
    e.preventDefault();
    const alreadyExist = filteredItems.find((fl) => fl.id === iid);
    const findItem = itemList.find((il) => il.id === iid);
    if (!findItem || alreadyExist) return;
    setFilteredItems((prevState) => [...prevState, findItem]);
  };

  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (filterListEl.current) filterListEl.current.close();
  };

  const handleRemoveFilter = (e: React.SyntheticEvent, iid: number) => {
    e.preventDefault();
    setFilteredItems((prevState) => [...prevState.filter((fi) => fi.id !== iid)]);
  };

  const handleSendCredentials = async (eventId: string) => {
    try {
      setIsLoading(true);
      const res = await sendCredentials({ variables: { eventId } });
      console.log(res);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copy event - copy from server and redirect to edit page
   * Redirect to edit event page if event is been created successfully
   */
  const handleCopyEvent = async (e: React.SyntheticEvent, eventId: string) => {
    e.preventDefault();
    const eventResponse = await cloneEvent({ variables: { eventId } });
    if (eventResponse.data.cloneEvent.success !== true) {
      return setActErr({ code: eventResponse.data.cloneEvent.code, message: eventResponse.data.cloneEvent.message, success: false });
    }
    return router.push(`/${eventResponse.data.cloneEvent.data._id}/settings/${ldoIdUrl}`);
  };

  const handleDeleteEvent = async (e: React.SyntheticEvent, eventId: string) => {
    e.preventDefault();
    try {
      const eventResponse = await deleteEvent({ variables: { eventId } });
      if (eventResponse.data.deleteEvent.success !== true) {
        setActErr({ code: eventResponse.data.deleteEvent.code, message: eventResponse.data.deleteEvent.message, success: false })
        return ;
      }
    } catch (error) {
      console.log(error);
    }
    await fetchLDO();
  };

  useEffect(() => {
    fetchLDO();
    removeDivisionFromStore();
  }, [router, user]);

  if (ldoLoading || isLoading) return <Loader />;

  const newLdoData = ldoData?.getEventDirector?.data;

  return (
    <div className="events-page container px-6 mx-auto min-h-screen">
      <dialog ref={filterListEl}>
        <img src="/icons/close.svg" alt="close" className="w-6 svg-black" role="presentation" onClick={handleClose} />
        {itemList.map((item) => (
          <p key={item.id} role="presentation" onClick={(e) => handleSelectItem(e, item.id)}>
            {item.text}
          </p>
        ))}
      </dialog>
      <h1 className="my-4 text-center">Events Director</h1>
      {ldoError && <Message error={ldoError} />}
      <div className="box w-full flex flex-col justify-center items-center mb-4">
        {newLdoData?.logo ? (
          <div className="w-28 h-28 advanced-img rounded-full">
            <AdvancedImage className="" cldImg={cld.image(newLdoData?.logo)} />
          </div>
        ) : (
          <Image src="/free-logo.png" width={100} height={100} alt='sports-man-logo' className="w-28 h-28 rounded-full object-cover object-fill" />
        )}

        <h1>{newLdoData ? newLdoData.name : ''}</h1>
        <h2>Events</h2>
      </div>
      <div className="filter flex justify-between mb-2">
        <h3>All Events</h3>
        <h3 className="flex items-center justify-between" role="presentation" onClick={handleFilter}>
          Filters{' '}
          <span>
            <img src="/icons/filter.svg" className="svg-white w-6 ml-2 p-0 m-0 text-white" alt="filter" />
          </span>
        </h3>
      </div>
      <div className="filtered-elements flex flex-wrap gap-2 mb-4">
        {filteredItems.map((item) => (
          <p key={item.id} className="px-6 py-2 rounded-full bg-gray-800 flex items-center justify-between">
            {item.text}{' '}
            <span role="presentation" onClick={(e) => handleRemoveFilter(e, item.id)}>
              <img src="/icons/close.svg" className="svg-white w-6 ml-2 p-0 m-0" alt="close" />
            </span>
          </p>
        ))}
      </div>
      <div className="events flex flex-wrap gap-2 justify-between">
        <div className="event-card mb-1 p-2 bg-yellow-logo rounded-lg">
          <Link
            href={`/newevent/${ldoIdUrl}`}
            className="h-full w-full flex justify-center items-center flex-col gap-2 rounded-md"
          >
            <img src="/icons/plus.svg" alt="plus" className="w-12 svg-black" />
            <p className="text-black">Add New</p>
          </Link>
        </div>

        {eventList &&
          eventList.length > 0 &&
          eventList.map((event: IEvent) => (
            <EventCard key={event._id} copyEvent={handleCopyEvent} deleteEvent={handleDeleteEvent} sendCredentials={handleSendCredentials} event={event} />
          ))}
      </div>
    </div>
  );
}

export default EventsPage;
