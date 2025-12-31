import { IGetPlayerEventSettingsQuery, TParams } from '@/types';
import SettingsMainContainer from '@/components/event/SettingsMainContainer';
import { PreloadQuery } from '@/lib/client';
import { GET_PLAYER_EVENT_SETTINGS } from '@/graphql/event';
import { QueryRef } from '@apollo/client/react';

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
        {(queryRef) => <SettingsMainContainer queryRef={queryRef as QueryRef<{ getPlayerEventSetting: IGetPlayerEventSettingsQuery }>} eventId={pathParams.eventId} />}
      </PreloadQuery>
    </div>
  );
}

export default SettingsPage;
