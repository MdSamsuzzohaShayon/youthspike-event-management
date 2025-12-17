'use client';

import { IPlayerAndTeamsResponse } from '@/types';
import { notFound } from 'next/navigation';
import PlayerAdd from './PlayerAdd';
import { QueryRef, useReadQuery } from '@apollo/client/react';

function PlayerSingleContainer({ queryRef, eventId, playerId }: { queryRef: QueryRef<IPlayerAndTeamsResponse>; eventId: string; playerId: string }) {
  const { data, error } = useReadQuery(queryRef);

  // Handle loading and error states
  if (error) {
    console.error('Error fetching player data:', error);
    return <div>Error loading player data</div>;
  }

  if (!data?.getPlayerAndTeams) {
    return <div>Loading player data...</div>;
  }

  const playerResponse = data.getPlayerAndTeams;

  // Handle missing data
  if (!playerResponse.data) {
    notFound();
  }

  const { player, teams } = playerResponse.data;

  return <PlayerAdd eventId={eventId} update prevPlayer={player} teamList={teams} />;
}

export default PlayerSingleContainer;
