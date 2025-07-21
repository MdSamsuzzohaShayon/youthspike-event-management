import { GET_TEAM_DETAIL_RAW } from '@/graphql/team';
import handleServerResponse from '@/utils/handleServerError';
import { isValidObjectId } from '@/utils/helper';
import { BACKEND_URL } from '@/utils/keys';

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

  const { data, errors } = await res.json();
  return handleServerResponse(data, 'getTeamDetails', errors);
}

export default getTeamData;
