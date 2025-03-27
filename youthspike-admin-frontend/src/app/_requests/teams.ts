import { GET_EVENT_WITH_TEAMS_RAW, GET_TEAM_DETAIL_RAW } from "@/graphql/teams";
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
  return data?.getTeamDetails?.data || null;
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
  return data?.getEventWithTeams?.data || null;
}


export { getTeamData, getEventWithTeams };