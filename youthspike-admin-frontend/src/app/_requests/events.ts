import { GET_AN_EVENT_RAW, GET_EVENTS_MIN_RAW } from "@/graphql/event";
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
    
    return data?.getEvents?.data || null;
}

// async function getAnEvent(eventId: string) {
//      if (!isValidObjectId(eventId)) {
//           return null;
//       }

//     const res = await fetch(`${BACKEND_URL}/graphql`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             query: GET_AN_EVENT_RAW,
//             variables: {eventId}
//         }),
//         cache: 'no-store',
//     });

//     const { data } = await res.json();
    
//     return data?.getEvent?.data || null;
// }


export { getMinEvents };

