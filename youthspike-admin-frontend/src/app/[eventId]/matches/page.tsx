// React.js and Next.js
import React from 'react';


// GraphQL, helpers, utils, types
import { IEventPageProps, IGroupExpRel, IGroupRelatives, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam } from '@/types';

import { notFound } from 'next/navigation';
import { getEventWithMatches } from './_fetch/match';
import MatchesMain from '@/components/match/MatchesMain';

async function MatchesPage({ params: { eventId } }: IEventPageProps) {


  const matchesData = await getEventWithMatches(eventId);

  if (!matchesData) {
    notFound();
  }

  // Matches, 
  const { event, matches, teams, ldo, nets, rounds, groups } = matchesData;

  const teamMap = new Map(teams.map((t: ITeam) => [t._id, t]));
  const roundMap = new Map<string, IRoundRelatives>(rounds.map((r: IRoundRelatives)=> [r._id, r]));
  const netMap = new Map<string, INetRelatives>(nets.map((n: INetRelatives)=> [n._id, n]));

  const matchList = matches.map((m: IMatchExpRel) => {
    const matchObj = { ...m };

    // @ts-ignore
    matchObj.rounds = m.rounds.map((roundId) => roundMap.get(roundId)).filter(Boolean);
    // @ts-ignore
    matchObj.nets = m.nets.map((netId) => netMap.get(netId)).filter(Boolean);

    if (teamMap.has(m.teamA)) {
      // @ts-ignore
      matchObj.teamA = teamMap.get(m.teamA);
    }
    if (teamMap.has(m.teamB)) {
      // @ts-ignore
      matchObj.teamB = teamMap.get(m.teamB);
    }

    return matchObj;
  });

  // Teams inside group list
  const groupList: IGroupExpRel[] = groups.map((g: IGroupRelatives) => {
    const groupObj = {...g};
    if(groupObj.teams.length > 0){
      const groupTeams: ITeam[] = [];
      groupObj.teams.forEach((gt)=>{
        if(teamMap.has(gt)){
          // @ts-ignore
          groupTeams.push(teamMap.get(gt));
        }
      });
      // @ts-ignore
      groupObj.teams = groupTeams;
    }
    return groupObj;
  });



  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Matches</h1>
      <MatchesMain matches={matchList} teams={teams} groups={groupList} currEvent={event} />
    </div>
  );
}

export default MatchesPage;

