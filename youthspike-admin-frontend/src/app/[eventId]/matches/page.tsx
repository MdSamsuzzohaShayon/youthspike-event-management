// React.js and Next.js
import React from 'react';

// GraphQL, helpers, utils, types
import { IEventExpRel, IEventWithMatchesResponse, IGroupExpRel, ILDO, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { Suspense } from 'react';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client';
import { GET_EVENT_WITH_MATCHES } from '@/graphql/matches';
import MatchesMainContainer from '@/components/match/MatchesMainContainer';

interface IMatchesPageProps {
  params: TParams;
}


async function MatchesPage({ params }: IMatchesPageProps) {
  const pathParams = await params;

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Matches</h1>
      
      <PreloadQuery
        query={GET_EVENT_WITH_MATCHES}
        variables={{ eventId: pathParams.eventId }}
      >
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <MatchesMainContainer 
              queryRef={queryRef as QueryRef<IEventWithMatchesResponse>} 
              eventId={pathParams.eventId} 
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

export default MatchesPage;