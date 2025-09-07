import React, { Suspense } from "react";
import { IEventDetailData, TParams } from "@/types";
import Loader from "@/components/elements/Loader";
import { PreloadQuery } from "@/lib/client";
import { QueryRef } from "@apollo/client";
import EventDetail from "@/components/event/EventDetail";
import { GET_AN_EVENT } from "@/graphql/event";

interface IEventPageProps {
  params: TParams;
}
async function EventPage({ params }: IEventPageProps) {
  const { eventId } = await params;

  return (
    <div className="w-full min-h-screen">
      <PreloadQuery
        query={GET_AN_EVENT}
        variables={{
          eventId: eventId,
        }}
      >
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <EventDetail
              queryRef={
                queryRef as QueryRef<{
                  getEventDetails: { data: IEventDetailData };
                }>
              }
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

export default EventPage;
