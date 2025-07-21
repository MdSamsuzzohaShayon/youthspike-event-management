import { GET_PLAYER_WITH_STATS_RAW } from '@/graphql/player-stats';
import handleServerResponse from '@/utils/handleServerError';
import { BACKEND_URL } from '@/utils/keys';

async function getPlayerWithStats(playerId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_PLAYER_WITH_STATS_RAW,
        variables: { playerId },
      }),
      cache: 'no-store',
    });

    const { data, errors } = await res.json();
    return handleServerResponse(data, 'getPlayerWithStats', errors);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export { getPlayerWithStats };
