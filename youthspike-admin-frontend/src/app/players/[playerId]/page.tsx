import { IPlayerAndTeamsResponse, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import PlayerUpdateContainer from '@/components/player/PlayerUpdateContainer';
import { GET_PLAYER_AND_TEAMS } from '@/graphql/players';

interface IProps {
  params: TParams;
}

async function UpdatePlayerPage({ params }: IProps) {
  const pathParams = await params;
  const { playerId } = pathParams;
  return (
    <PreloadQuery query={GET_PLAYER_AND_TEAMS} variables={{ playerId, eventIds: [] }}>
      {(queryRef) => <PlayerUpdateContainer queryRef={queryRef as QueryRef<{ getPlayerAndTeams: IPlayerAndTeamsResponse }>} />}
    </PreloadQuery>
  );
}

export default UpdatePlayerPage;
