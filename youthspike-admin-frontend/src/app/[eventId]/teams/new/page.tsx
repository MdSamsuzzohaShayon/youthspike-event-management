import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { IGetEventWithGroupsAndUnassignedPlayersResponse, IGetEventWithTeamsAndGroupsResponse, ISearchFilter } from '@/types';
import { GET_AN_EVENT_WITH_TEAMS_AND_GROUPS, GET_EVENT_WITH_GROUPS_AND_UNASSIGNED_PLAYERS } from '@/graphql/event';
import TeamAddContainer from '@/components/teams/TeamAddContainer';

interface IProps {
  params: Promise<{ eventId: string }>;
}

// eventId, groupList, handleClose, setIsLoading, players, update, prevTeam, currDivision, divisions
export default async function NewTeamPage({ params }: IProps) {
  const { eventId } = await params;

  return (
    <PreloadQuery query={GET_EVENT_WITH_GROUPS_AND_UNASSIGNED_PLAYERS} variables={{ eventId }}>
      {(queryRef) => <TeamAddContainer queryRef={queryRef as QueryRef<{ getEventWithGroupsAndUnassignedPlayers: IGetEventWithGroupsAndUnassignedPlayersResponse }>} eventId={eventId} />}
    </PreloadQuery>
  );
}
