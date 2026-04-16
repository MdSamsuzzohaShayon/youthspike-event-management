// components/team/TeamRosterContainer.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useQuery, useReadQuery } from '@apollo/client/react';
import { QueryRef } from '@apollo/client/react';
import { IPlayer, IGetTeamRosterResponse, ITeam, IGetTeamsResponse } from '@/types';
import { notFound, usePathname } from 'next/navigation';
import RosterWrapper from './RosterWrapper';
import { useLdoId } from '@/lib/LdoProvider';
import TeamNavigation from './TeamNavigation';
import { GET_TEAMS } from '@/graphql/teams';
import SessionStorageService from '@/utils/SessionStorageService';
import { TEAM } from '@/utils/constant';


interface TeamRosterContainerProps {
  queryRef: QueryRef<{ getTeamRoster: IGetTeamRosterResponse }>;
  teamId: string;
}

function TeamRosterContainer({ queryRef, teamId }: TeamRosterContainerProps) {
  const { ldoIdUrl } = useLdoId();
  const { data } = useReadQuery(queryRef);

  if (!data?.getTeamRoster?.data) {
    notFound();
  }

  const { team, players, rankings, events, playerRanking } = data.getTeamRoster.data;

  const { data: teamsData, loading, error } = useQuery<{ getTeams: IGetTeamsResponse }>(GET_TEAMS, {
    variables: { eventIds: events?.map(e => e._id) || undefined },
    fetchPolicy: "cache-first",
  });

  const teamList = useMemo(() => {
    return (teamsData?.getTeams?.data || []) as ITeam[];
  }, [teamsData]);

  const playerList = useMemo(() => {
    if (!players?.length || !rankings?.length) return [];

    const rankingIds = new Set<string>(rankings.map((r) => String(r.player)));
    const result: IPlayer[] = [];

    for (const p of players) {
      if (rankingIds.has(p._id)) {
        result.push({
          ...p,
          teams: [team as unknown as string],
        });
      }
    }
    return result;
  }, [players, rankings, team]);

  const playerRankingData = useMemo(() => {
    return { ...playerRanking, rankings: rankings };
  }, [playerRanking, rankings]);

  if (!team) {
    notFound();
  }

  useEffect(() => {
    if (team) {
      SessionStorageService.setItem(TEAM, team._id);
    } else {
      SessionStorageService.removeItem(TEAM);
    }
  }, [team]);

  return (
    <div className="min-h-screen">
      {/* Animated Background Accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <TeamNavigation events={events} ldoIdUrl={ldoIdUrl} team={team} totalPlayers={playerList.length} />

      <div className="relative z-10">


        {/* Page Content with Fade-in Animation */}
        <div className="animate-fadeInUp">
          <RosterWrapper
            events={events}
            players={players}
            team={team}
            playerRanking={playerRankingData}
            teamList={teamList}
          />
        </div>
      </div>
    </div>
  );
}


export default TeamRosterContainer;