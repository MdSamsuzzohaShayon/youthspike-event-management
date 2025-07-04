'use client';

import React, { useState, useEffect } from 'react';
import EventAddUpdate from '@/components/event/EventAddUpdate';
import PlayerAdd from '@/components/player/PlayerAdd';
import Loader from '@/components/elements/Loader';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import { useError } from '@/lib/ErrorProvider';
import { IEvent, IPlayer, ITeam } from '@/types';


interface ISettingsMainProps {
  eventId: string;
  prevPlayer: IPlayer;
  prevEvent: IEvent;
}

const SettingsMain = ({ eventId, prevPlayer, prevEvent }: ISettingsMainProps) => {
  // Hooks
  const user = useUser();

  // Local State
  const [isLoading, setIsLoading] = useState(false);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  


  if (isLoading) return <Loader />;

  return (
    <div className="event-player-action mb-10">
      {user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain
        ? prevPlayer && <PlayerAdd eventId={eventId} update prevPlayer={prevPlayer} teamList={teamList} />
        : prevEvent && <EventAddUpdate update prevEvent={prevEvent} />}
    </div>
  );
};

export default SettingsMain;
