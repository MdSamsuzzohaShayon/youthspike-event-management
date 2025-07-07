import { GET_A_MATCH_RAW, GET_MATCHES_MIN_RAW } from '@/graphql/matches';
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

  const { data } = await res.json();
  return data?.getMatch?.data || null;
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

  const { data } = await res.json();
  return data?.getMatches?.data || null;
}

export { getMatch, getMatchesMin };
