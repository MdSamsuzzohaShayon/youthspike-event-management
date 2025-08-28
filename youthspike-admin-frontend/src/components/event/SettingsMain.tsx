'use client';

import React from 'react';
import EventAddUpdate from '@/components/event/EventAddUpdate';
import PlayerAdd from '@/components/player/PlayerAdd';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import { IEvent, IGetPlayerEventSettingsQuery } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client';

interface ISettingsMainProps {
  queryRef: QueryRef<{ getPlayerEventSetting: IGetPlayerEventSettingsQuery }>;
  eventId: string;
}

const SettingsMain = ({ queryRef, eventId }: ISettingsMainProps) => {
  // Hooks
  const user = useUser();

  // Read query data from Apollo (Suspense friendly)
  const { data } = useReadQuery(queryRef);

  const { event, ldo, sponsors, teams, multiplayer, weight, player } = data?.getPlayerEventSetting?.data ?? {};

  const eventObj: IEvent | null = event ? { ...event } : null;
  if (eventObj) {
    // @ts-ignore
    if (sponsors) eventObj.sponsors = sponsors;
  }

  return (
    <div className="event-player-action mb-10">
      <h1 className="text-3xl font-bold text-center mb-8">{user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain ? 'Update Captain' : 'Update Event'}</h1>

      {!player && !eventObj && <p>No data found</p>}
      {user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain
        ? player && teams && <PlayerAdd eventId={eventId} update prevPlayer={player} teamList={teams} />
        : eventObj && <EventAddUpdate update prevEvent={eventObj} prevMultiplayer={multiplayer} prevWight={weight} />}
    </div>
  );
};

export default SettingsMain;
