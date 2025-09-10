import React, { Suspense } from "react";
import { IEventDetailData, TParams } from "@/types";
import Loader from "@/components/elements/Loader";
import EventDetail from "@/components/event/EventDetail";
import { notFound } from "next/navigation";
import getEventDetails from "../_fetch/event";

interface IEventPageProps {
  params: TParams;
}

async function EventPage({ params }: IEventPageProps) {
  const { eventId } = await  params;

  // Fetch the event details directly using getEventDetails
  const eventData = await getEventDetails(eventId);

  if (!eventData) {
    notFound();
  }

  return (
    <div className="w-full min-h-screen">
      <Suspense fallback={<Loader />}>
        <EventDetail eventData={eventData} />
      </Suspense>
    </div>
  );
}

export default EventPage;
