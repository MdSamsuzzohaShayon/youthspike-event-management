import { GET_TEAMS_AND_MATCHES_RAW } from "@/graphql/teams";
import { isValidObjectId } from "@/utils/helper";
import { BACKEND_URL } from "@/utils/keys";

async function getTeamStandings(eventId: string) {
    if (!isValidObjectId(eventId)) {
      return null;
    }
  
    const res = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_TEAMS_AND_MATCHES_RAW,
        variables: { eventId },
      }),
      cache: 'no-store', // Ensures fresh data on each request
    });
  
    const { data } = await res.json();
    return data?.getTeamStandings?.data || null;
  }

  export {getTeamStandings};