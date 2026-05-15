import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { IGetEventWithGroupsAndUnassignedPlayersResponse, TParams } from '@/types';
import { GET_EVENT_WITH_GROUPS_AND_UNASSIGNED_PLAYERS } from '@/graphql/event';
import TeamAddContainer from '@/components/teams/TeamAddContainer';

interface INewTeamCompProps {
  searchParams: TParams;
}

// eventId, groupList, handleClose, setIsLoading, players, update, prevTeam, currDivision, divisions
async function NewTeamComp({ searchParams }: INewTeamCompProps) {
  const { ldoId } = await searchParams;

  const variables: Record<string, string> = {};
  if (ldoId) {
    variables.ldoId = ldoId;
  }

  return (
    <PreloadQuery query={GET_EVENT_WITH_GROUPS_AND_UNASSIGNED_PLAYERS} variables={variables}>
      {(queryRef) => <TeamAddContainer
        queryRef={queryRef as QueryRef<{ getEventWithGroupsAndUnassignedPlayers: IGetEventWithGroupsAndUnassignedPlayersResponse }>} />}
    </PreloadQuery>
  );
}

export default NewTeamComp;
