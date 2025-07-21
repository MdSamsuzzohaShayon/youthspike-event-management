import { getPlayerWithStats } from '@/app/_requests/player-stats';
import PlayerStatsMain from '@/components/player-stats/PlayerStatsMain';
import { IPlayerStats, IPlayerTotalStats, IServerReceiverOnNetMixed } from '@/types';
import { notFound } from 'next/navigation';
import React from 'react';

interface IPlayersStatsPageProps {
  playerId: string;
}

async function PlayerStatsPage({ params }: { params: Promise<IPlayersStatsPageProps> }) {
  const { playerId } = await params;
  // Messi ID: 68486d6ba46c501ab11114b3

  const playerData = await getPlayerWithStats(playerId);
  if (!playerData) {
    notFound();
  }

  const { player, team, playerstats, matches, nets } = playerData;

  // let filteredPlayerStats = [];

  const totalGames = playerstats.length;

  const playerTotalStats: IPlayerTotalStats = {
    serveOpportunity: 0,
    serveAce: 0,
    serveCompletionCount: 0,
    servingAceNoTouch: 0,
    receiverOpportunity: 0,
    receivedCount: 0,
    noTouchAcedCount: 0,
    settingOpportunity: 0,
    settingCompletion: 0,
    hittingOpportunity: 0,
    hittingCompletion: 0,
    cleanHits: 0,
    defensiveOpportunity: 0,
    defensiveConversion: 0,
    break: 0,
    broken: 0,
    matchPlayed: 0,
  };

  playerstats.forEach((ps: IPlayerStats) => {
    (Object.keys(playerTotalStats) as Array<keyof IPlayerTotalStats>).forEach((key) => {
      playerTotalStats[key] += ps[key];
    });
  });

  return (
    <div className="PlayerStatsPage">
      <PlayerStatsMain player={player} playerTotalStats={playerTotalStats} totalGames={totalGames} />
    </div>
  );
}

export default PlayerStatsPage;
