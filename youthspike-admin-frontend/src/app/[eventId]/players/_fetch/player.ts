// 

import { GET_EVENT_WITH_PLAYERS_RAW } from "@/graphql/players";
import { isValidObjectId } from "@/utils/helper";
import { BACKEND_URL } from "@/utils/keys";


async function getEventWithPlayers(eventId: string) {
    if (!isValidObjectId(eventId)) {
        return null;
    }

    const res = await fetch(`${BACKEND_URL}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: GET_EVENT_WITH_PLAYERS_RAW,
            variables: { eventId },
        }),
        cache: 'no-store',
    });
    // const success = handleResponse({ response: playerRes?.data?.getEvent, setActErr });

    const { data } = await res.json();
    return data?.getEventWithPlayers?.data || null;
}


export { getEventWithPlayers };