import { GET_EVENT_WITH_GROUP_RAW, GET_GROUPS_RAW } from "@/graphql/group";
import { isValidObjectId } from "@/utils/helper";
import { BACKEND_URL } from "@/utils/keys";

async function getEventWithGroups(eventId: string) {
  if (!isValidObjectId(eventId)) {
    return null;
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_EVENT_WITH_GROUP_RAW,
      variables: { eventId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  return data?.getEvent?.data || null;
}

async function getAllGroups(eventId: string) {
  if (!isValidObjectId(eventId)) {
    return null;
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_GROUPS_RAW,
      variables: { eventId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  return data?.getEvent?.data || null;
}


export {getEventWithGroups, getAllGroups};