import React, { Suspense } from "react";
import { GET_AN_EVENT } from "@/graphql/event";
import { EEventItem, IEventDetailData, IEventFilter, TParams } from "@/types";
import Loader from "@/components/elements/Loader";
import EventDetail from "@/components/event/EventDetail";
import { PreloadQuery } from "@/lib/client";
import { QueryRef } from "@apollo/client/react";

interface IEventPageProps {
  params: TParams;
  searchParams: { [key: string]: string | string[] | undefined };
}

async function EventPage({ params, searchParams }: IEventPageProps) {
  const { eventId } = await params;

  const search = await searchParams;

  // Extract from query string
  const item = (search.item as EEventItem) || EEventItem.MATCH;
  const limit = search.limit ? Number(search.limit) : 30;

  const filter: Partial<IEventFilter> = {
    item,
    limit,
  };

  return (
    <div className="w-full min-h-screen">
      <PreloadQuery query={GET_AN_EVENT} variables={{ eventId, filter }}>
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <EventDetail
              queryRef={
                queryRef as QueryRef<{
                  getEventDetails: { data: IEventDetailData };
                }>
              }

              eventId={eventId}
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

export default EventPage;