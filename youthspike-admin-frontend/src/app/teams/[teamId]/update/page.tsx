import { IGetTeamWithGroupsAndUnassignedPlayersResponse, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import TeamUpdateContainer from '@/components/teams/TeamUpdateContainer';
import { GET_TEAM_WITH_GROUPS_AND_UNASSIGNED_PLAYERS } from '@/graphql/teams';

interface IUpdateTeamPageProps {
  params: TParams;
  searchParams: TParams;
}

async function UpdateTeamPage({ params, searchParams }: IUpdateTeamPageProps) {
  const { teamId } = await params;
  const { ldoId } = await searchParams;

  const variables = {
    teamId,
    ldoId
  };
  return (
    <PreloadQuery query={GET_TEAM_WITH_GROUPS_AND_UNASSIGNED_PLAYERS} variables={variables}>
      {(queryRef) => <TeamUpdateContainer queryRef={queryRef as QueryRef<{ getTeamWithGroupsAndUnassignedPlayers: IGetTeamWithGroupsAndUnassignedPlayersResponse }>} />}
    </PreloadQuery>
  );
}

export default UpdateTeamPage;
