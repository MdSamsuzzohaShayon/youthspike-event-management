import { IGetEventDirectorQuery, IGetPlayerEventSettingsQuery, TParams } from '@/types';
import SettingsMain from '@/components/event/SettingsMain';
import { PreloadQuery } from '@/lib/client';
import { GET_PLAYER_EVENT_SETTINGS } from '@/graphql/event';
import { Suspense } from 'react';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client';

interface ISettingsPageProps {
  params: TParams;
}

async function SettingsPage({ params }: ISettingsPageProps) {
  const pathParams = await params;

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <PreloadQuery
        query={GET_PLAYER_EVENT_SETTINGS}
        variables={{
          eventId: pathParams.eventId,
        }}
      >
        {(queryRef) => (
          <Suspense fallback={<Loader />}>
            <SettingsMain queryRef={queryRef as QueryRef<{ getPlayerEventSetting: IGetPlayerEventSettingsQuery }>} eventId={pathParams.eventId} />
          </Suspense>
        )}
      </PreloadQuery>
    </div>
  );
}

export default SettingsPage;
