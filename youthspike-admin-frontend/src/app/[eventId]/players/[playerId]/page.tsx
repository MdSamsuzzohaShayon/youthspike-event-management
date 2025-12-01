import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client';
import { Suspense } from 'react';
import Loader from '@/components/elements/Loader';
import { IPlayerAndTeamsResponse, TParams } from '@/types';
import { GET_PLAYER_AND_TEAMS } from '@/graphql/players';
import PlayerSingleContainer from '@/components/player/PlayerSingleContainer';

interface IPlayerSingleProps {
  params: TParams;
}

async function PlayerSingle({ params }: IPlayerSingleProps) {
  const pathParams = await params;
  const { playerId, eventId } = pathParams;

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1>Player Update</h1>

      <PreloadQuery query={GET_PLAYER_AND_TEAMS} variables={{ playerId, eventId }}>
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <PlayerSingleContainer queryRef={queryRef as QueryRef<IPlayerAndTeamsResponse>} eventId={eventId} playerId={playerId} />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

export default PlayerSingle;
