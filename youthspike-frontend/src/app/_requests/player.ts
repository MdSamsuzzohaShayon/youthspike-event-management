import { GET_EVENTS_RAW } from '@/graphql/event';
import { GET_A_PLAYER_RAW, GET_PLAYER_AND_TEAMS_RAW } from '@/graphql/player';
import { IPlayer } from '@/types';
import handleServerResponse from '@/utils/handleServerError';
import { BACKEND_URL } from '@/utils/keys';

async function getPlayer(playerId: string): Promise<IPlayer> {
  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_A_PLAYER_RAW,
      variables: { playerId },
    }),
    cache: 'no-store',
  });

  const { data, errors } = await res.json();
  return handleServerResponse(data, 'getPlayer', errors);
}

export { getPlayer };
