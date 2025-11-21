// components/team/TeamMatchesContainer.tsx
'use client';

import { useCallback, useMemo } from 'react';
import { useReadQuery } from '@apollo/client/react';
import { QueryRef } from '@apollo/client/react';
import { IGetTeamMatchesResponse, IMatch, INetRelatives, IRoundRelatives, ITeam } from '@/types';
import MatchList from '@/components/match/MatchList';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FRONTEND_URL } from '@/utils/keys';
import { useLdoId } from '@/lib/LdoProvider';
import MatchCard from '../match/MatchCard';
import { useError } from '@/lib/ErrorProvider';
import TeamNavigation from './TeamNavigation';

interface TeamMatchesContainerProps {
  queryRef: QueryRef<{ getTeamMatches: IGetTeamMatchesResponse }>;
  teamId: string;
}

function TeamMatchesContainer({ queryRef, teamId }: TeamMatchesContainerProps) {
  // Hooks
  const { data } = useReadQuery(queryRef);
  const pathname = usePathname();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();

  // Handle Errors
  if (!data?.getTeamMatches?.data) {
    return <div>Team not found</div>;
  }

  const { team, matches, nets, rounds, teams, event } = data.getTeamMatches.data;

  // Event handlers
  const handleSelectMatch = useCallback(() => {}, []);

  // Memoization
  const teamMap = useMemo(() => {
    return new Map<string, ITeam>(teams.map((t) => [t._id, t]));
  }, [teams]);

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
                <p className="text-xs text-gray-400 truncate leading-tight">{event?.name || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatItem label="Matches" value={matches?.length || 0} />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <TeamNavigation eventId={event._id} ldoIdUrl={ldoIdUrl} pathname={pathname} team={team} />
      </div>

      {/* Page Content */}
      {sortedMatches.length > 0 ? (
        <div className="space-y-2">
          {sortedMatches.map((match, i) => (
            <MatchCard key={match._id} setActErr={setActErr} eventId={event._id} handleSelectMatch={handleSelectMatch} isChecked={false} match={match} sl={i + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm mb-1">No matches found</div>
          <p className="text-gray-500 text-xs">This team hasn't played any matches yet</p>
        </div>
      )}
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

export default TeamMatchesContainer;
