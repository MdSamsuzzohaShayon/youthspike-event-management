import { IGetTeamDetailQuery, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { GET_TEAM_DETAIL } from '@/graphql/teams';
import { Suspense } from 'react';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client';
import TeamDetailMain from '@/components/teams/TeamDetailMain';

interface TeamSinglePageProps {
  params: TParams;
}

export default async function TeamSinglePage({ params }: TeamSinglePageProps) {
  const { teamId, eventId } = await params;


  return (
    <div className="container mx-auto px-4 min-h-screen">
      
      <PreloadQuery query={GET_TEAM_DETAIL} variables={{ teamId }}>
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <TeamDetailMain
              queryRef={queryRef as QueryRef<{ getTeamDetails: IGetTeamDetailQuery }>}
              eventId={eventId}
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

