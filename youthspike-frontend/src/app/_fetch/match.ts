import { GET_EVENTS_RAW } from '@/graphql/event';
import { BACKEND_URL } from '@/utils/keys';

async function getEvents() {
  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_EVENTS_RAW,
    }),
    cache: 'no-store',
  });
  // const success = handleResponse({ response: playerRes?.data?.getEvent, setActErr });

  const { data } = await res.json();
  return data?.getEvents?.data || null;
}

export default getEvents;
