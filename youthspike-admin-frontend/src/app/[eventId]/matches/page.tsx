// React.js and Next.js
import React from 'react';

// GraphQL, helpers, utils, types
import { IGroupExpRel, IGroupRelatives, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam, TParams } from '@/types';

import { notFound } from 'next/navigation';
import MatchesMain from '@/components/match/MatchesMain';
import { getEventWithMatches } from '@/app/_requests/matches';

interface IMatchesPageProps {
  params: TParams;
}
async function MatchesPage({ params }: IMatchesPageProps) {
  const pathParams = await params;
  const matchesData = await getEventWithMatches(pathParams.eventId);

  if (!matchesData) {
    notFound();
  }

  // Matches,
  const { event, matches, teams, ldo, nets, rounds, groups } = matchesData;
  

  const teamMap = new Map<string, ITeam>(teams.map((t: ITeam) => [t._id, t]));
  const roundMap = new Map<string, IRoundRelatives>(rounds.map((r: IRoundRelatives) => [r._id, r]));
  const netMap = new Map<string, INetRelatives>(nets.map((n: INetRelatives) => [n._id, n]));

  const matchList = matches.map((m: IMatchExpRel) => {
    const matchObj = { ...m };

    /*
    matchObj.rounds = m.rounds.map((roundId) => roundMap.get(roundId)).filter(Boolean);
    matchObj.nets = m.nets.map((netId) => netMap.get(netId)).filter(Boolean);
    */
    // Handle both string[] and object[] for rounds and nets
    if (Array.isArray(m.rounds) && m.rounds.length > 0 && m.rounds.every((r) => typeof r === 'string')) {
      matchObj.rounds = (m.rounds as string[]).flatMap((roundId) => {
        const round = roundMap.get(roundId);
        return round ? [round] : [];
      });
    } else if (Array.isArray(m.rounds) && m.rounds.length > 0 && m.rounds.every((r) => typeof r === 'object' && r !== null)) {
      matchObj.rounds = m.rounds as IRoundRelatives[];
    } else {
      matchObj.rounds = [];
    }
    if (Array.isArray(m.nets) && m.nets.length > 0 && m.nets.every((n) => typeof n === 'string')) {
      matchObj.nets = (m.nets as string[]).flatMap((netId) => {
        const net = netMap.get(netId);
        return net ? [net] : [];
      });
    } else if (Array.isArray(m.nets) && m.nets.length > 0 && m.nets.every((n) => typeof n === 'object' && n !== null)) {
      matchObj.nets = m.nets as INetRelatives[];
    } else {
      matchObj.nets = [];
    }

    // Ensure we use string IDs for teamMap lookups
    const teamAId = typeof m.teamA === 'string' ? m.teamA : m.teamA._id;
    const teamBId = typeof m.teamB === 'string' ? m.teamB : m.teamB._id;
    if (teamMap.has(teamAId)) {
      matchObj.teamA = teamMap.get(teamAId) as ITeam;
    }
    if (teamMap.has(teamBId)) {
      matchObj.teamB = teamMap.get(teamBId) as ITeam;
    }

    return matchObj;
  });

  // Teams inside group list
  const groupList: IGroupExpRel[] = groups.map((g: IGroupRelatives) => {
    const groupObj = { ...g };
    if (groupObj.teams.length > 0) {
      const groupTeams: ITeam[] = [];
      groupObj.teams.forEach((gt) => {
        if (teamMap.has(gt)) {
          // @ts-ignore
          groupTeams.push(teamMap.get(gt));
        }
      });
      // @ts-ignore
      groupObj.teams = groupTeams;
    }
    return groupObj;
  });

  // const teamMatchList = matchList.filter((m: IMatchExpRel)=> m._id === "68736608e47b0a85b808bfd1");

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Matches</h1>
      <MatchesMain matches={matchList} teams={teams} groups={groupList} currEvent={event} />
    </div>
  );
}

export default MatchesPage;
