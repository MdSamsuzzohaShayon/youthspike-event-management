import { GET_EVENT_WITH_MATCHES_RAW } from "@/graphql/matches";
import { isValidObjectId } from "@/utils/helper";
import { BACKEND_URL } from "@/utils/keys";

async function getEventWithMatches(eventId: string) {
    if (!isValidObjectId(eventId)) {
        return null;
    }

    const res = await fetch(`${BACKEND_URL}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: GET_EVENT_WITH_MATCHES_RAW,
            variables: { eventId },
        }),
        cache: 'no-store',
    });

    const { data } = await res.json();
    return data?.getEventWithMatches?.data || null;
}


export { getEventWithMatches };