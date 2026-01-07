import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { IGetEventDirectorQuery, IUserContext, TParams } from '@/types';
import { UserRole } from '@/types/user';
import { LDO_ID } from '@/utils/constant';
import EventsMain from '@/components/event/EventsMain';
import Loader from '@/components/elements/Loader';
import { GET_LDO } from '@/graphql/director';
import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';

interface IEventsPageProps {
  searchParams: TParams;
}

export async function EventsPage({ searchParams }: IEventsPageProps) {
  const cookieStore = await cookies();
  const resolvedParams = await searchParams;
  const user = cookieStore.get('user')?.value;
  const token = cookieStore.get('token')?.value;

  const userContext: IUserContext = {
    info: user ? JSON.parse(user) : null,
    token: token ?? null,
  };

  let directorId: string | null = null;

  // If this is an admin user get ldo, if id not found redirect to admin page
  if (userContext.info?.role === UserRole.admin) {
    directorId = resolvedParams[LDO_ID] as string;

    if (!directorId) {
      redirect('/admin');
    }
  }

  // Instead of fetching here, defer to Apollo (PreloadQuery)
  return (
    <div className="events-page container px-6 mx-auto min-h-screen">
      <PreloadQuery
        query={GET_LDO}
        variables={{
          dId: directorId,
        }}
      >
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <EventsMain
              queryRef={
                queryRef as QueryRef<{ getEventDirector: IGetEventDirectorQuery }>
              }
            />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

export default EventsPage;
