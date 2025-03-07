import TeamDetail from '@/components/team/TeamDetail';
import getTeamData from '@/app/_fetch/team';
import { notFound } from 'next/navigation';
import { IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, ITeam } from '@/types';

interface TeamSinglePageProps {
  params: { teamId: string };
}

async function TeamSinglePage({ params: { teamId } }: TeamSinglePageProps) {
  const teamData = await getTeamData(teamId);

  if (!teamData) {
    return notFound();
  }

  const { team, playerRanking, players, captain, cocaptain, group, event, matches, rankings, rounds, nets, oponentTeams } = teamData;

  playerRanking.rankings = rankings;
  team.captain = captain;
  team.cocaptain = cocaptain;

  // Build lookup maps in a single pass (O(n) instead of multiple O(n) iterations)
  const roundMap = new Map(rounds.map((r: IRoundRelatives) => [r._id, r]));
  const netMap = new Map(nets.map((n: INetRelatives) => [n._id, n]));
  const oponentTeamMap = new Map(oponentTeams.map((t: ITeam) => [t._id, t]));

  // Process matches efficiently
  const matchList = matches.map((m: IMatchExpRel) => {
    const matchObj = { ...m };

    // @ts-ignore
    matchObj.rounds = m.rounds.map((roundId) => roundMap.get(roundId)).filter(Boolean);
    // @ts-ignore
    matchObj.nets = m.nets.map((netId) => netMap.get(netId)).filter(Boolean);

    if (oponentTeamMap.has(m.teamA)) {
      // @ts-ignore
      matchObj.teamA = oponentTeamMap.get(m.teamA);
      matchObj.teamB = team;
    } else if (oponentTeamMap.has(m.teamB)) {
      // @ts-ignore
      matchObj.teamB = oponentTeamMap.get(m.teamB);
      matchObj.teamA = team;
    }

    return matchObj;
  });

  const playerList = players.map((p: IPlayer) => {
    const playerObj = { ...p, teams: [team] };
    // Captain
    if (playerObj.captainofteams && playerObj.captainofteams?.length > 0) {
      playerObj.captainofteams = [team._id];
    }
    if (playerObj.cocaptainofteams && playerObj.cocaptainofteams?.length > 0) {
      playerObj.cocaptainofteams = [team._id];
    }
    // if(p.teams && p.teams.length){
    //   playerObj.teams = 
    // }
    return playerObj;
  });



  const eventData = structuredClone(event);

  const currTeam = structuredClone(team);
  currTeam.matches = matchList;
  currTeam.players = playerList;
  currTeam.event = eventData;

  return <div className="container mx-auto px-2 min-h-screen">{teamData && <TeamDetail event={eventData} team={currTeam} />}</div>;
}

export default TeamSinglePage;
