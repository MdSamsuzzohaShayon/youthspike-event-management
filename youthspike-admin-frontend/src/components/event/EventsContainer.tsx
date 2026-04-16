'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  Fragment,
} from 'react';
import { useUser } from '@/lib/UserProvider';
import {
  DELETE_AN_EVENT,
  EXPORT_PLAYERS,
  SEND_CREDENTIALS,
  UPDATE_EVENT,
} from '@/graphql/event';
import Loader from '@/components/elements/Loader';
import EventCard from '@/components/event/EventCard';
import {
  IEvent,
  IGetEventDirectorQuery,
  IOption,
  IPlayer,
  IResponse,
} from '@/types';
import { redirect, useRouter } from 'next/navigation';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import Image from 'next/image';
import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import { QueryRef, useMutation, useReadQuery } from '@apollo/client/react';
import CloneEventDialog from './CloneEventDialog';

/* ========================================================= */
/* ===================== Static Data ======================= */
/* ========================================================= */

const FILTER_OPTIONS: IOption[] = [
  { id: 1, text: 'Upcoming', value: 'upcoming' },
  { id: 2, text: 'A-Z', value: 'a-z' },
  { id: 3, text: 'Upcoming Matches', value: 'upcoming-matches' },
  { id: 4, text: 'Orlando', value: 'orlando' },
];

/* ========================================================= */
/* ===================== Sub Components ==================== */
/* ========================================================= */

interface FilterDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  options: IOption[];
  onSelect: (filterId: number) => void;
  onClose: () => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  dialogRef,
  options,
  onSelect,
  onClose,
}) => (
  <dialog ref={dialogRef} className="modal-dialog">
    <Image
      height={100}
      width={100}
      src="/icons/close.svg"
      alt="close"
      className="w-6 svg-black"
      role="presentation"
      onClick={onClose}
    />
    {options.map((option) => (
      <p
        key={option.id}
        role="presentation"
        onClick={() => onSelect(option.id)}
      >
        {option.text}
      </p>
    ))}
  </dialog>
);

/* ========================================================= */
/* ==================== Main Component ===================== */
/* ========================================================= */

interface EventsContainerProps {
  queryRef: QueryRef<{ getEventDirector: IGetEventDirectorQuery }>;
}

const EventsContainer: React.FC<EventsContainerProps> = ({
  queryRef,
}) => {
  const user = useUser();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { showMessage, setMessage, clearMessage } = useMessage();

  /* ---------------- State ---------------- */

  const [activeFilters, setActiveFilters] = useState<IOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

  const filterDialogRef = useRef<HTMLDialogElement | null>(null);
  const cloneDialogRef = useRef<HTMLDialogElement | null>(null);

  /* ---------------- Data ---------------- */

  const { data } = useReadQuery(queryRef);

  if (data?.getEventDirector?.code === 401) {
    redirect('/api/logout');
  }

  const director = data?.getEventDirector?.data?.director;
  const directorEvents = data?.getEventDirector?.data?.events ?? [];

  /* ---------------- Lookup Map (Performance Boost) ---------------- */

  const eventMap = useMemo(() => {
    const map = new Map<string, IEvent>();
    directorEvents.forEach((event) => map.set(event._id, event));
    return map;
  }, [directorEvents]);

  /* ---------------- Mutations ---------------- */

  const [deleteEventMutation] =
    useMutation<{ deleteEvent: IResponse }>(DELETE_AN_EVENT);

  const [sendCredentialsMutation] =
    useMutation<{ sendCredentials: IResponse }>(SEND_CREDENTIALS);

  const [exportPlayersMutation] =
    useMutation(EXPORT_PLAYERS);

  const [setDefault] = useMutation<{ updateEvent: IResponse }>(UPDATE_EVENT);

  /* ---------------- Handlers ---------------- */

  const openFilterDialog = useCallback(() => {
    filterDialogRef.current?.showModal();
  }, []);

  const closeFilterDialog = useCallback(() => {
    filterDialogRef.current?.close();
  }, []);

  const selectFilter = useCallback(
    (filterId: number) => {
      const selected = FILTER_OPTIONS.find(
        (opt) => opt.id === filterId
      );
      if (!selected) return;

      setActiveFilters((prev) =>
        prev.some((f) => f.id === filterId)
          ? prev
          : [...prev, selected]
      );

      closeFilterDialog();
    },
    [closeFilterDialog]
  );

  const removeFilter = useCallback((filterId: number) => {
    setActiveFilters((prev) =>
      prev.filter((f) => f.id !== filterId)
    );
  }, []);

  const handleExportPlayers = useCallback(
    async (eventId: string) => {
      try {
        setIsLoading(true);

        const res = await exportPlayersMutation({
          variables: { eventId },
        });

        // @ts-ignore
        const players = res?.data?.exportPlayers?.data;
        if (!players?.length) return;

        const headers = ['Name', 'Username', 'Division', 'Team', 'Matches'];
        const rows = players.map((player: any) => [
          `"${player.name ?? ''}"`,
          `"${player.username ?? ''}"`,
          `"${player.division ?? ''}"`,
          `"${player.team ?? ''}"`,
          `"${(player.matches ?? []).join('; ')}"`,
        ]);

        const csvContent = [headers, ...rows]
          .map((row) => row.join(','))
          .join('\n');

        const blob = new Blob([csvContent], {
          type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = 'players.csv';
        anchor.click();

        URL.revokeObjectURL(url);
      } finally {
        setIsLoading(false);
      }
    },
    [exportPlayersMutation]
  );

  const handleCopyEvent = useCallback(
    (eventId: string) => {
      const event = eventMap.get(eventId);
      if (!event) return;

      setSelectedEvent(event);
      cloneDialogRef.current?.showModal();
    },
    [eventMap]
  );

  const handleSetDefault = useCallback(
    async (eventId: string, defaulted: boolean = false) => {
      const event = eventMap.get(eventId);
      if (!event) return;
      const res = await setDefault({ variables: { sponsorsInput: [], updateInput: { defaulted }, eventId } });
      if (!res.data?.updateEvent.success) {
        showMessage({ message: res.data?.updateEvent?.message, type: "error" });
        return;
      }

      // Update cache
    },
    [eventMap]
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      try {
        setIsLoading(true);

        const res = await deleteEventMutation({
          variables: { eventId },
        });

        if (!res.data?.deleteEvent.success) {
          showMessage({ message: res.data?.deleteEvent?.message, type: "error" });
          return;
        }

        window.location.reload();
      } finally {
        setIsLoading(false);
      }
    },
    [deleteEventMutation, showMessage]
  );

  const handleSendCredentials = useCallback(
    async (eventId: string) => {
      try {
        setIsLoading(true);
        await sendCredentialsMutation({
          variables: { eventId },
        });
      } finally {
        setIsLoading(false);
      }
    },
    [sendCredentialsMutation]
  );

  useEffect(() => {
    SessionStorageService.removeItem(DIVISION);
  }, [router, user]);

  if (isLoading) return <Loader />;

  /* ---------------- Render ---------------- */

  return (
    <Fragment>
      <h1 className="my-4 text-center">Events Director</h1>
      <div className="box w-full flex flex-col items-center mb-4">
        {director?.logo ? (
          <div className="w-28 h-28 advanced-img rounded-full">
            <CldImage
              crop="fit"
              width={100}
              height={100}
              alt="Director logo"
              className="w-24"
              src={director.logo}
            />
          </div>
        ) : (
          <Image
            src="/free-logo.png"
            width={100}
            height={100}
            alt="default-logo"
            className="w-28 h-28"
          />
        )}

        <h1>{director?.firstName ?? ''}</h1>
        <h2>Events</h2>
      </div>

      <div className="filter flex justify-between mb-2">
        <h3>All Events</h3>
        <h3 role="presentation" onClick={openFilterDialog}>
          Filters
        </h3>
      </div>

      <div className="filtered-elements flex flex-wrap gap-2 mb-4">
        {activeFilters.map((filter) => (
          <p
            key={filter.id}
            className="px-6 py-2 rounded-full bg-gray-800 flex items-center"
          >
            {filter.text}
            <span
              role="presentation"
              onClick={() => removeFilter(filter.id)}
            >
              <Image
                height={20}
                width={20}
                src="/icons/close.svg"
                alt="remove"
                className="svg-white ml-2"
              />
            </span>
          </p>
        ))}
      </div>

      <div className="events grid grid-cols-2 gap-2">
        <div className="event-card bg-yellow-gradient rounded-lg">
          <Link
            href={`/events/new/${ldoIdUrl}`}
            className="flex flex-col items-center justify-center h-full"
          >
            <img src="/icons/plus.svg" alt="plus" className="w-12" />
            <p className="text-black">Add New</p>
          </Link>
        </div>

        {directorEvents.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onCopy={(_, id) => handleCopyEvent(id)}
            onDelete={(_, id) => handleDeleteEvent(id)}
            onSetDefault={handleSetDefault}
            onSendCredentials={handleSendCredentials}
            onExportPlayers={(_, id) => handleExportPlayers(id)}
          />
        ))}
      </div>

      <CloneEventDialog
        copyEventRef={cloneDialogRef}
        event={selectedEvent}
      />

      <FilterDialog
        dialogRef={filterDialogRef}
        options={FILTER_OPTIONS}
        onClose={closeFilterDialog}
        onSelect={selectFilter}
      />
    </Fragment>
  );
};

export default EventsContainer;