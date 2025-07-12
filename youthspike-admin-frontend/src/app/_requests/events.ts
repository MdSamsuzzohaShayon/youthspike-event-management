import { GET_AN_EVENT_RAW, GET_EVENTS_MIN_RAW } from "@/graphql/event";
import { IEvent } from "@/types";
import handleServerResponse from "@/utils/handlerServerResponse";
import { isValidObjectId } from "@/utils/helper";
import { BACKEND_URL } from "@/utils/keys";

async function getMinEvents() {

    const res = await fetch(`${BACKEND_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: GET_EVENTS_MIN_RAW,
        }),
        cache: 'no-store',
    });

    const { data } = await res.json();
    
    // return data?.getEvents?.data || null;
    return handleServerResponse(data, 'getEvents');
}

async function getAnEvent(eventId: string): Promise<IEvent | null> {
     if (!isValidObjectId(eventId)) {
          return null;
      }

    const res = await fetch(`${BACKEND_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: GET_AN_EVENT_RAW,
            variables: {eventId}
        }),
        cache: 'no-store',
    });

    const { data } = await res.json();
    
    // return data?.getEvent?.data || null;
    return handleServerResponse(data, 'getEvent');
}


export { getMinEvents, getAnEvent };

