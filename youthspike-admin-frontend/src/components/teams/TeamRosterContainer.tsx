// components/team/TeamRosterContainer.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useQuery, useReadQuery } from '@apollo/client/react';
import { QueryRef } from '@apollo/client/react';
import { IPlayer, IGetTeamRosterResponse, ITeam } from '@/types';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
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

  const { team, players, rankings, event, playerRanking } = data.getTeamRoster.data;

  console.log({event});
  

  const { data: teamsData, loading, error } = useQuery(GET_TEAMS, {
    variables: { eventId: event?._id },
    fetchPolicy: "cache-first",   // default
  });


  const teamList = useMemo(()=>{
    // @ts-ignore
    return (teamsData?.getTeams?.data || []) as ITeam[];
  }, [teamsData]);
  
  const playerList = useMemo(() => {
    if (!players?.length || !rankings?.length) return [];

    const rankingIds = new Set<string>(rankings.map((r) => String(r.player))); // O(r)

    const result: IPlayer[] = []; // output

    for (const p of players) {
      // O(p)
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

  const pathname = usePathname();


  useEffect(()=>{
    if(team){
        SessionStorageService.setItem(TEAM, team._id);
    }else{
        SessionStorageService.removeItem(TEAM);
    }
    
  }, [team]);

  return (
    <div className="min-h-screen bg-gray-900 pb-4">
      {/* Header Section */}
      <div className="header bg-gray-800 rounded-xl mb-4">
        {/* Compact Header */}
        <div className="border-b border-yellow-500/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamLogo team={team} />
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate leading-tight">{team?.name || 'Loading...'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatItem label="Players" value={playerList?.length || 0} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <TeamNavigation eventId={event?._id} ldoIdUrl={ldoIdUrl} pathname={pathname} team={team} />
      </div>

      {/* Page Content */}
      <div className="min-h-screen">
        <RosterWrapper event={event} players={players} team={team} playerRanking={playerRankingData} teamList={teamList} />
      </div>
    </div>
  );
}

const TeamLogo = ({ team }: { team: ITeam }) =>
  team?.logo ? (
    <CldImage alt={team.name} width={32} height={32} src={team.logo} className="w-8 h-8 rounded-lg border border-yellow-500/30 object-cover object-center flex-shrink-0" crop="fit" />
  ) : (
    <TextImg className="w-8 h-8 rounded-lg border border-yellow-500/30 flex-shrink-0" fullText={team?.name || ''} txtCls="text-sm font-bold" />
  );

const StatItem = ({ label, value }: { label: string; value: number }) => (
  <div className="text-right">
    <div className="text-xs text-gray-400">{label}</div>
    <div className="text-white font-bold text-sm">{value}</div>
  </div>
);



export default TeamRosterContainer;
