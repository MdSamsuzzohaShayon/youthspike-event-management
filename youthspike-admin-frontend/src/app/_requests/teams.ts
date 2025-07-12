import { GET_A_TEAM_RAW, GET_EVENT_WITH_TEAMS_RAW, GET_TEAM_DETAIL_RAW, GET_TEAMS_MIN_RAW } from "@/graphql/teams";
import handleServerResponse from "@/utils/handlerServerResponse";
import { isValidObjectId } from "@/utils/helper";
import { BACKEND_URL } from "@/utils/keys";

async function getTeamData(teamId: string) {
  if (!isValidObjectId(teamId)) return null;

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_TEAM_DETAIL_RAW,
      variables: { teamId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  // return data?.getTeamDetails?.data || null;
  return handleServerResponse(data, 'getTeamDetails');
}

async function getTeamsMin(eventId?: string) {
  if (eventId && !isValidObjectId(eventId)) return null;

  const variables:  Record<string, any> = {};
  if(eventId) variables.event = eventId;

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_TEAMS_MIN_RAW,
      variables,
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  // return data?.getTeams?.data || null;
  return handleServerResponse(data, 'getTeams');
}

async function getATeam(teamId: string) {
  if (!isValidObjectId(teamId)) return null;

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_A_TEAM_RAW,
      variables: { teamId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  // return data?.getTeam?.data || null;
  return handleServerResponse(data, 'getTeam');
}


async function getEventWithTeams(eventId: string) {
  if (!isValidObjectId(eventId)) {
    return null;
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_EVENT_WITH_TEAMS_RAW,
      variables: { eventId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  // return data?.getEventWithTeams?.data || null;
  return handleServerResponse(data, 'getEventWithTeams');
}


export { getTeamData, getEventWithTeams, getATeam, getTeamsMin };