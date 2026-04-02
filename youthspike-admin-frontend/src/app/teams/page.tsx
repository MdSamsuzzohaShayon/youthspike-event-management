import { Suspense } from 'react';
import { PreloadQuery } from '@/lib/client';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client/react';
import { IGetPlayersResponse, IGetTeamDetailQuery, IGetTeamsResponse } from '@/types';
import { GET_TEAMS_MIN } from '@/graphql/teams';
import AdminTeamsContainer from '@/components/teams/AdminTeamsContainer';



export default async function PlayersPage() {

  return (
    <PreloadQuery query={GET_TEAMS_MIN} variables={{ limit: 30, offset: 0 }}>
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <AdminTeamsContainer queryRef={queryRef as QueryRef<{ getTeams: IGetTeamsResponse }>}  />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
