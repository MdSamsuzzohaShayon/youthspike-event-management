'use client';

import { QueryRef, useApolloClient, useMutation, useReadQuery } from '@apollo/client/react';
import { IGetArchiveEvent, IGetArchiveEvents, IGetTeamResponse } from '@/types';
import Image from 'next/image';
import ArchiveEventCard from './ArchiveEventCard';
import { ARCHIVE_EVENT_FRAGMENT, RESTORE_EVENT } from '@/graphql/archive';
import { handleApiResult } from '@/utils/handleError';
import { useMessage } from '@/lib/MessageProvider';

interface ArchiveMainContainerProps {
  queryRef: QueryRef<{ getArchivedEvents: IGetArchiveEvents }>;
}

export default function ArchiveMainContainer({
  queryRef,
}: ArchiveMainContainerProps) {
  const { data } = useReadQuery(queryRef);
  const [restoreEvent] = useMutation<{ restoreEvent: IGetArchiveEvent }>(RESTORE_EVENT);
  const apolloClient = useApolloClient();
  const {setMessage} = useMessage();


  const handleRestoreEvent = async (eventId: string) => {
    try {
      let responseData: IGetArchiveEvent | undefined;
  
      const restoreResult = await restoreEvent({
        variables: {
          eventId,
        },
      });
  
      if (restoreResult.error) {
        throw new Error(restoreResult.error.message);
      }
  
      responseData = restoreResult.data?.restoreEvent;
  
      if (!responseData) {
        throw new Error("No response received from server");
      }
  
      const result = handleApiResult({
        response: responseData,
      });
  
      if (result.code > 299) {
        throw new Error(result.message);
      }
  
      setMessage({
        type: "success",
        message: result.message || "Event restored successfully",
      });
  
      const restoredEvent = responseData.data;
  
      if (!restoredEvent) return;
  
      // Create/refresh normalized cache object
      apolloClient.cache.writeFragment({
        id: apolloClient.cache.identify({
          __typename: "Event",
          _id: restoredEvent._id,
        }),
        fragment: ARCHIVE_EVENT_FRAGMENT,
        data: {
          __typename: "Event",
          ...restoredEvent,
        },
      });
  
      // Remove from archived events list
      apolloClient.cache.modify({
        fields: {
          getArchivedEvents(existing, { readField }) {
            if (!existing) return existing;
  
            const existingData =
              readField<any[]>("data", existing) ?? [];
  
            return {
              ...existing,
              data: existingData.filter(
                (ref) => readField("_id", ref) !== restoredEvent._id
              ),
            };
          },
        },
      });
  
      // OPTIONAL:
      // If you have GET_EVENTS loaded elsewhere,
      // insert restoredEvent into that cache here.
  
    } catch (error) {
      console.error(error);
  
      setMessage({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong",
      });
    }
  };
  const archivedEvents = data?.getArchivedEvents?.data || [];

  return (
    <div className="">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-2 inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
            Archive
          </span>

          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Archived Events
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Browse previously archived tournaments and restore them whenever
            needed.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-3 backdrop-blur">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Total Events
          </p>
          <p className="text-3xl font-bold text-yellow-400">
            {archivedEvents.length}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {archivedEvents.map((event) => (
          <ArchiveEventCard event={event} key={event._id} onRestoreEvent={handleRestoreEvent} />
        ))}
      </div>

      {/* Empty State */}
      {archivedEvents.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-700 bg-zinc-900/30">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-500/10">
            <Image
              src="/icons/archive.svg"
              alt="Archive"
              width={40}
              height={40}
              className="svg-yellow"
            />
          </div>

          <h3 className="text-xl font-semibold">
            No Archived Events
          </h3>

          <p className="mt-2 max-w-md text-center text-zinc-500">
            Archived events will appear here once an event has been archived.
          </p>
        </div>
      )}
    </div>
  );
}