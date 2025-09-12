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
  try {
    const pathParams = await params;
    const matchesData = await getEventWithMatches(pathParams.eventId);

    if (!matchesData) {
      notFound();
    }

    const { event, matches, teams, ldo, nets, rounds, groups } = matchesData;
    
    // Create maps safely
    const teamMap = new Map<string, ITeam>();
    teams.forEach((t: ITeam) => {
      if (t && t._id) {
        teamMap.set(t._id, t);
      }
    });

    const roundMap = new Map<string, IRoundRelatives>();
    rounds.forEach((r: IRoundRelatives) => {
      if (r && r._id) {
        roundMap.set(r._id, r);
      }
    });

    const netMap = new Map<string, INetRelatives>();
    nets.forEach((n: INetRelatives) => {
      if (n && n._id) {
        netMap.set(n._id, n);
      }
    });

    // Process matches safely
    const matchList = matches.map((m: IMatchExpRel) => {
      const matchObj = { ...m };

      // Handle rounds
      if (Array.isArray(m.rounds)) {
        matchObj.rounds = m.rounds.flatMap((round) => {
          if (typeof round === 'string' && roundMap.has(round)) {
            return [roundMap.get(round)!];
          } else if (typeof round === 'object' && round !== null) {
            return [round as IRoundRelatives];
          }
          return [];
        });
      } else {
        matchObj.rounds = [];
      }

      // Handle nets
      if (Array.isArray(m.nets)) {
        matchObj.nets = m.nets.flatMap((net) => {
          if (typeof net === 'string' && netMap.has(net)) {
            return [netMap.get(net)!];
          } else if (typeof net === 'object' && net !== null) {
            return [net as INetRelatives];
          }
          return [];
        });
      } else {
        matchObj.nets = [];
      }

      // Handle teams safely
      if (m.teamA) {
        const teamAId = typeof m.teamA === 'string' ? m.teamA : m.teamA?._id;
        if (teamAId && teamMap.has(teamAId)) {
          matchObj.teamA = teamMap.get(teamAId)!;
        } else {
          matchObj.teamA = m.teamA
        }
      }

      if (m.teamB) {
        const teamBId = typeof m.teamB === 'string' ? m.teamB : m.teamB._id;
        if (teamBId && teamMap.has(teamBId)) {
          matchObj.teamB = teamMap.get(teamBId)!;
        } else {
          matchObj.teamB =  m.teamB 
        }
      } 

      return matchObj;
    });

    // Process groups safely
    const groupList: IGroupExpRel[] = groups.map((g: IGroupRelatives) => {
      // @ts-ignore
      const groupObj = { ...g } as IGroupExpRel;
      
      if (Array.isArray(groupObj.teams)) {
        groupObj.teams = groupObj.teams.flatMap((gt) => {
          if (typeof gt === 'string' && teamMap.has(gt)) {
            const team = teamMap.get(gt);
            return team ? [team] : [];
          } else if (typeof gt === 'object' && gt !== null) {
            return [gt as ITeam];
          }
          return [];
        });
      } else {
        groupObj.teams = [];
      }
      
      return groupObj;
    });

    return (
      <div className="container mx-auto px-4 min-h-screen">
        <h1 className="mb-8 text-center">Matches</h1>
        <MatchesMain matches={matchList} teams={teams} groups={groupList} currEvent={event} />
      </div>
    );

  } catch (error) {
    console.error('Error in MatchesPage:', error);
    notFound();
  }
}


export default MatchesPage;