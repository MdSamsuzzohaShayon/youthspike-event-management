// GET_AN_EVENT_RAW

import { GET_AN_EVENT_RAW } from '@/graphql/event';
import { isValidObjectId } from '@/utils/helper';
import { BACKEND_URL } from '@/utils/keys';

async function getEventDetails(eventId: string) {
  if (!isValidObjectId(eventId)) {
    return null;
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_AN_EVENT_RAW,
      variables: { eventId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  return data?.getEventDetails?.data || null;
}

export default getEventDetails;
