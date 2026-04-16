'use client';

import { useEffect, useMemo } from 'react';
import { useReadQuery, QueryRef } from '@apollo/client/react';
import { IPlayer, IGetTeamRosterResponse, IPlayerRankingExpRel } from '@/types';
import { notFound } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';
import TeamNavigation from './TeamNavigation';
import SessionStorageService from '@/utils/SessionStorageService';
import { TEAM } from '@/utils/constant';
import RosterWrapper from './RosterWrapper';

interface TeamRosterContainerProps {
  queryRef: QueryRef<{ getTeamRoster: IGetTeamRosterResponse }>;
  teamId: string;
}

function TeamRosterContainer({ queryRef, teamId }: TeamRosterContainerProps) {
  const { ldoIdUrl } = useLdoId();
  const { data } = useReadQuery(queryRef);

  const rosterData = data?.getTeamRoster?.data;
  if (!rosterData) notFound();

  const { team, players, rankings, events, playerRanking } = rosterData;

  if (!team) notFound();

  /**
   * ✅ Optimized:
   * - Single pass over rankings
   * - O(1) lookup using Map
   * - Avoid unnecessary spreads unless needed
   */
  const playerList = useMemo(() => {
    if (!players?.length || !rankings?.length) return [];

    const rankingMap = new Map<string, true>();

    for (let i = 0; i < rankings.length; i++) {
      rankingMap.set(String(rankings[i].player), true);
    }

    const result: IPlayer[] = [];

    for (let i = 0; i < players.length; i++) {
      const p = players[i];

      if (rankingMap.has(p._id)) {
        // Only create new object if required
        result.push({
          ...p,
          teams: [team._id as unknown as string],
        });
      }
    }

    return result;
  }, [players, rankings, team._id]);

  /**
   * ✅ Avoid unnecessary object recreation
   */
  const playerRankingData: IPlayerRankingExpRel | null = useMemo(() => {
    if (!playerRanking) return null;
    return {
      ...playerRanking,
      rankings,
    };
  }, [playerRanking, rankings]);

  /**
   * ✅ Side effect (unchanged but safe)
   */
  useEffect(() => {
    SessionStorageService.setItem(TEAM, team._id);
    return () => {
      SessionStorageService.removeItem(TEAM);
    };
  }, [team._id]);

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <TeamNavigation
        events={events}
        ldoIdUrl={ldoIdUrl}
        team={team}
        totalPlayers={playerList.length}
      />

      <div className="relative z-10">
        <div className="animate-fadeInUp">
          <RosterWrapper
            events={events}
            players={playerList} // ✅ USE FILTERED LIST
            team={team}
            playerRanking={playerRankingData}
          />
        </div>
      </div>
    </div>
  );
}

export default TeamRosterContainer;