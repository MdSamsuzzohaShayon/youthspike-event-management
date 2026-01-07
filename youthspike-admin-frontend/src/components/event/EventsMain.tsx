'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '@/lib/UserProvider';
import { DELETE_AN_EVENT, EXPORT_PLAYERS, SEND_CREDENTIALS } from '@/graphql/event';
import Loader from '@/components/elements/Loader';
import EventCard from '@/components/event/EventCard';
import { IEvent, IGetEventDirectorQuery, IOption, IPlayer, IResponse } from '@/types';
import { redirect, useRouter } from 'next/navigation';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import Image from 'next/image';
import { useLdoId } from '@/lib/LdoProvider';
import { useError } from '@/lib/ErrorProvider';
import EventFilterDialog from './EventFilterDialog';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import { QueryRef, useMutation, useReadQuery } from '@apollo/client/react';
import CloneEventDialog from './CloneEventDialog';

const itemList: IOption[] = [
  { id: 1, text: 'Upcoming', value: 'upcoming' },
  { id: 2, text: 'A-Z', value: 'a-z' },
  { id: 3, text: 'Upcoming Matches', value: 'upcoming-matches' },
  { id: 4, text: 'Orlando', value: 'orlando' },
];

interface IPlayerExport extends Pick<IPlayer, 'username' | 'division'> {
  name: string;
  team: string | null;
  matches: string[];
}

interface IExportData extends IResponse {
  data?: IPlayerExport[];
}


interface IEventsMainProps {
  queryRef: QueryRef<{ getEventDirector: IGetEventDirectorQuery }>;
}

function EventsMain({ queryRef }: IEventsMainProps) {
  // Hooks
  const user = useUser();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();
  

  // Local States
  const [filteredItems, setFilteredItems] = useState<IOption[]>([]);
  const filterListEl = useRef<HTMLDialogElement | null>(null);
  const copyEventEl = useRef<HTMLDialogElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<null | IEvent>(null);

  // Read query data from Apollo (Suspense friendly)
  const { data, error } = useReadQuery(queryRef);
  if (data?.getEventDirector?.code === 401) {
    redirect('/api/logout');
  }

  const ldo = data?.getEventDirector?.data?.director;
  const events = data?.getEventDirector?.data?.events ?? [];

  // GraphQL Queries
  const [deleteEvent] = useMutation<{ deleteEvent: IResponse }>(DELETE_AN_EVENT);
  const [sendCredentials] = useMutation<{ sendCredentials: IResponse }>(SEND_CREDENTIALS);
  const [exportPlayers] = useMutation<{ exportPlayers: IExportData }>(EXPORT_PLAYERS);

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
    filterListEl.current?.close();
  };

  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (filterListEl.current) filterListEl.current.close();
  };

  const handleRemoveFilter = (e: React.SyntheticEvent, iid: number) => {
    e.preventDefault();
    setFilteredItems((prevState) => [...prevState.filter((fi) => fi.id !== iid)]);
  };

  const handleExportPlayers = async (e: React.SyntheticEvent, eventId: string) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await exportPlayers({ variables: { eventId } });

      const playerList = res?.data?.exportPlayers?.data;
      if (!playerList || playerList.length === 0) {
        console.log('No players found.');
        return;
      }

      // ---- GENERATE CSV ---- //
      const csvRows: string[] = [];
      const headers = ['Name', 'Username', 'Division', 'Team', 'Matches'];
      csvRows.push(headers.join(','));

      playerList.forEach((player: IPlayerExport) => {
        const row = [`"${player.name || ''}"`, `"${player.username || ''}"`, `"${player.division || ''}"`, `"${player.team || ''}"`, `"${(player.matches || []).join('; ')}"`];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // ---- TRIGGER DOWNLOAD ---- //
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'players.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
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
    let eventExist = null;
    for (const event of events) {
      if (event._id === eventId) {
        eventExist = event;
        break;
      }
    }
    setSelectedEvent(eventExist || null);
    if (eventExist) {
      copyEventEl.current?.showModal();
    }


  };

  const handleDeleteEvent = async (e: React.SyntheticEvent, eventId: string) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const eventResponse = await deleteEvent({ variables: { eventId } });
      if (eventResponse.data?.deleteEvent.success !== true) {
        setActErr({ code: eventResponse.data?.deleteEvent.code, message: eventResponse.data?.deleteEvent.message, success: false });
        return;
      }
      window.location.reload();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    SessionStorageService.removeItem(DIVISION);
  }, [router, user]);

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      <h1 className="my-4 text-center">Events Director</h1>
      <div className="box w-full flex flex-col justify-center items-center mb-4">
        {ldo?.logo ? (
          <div className="w-28 h-28 advanced-img rounded-full">
            <CldImage crop="fit" width={100} height={100} alt="LDO logo" className="w-24" src={ldo?.logo} />
          </div>
        ) : (
          <Image src="/free-logo.png" width={100} height={100} alt="sports-man-logo" className="w-28 h-28 object-cover object-fill" />
        )}

        <h1>{ldo ? ldo.firstName : ''}</h1>
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
              <Image height={50} width={50} src="/icons/close.svg" className="svg-white w-6 ml-2 p-0 m-0" alt="close" />
            </span>
          </p>
        ))}
      </div>
      <div className="events flex flex-wrap gap-2 justify-between">
        <div className="event-card mb-1 p-2 bg-yellow-gradient rounded-lg">
          <Link href={`/newevent/${ldoIdUrl}`} className="h-full w-full flex justify-center items-center flex-col gap-2 rounded-md">
            <img src="/icons/plus.svg" alt="plus" className="w-12 svg-black" />
            <p className="text-black">Add New</p>
          </Link>
        </div>

        {events &&
          events.length > 0 &&
          events.map((event: IEvent) => (
            <EventCard key={event._id} event={event} copyEvent={handleCopyEvent} deleteEvent={handleDeleteEvent} sendCredentials={handleSendCredentials} handleExportPlayers={handleExportPlayers} />
          ))}
      </div>

      <CloneEventDialog copyEventEl={copyEventEl} event={selectedEvent} setActErr={setActErr} />

      <EventFilterDialog filterListEl={filterListEl} itemList={itemList} onClose={handleClose} onSelectItem={handleSelectItem} />
    </React.Fragment>
  );
}

export default EventsMain;
