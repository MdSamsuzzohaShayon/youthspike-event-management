import { QueryRef } from "@apollo/client/react";
import { PreloadQuery } from "@/lib/client";
import { IGetEventsResponse, IGetPlayerStats } from "@/types";
import { GET_EVENTS } from "@/graphql/event";
import EventContainer from "./EventContainer";


export async function EventPage() {

  return (
    <PreloadQuery query={GET_EVENTS} 
    >
      {(queryRef) => (
          <EventContainer
            queryRef={queryRef as QueryRef<{
              getEvents: IGetEventsResponse;
            }>}
          />
      )}
    </PreloadQuery>
  );
}

export default EventPage;
