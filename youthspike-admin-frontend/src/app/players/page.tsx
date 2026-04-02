import { Suspense } from 'react';
import { PreloadQuery } from '@/lib/client';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client/react';
import { IGetPlayersResponse } from '@/types';
import { GET_PLAYERS_MIN } from '@/graphql/players';
import PlayersContainer from '@/components/player/PlayersContainer';



export default async function PlayersPage() {

  return (
    <PreloadQuery query={GET_PLAYERS_MIN} variables={{ limit: 30, offset: 0 }}>
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <PlayersContainer queryRef={queryRef as QueryRef<{ getPlayers: IGetPlayersResponse }>}  />
        </Suspense>
      )}
    </PreloadQuery>
  );
}