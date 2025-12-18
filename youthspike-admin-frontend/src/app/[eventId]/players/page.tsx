import { IEventPlayersGroupsTeamsResponse, TParams } from '@/types';
import { redirect } from 'next/navigation';
import { PreloadQuery } from '@/lib/client';
import { Suspense } from 'react';
import Loader from '@/components/elements/Loader';
import { GET_EVENT_PLAYERS_GROUPS_TEAMS } from '@/graphql/players'; // Adjust import path as needed
import { getUserFromCookie } from '@/utils/serverCookie';
import { cookies } from 'next/headers';
import PlayersMainContainer from '@/components/player/PlayersMainContainer';
import { QueryRef } from '@apollo/client/react';

interface IPlayersPageProps {
  params: TParams;
}


async function PlayersPage({ params }: IPlayersPageProps) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const userExist = await getUserFromCookie(cookieStore);

  // Handle authorization before PreloadQuery
  if (!userExist) {
    redirect('/api/logout');
  }

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Roster</h1>
      
      <PreloadQuery
        query={GET_EVENT_PLAYERS_GROUPS_TEAMS}
        variables={{ eventId }}
      >
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <PlayersMainContainer 
              queryRef={queryRef as QueryRef<IEventPlayersGroupsTeamsResponse>}
              eventId={eventId}
              userExist={userExist}
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

export default PlayersPage;