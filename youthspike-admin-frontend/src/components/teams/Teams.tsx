import { Suspense } from 'react';
import { PreloadQuery } from '@/lib/client';
import { GET_EVENT_WITH_TEAMS } from '@/graphql/teams';
import TeamListMain from './TeamListMain';
import Loader from '@/components/elements/Loader';
import { IGetEventWithTeamsQuery, TParams } from '@/types';
import { QueryRef } from '@apollo/client/react';

interface ITeamProps {
  params: TParams;
}

export default async function Teams({ params }: ITeamProps) {
  const { eventId } = await params;

  if (!eventId) {
    const err = new Error('Event ID not provided.');
    err.name = 'Invalid parameters';
    throw err;
  }

  return (
    <div className="w-full">
      <h1 className="text-4xl font-bold text-center text-white mb-6">
        Team Management
      </h1>

      {/* Preload GraphQL query like in TeamSingleMain */}
      <PreloadQuery query={GET_EVENT_WITH_TEAMS} variables={{ eventId }}>
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <TeamListMain
              queryRef={
                queryRef as QueryRef<{ getEventWithTeams: IGetEventWithTeamsQuery }>
              }
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}
