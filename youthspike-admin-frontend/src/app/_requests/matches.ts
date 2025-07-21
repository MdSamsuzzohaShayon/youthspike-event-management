import { GET_A_MATCH_RAW, GET_MATCHES_MIN_RAW, GET_EVENT_WITH_MATCHES_RAW } from '@/graphql/matches';
import handleServerResponse from '@/utils/handlerServerResponse';
import { isValidObjectId } from '@/utils/helper';
import { BACKEND_URL } from '@/utils/keys';

async function getMatch(matchId: string) {
  
  if (!isValidObjectId(matchId)) return null;

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_A_MATCH_RAW,
      variables: { matchId },
    }),
    cache: 'no-store',
  });

  const { data, errors } = await res.json();
  return handleServerResponse(data, 'getMatch', errors);
}

async function getMatchesMin() {
  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_MATCHES_MIN_RAW,
    }),
    cache: 'no-store',
  });

  const { data, errors } = await res.json();
  return handleServerResponse(data, 'getMatches', errors);
}

async function getEventWithMatches(eventId: string) {
  try {
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

    const { data, errors } = await res.json();
    return handleServerResponse(data, 'getEventWithMatches', errors);
  } catch (error) {
    console.log(error);
    throw error;
  }

  //
}

export { getMatch, getMatchesMin, getEventWithMatches };
