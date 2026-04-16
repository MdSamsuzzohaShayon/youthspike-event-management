// components/team/TeamMatchesContainer.tsx
'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useReadQuery } from '@apollo/client/react';
import { QueryRef } from '@apollo/client/react';
import { IGetTeamMatchesResponse, INetRelatives, IRoundRelatives, ITeam } from '@/types';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
import { usePathname } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';
import MatchCard from '../match/MatchCard';
import { useMessage } from '@/lib/MessageProvider';
import TeamNavigation from './TeamNavigation';
import SessionStorageService from '@/utils/SessionStorageService';
import { TEAM } from '@/utils/constant';
import { Calendar, Trophy, Swords, Frown } from 'lucide-react';

interface TeamMatchesContainerProps {
  queryRef: QueryRef<{ getTeamMatches: IGetTeamMatchesResponse }>;
  teamId: string;
}

function TeamMatchesContainer({ queryRef, teamId }: TeamMatchesContainerProps) {
  // Hooks
  const { data } = useReadQuery(queryRef);
  const pathname = usePathname();
  const { ldoIdUrl } = useLdoId();
  const { showMessage } = useMessage();

  // Handle Errors
  if (!data?.getTeamMatches?.data) {
    return <div>Team not found</div>;
  }

  const { team, matches, nets, rounds, oponents, events } = data.getTeamMatches.data;

  // Event handlers
  const handleSelectMatch = useCallback(() => { }, []);

  // Memoization
  const teamMap = useMemo(() => {
    return new Map<string, ITeam>(oponents.map((t) => [t._id, t]));
  }, [oponents]);

  const netsMapByMatch = useMemo(() => {
    const map = new Map<string, INetRelatives[]>();

    for (let i = 0; i < nets.length; i++) {
      const net = nets[i];
      if (!map.has(net.match)) {
        map.set(net.match, []);
      }
      map.get(net.match)!.push(net);
    }

    return map;
  }, [nets]);

  const roundsMapByMatch = useMemo(() => {
    const map = new Map<string, IRoundRelatives[]>();

    for (let i = 0; i < rounds.length; i++) {
      const round = rounds[i];
      if (!map.has(round.match)) {
        map.set(round.match, []);
      }
      map.get(round.match)!.push(round);
    }

    return map;
  }, [rounds]);

  const sortedMatches = useMemo(() => {
    const sortedMatches = [...matches].sort((a, b) => Number(a.completed) - Number(b.completed));

    const matchWithTeam = [];
    for (let i = 0; i < sortedMatches.length; i++) {
      const match = structuredClone(sortedMatches[i]);
      const teamA = teamMap.get(String(match.teamA));
      const teamB = teamMap.get(String(match.teamB));

      const mNets = netsMapByMatch.get(match._id);
      const mRounds = roundsMapByMatch.get(match._id);

      if (teamA) match.teamA = teamA;
      if (teamB) match.teamB = teamB;

      if (mNets && mNets.length > 0) {
        match.nets = mNets;
      }
      if (mRounds && mRounds.length > 0) {
        match.rounds = mRounds;
      }

      matchWithTeam.push(match);
    }

    return matchWithTeam;
  }, [matches, teamMap, netsMapByMatch, roundsMapByMatch]);

  if (!team) {
    return <div>Team not found</div>;
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

      <TeamNavigation events={events} ldoIdUrl={ldoIdUrl} team={team} totalPlayers={team?.players?.length || 0} />

      <div className="relative z-10">


        {/* Page Content with Fade-in Animation */}
        <div className="animate-fadeInUp">
        {sortedMatches.map((match, i) => (
              <div
                key={match._id}
                className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                <MatchCard
                  showMessage={showMessage}
                  handleSelectMatch={handleSelectMatch}
                  isChecked={false}
                  match={match}
                  sl={i + 1}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default TeamMatchesContainer;
