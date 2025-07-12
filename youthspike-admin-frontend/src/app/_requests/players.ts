import { GET_A_PLAYER_RAW, GET_EVENT_PLAYERS_GROUPS_TEAMS_RAW, GET_EVENT_WITH_TEAM_PLAYERS_RAW, GET_PLAYER_AND_TEAMS_RAW, GET_PLAYERS_MIN_RAW } from '@/graphql/players';
import handleServerResponse from '@/utils/handlerServerResponse';
import { isValidObjectId } from '@/utils/helper';
import { BACKEND_URL } from '@/utils/keys';

async function getAPlayer(playerId: string | null) {
  if (!isValidObjectId(playerId)) return null;

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_A_PLAYER_RAW,
      variables: { playerId }, // { playerId: params.playerId }
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  // return data?.getPlayer?.data || null;
  return handleServerResponse(data, 'getPlayer');
}

async function getEventWithPlayers(eventId: string) {
  if (!isValidObjectId(eventId)) return null;

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_EVENT_WITH_TEAM_PLAYERS_RAW,
      variables: { eventId }, // { eventId: params.eventId }
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  // return data?.getEvent?.data || null;
  return handleServerResponse(data, 'getEvent');
}

async function getEventPlayersGroupsTeams(eventId: string, token?: string | null) {
  if (!isValidObjectId(eventId)) {
    return null;
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify({
      query: GET_EVENT_PLAYERS_GROUPS_TEAMS_RAW,
      variables: { eventId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  return handleServerResponse(data, 'getEventWithPlayers');
}

async function getPlayerAndTeams(playerId: string, eventId: string) {
  if (!isValidObjectId(playerId) || !isValidObjectId(eventId)) {
    return null;
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_PLAYER_AND_TEAMS_RAW,
      variables: { playerId, eventId },
    }),
    cache: 'no-store',
  });
  // const success = await handleResponse({ response: playerRes?.data?.getEvent, setActErr });

  const { data } = await res.json();
  // return data?.getPlayerAndTeams?.data || null;
  return handleServerResponse(data, 'getPlayerAndTeams');
}

async function getPlayersMin() {
  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_PLAYERS_MIN_RAW,
    }),
    cache: 'no-store',
  });
  // const success = await handleResponse({ response: playerRes?.data?.getEvent, setActErr });

  const { data } = await res.json();
  // return data?.getPlayers?.data || null;
  return handleServerResponse(data, 'getPlayers');
}

export { getEventWithPlayers, getEventPlayersGroupsTeams, getPlayerAndTeams, getAPlayer, getPlayersMin };
