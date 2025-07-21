import { GET_EVENTS_RAW } from '@/graphql/event';
import handleServerResponse from '@/utils/handleServerError';
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

  const { data, errors } = await res.json();
  return handleServerResponse(data, 'getEvents', errors);
}

export { getEvents };
