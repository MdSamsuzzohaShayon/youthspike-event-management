import { GET_EVENTS_RAW } from '@/graphql/event';
import { GET_MATCH_DETAIL_RAW } from '@/graphql/matches';
import { BACKEND_URL } from '@/utils/keys';

async function getMatch(matchId: string) {
  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_MATCH_DETAIL_RAW,
      variables: { matchId }
    }),
    cache: 'no-store',
  });
  // const success = handleResponse({ response: playerRes?.data?.getEvent, setActErr });

  const { data } = await res.json();
  return data?.getMatch?.data || null;
}

export {getMatch};
