import { IGetTeamWithGroupsAndUnassignedPlayersResponse, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import TeamUpdateContainer from '@/components/teams/TeamUpdateContainer';
import { GET_TEAM_WITH_GROUPS_AND_UNASSIGNED_PLAYERS } from '@/graphql/teams';

interface IProps {
  params: TParams;
}

async function UpdateTeamPage({ params }: IProps) {
  const pathParams = await params;
  const { eventId, teamId } = pathParams;
  return (
    <PreloadQuery query={GET_TEAM_WITH_GROUPS_AND_UNASSIGNED_PLAYERS} variables={{ teamId, eventId }}>
      {(queryRef) => <TeamUpdateContainer queryRef={queryRef as QueryRef<{ getTeamWithGroupsAndUnassignedPlayers: IGetTeamWithGroupsAndUnassignedPlayersResponse }>} eventId={eventId} />}
    </PreloadQuery>
  );
}

export default UpdateTeamPage;
