import TeamDetail from '@/components/team/TeamDetail';
import getTeamData from '@/app/_requests/team';
import { notFound } from 'next/navigation';
import { IMatchExpRel, IPlayer, IPlayerRankingItem, ITeam, TParams } from '@/types';

interface TeamSinglePageProps {
  params: TParams;
}

async function TeamSinglePage({ params }: TeamSinglePageProps) {

  const { teamId } = await params;
  const teamData = await getTeamData(teamId);

  if (!teamData) {
    notFound();
  }

  const { team, playerRanking, players, captain, cocaptain, group, event, matches, rankings, rounds, nets, teams } = teamData;
  

  playerRanking.rankings = rankings;
  team.captain = captain;
  team.cocaptain = cocaptain;

  const rankingIds = new Set<string>(playerRanking.rankings.map((r: IPlayerRankingItem) => r.player));

  // Build lookup maps in a single pass (O(n) instead of multiple O(n) iterations)
  // const roundMap = new Map(rounds.map((r: IRoundRelatives) => [r._id, r]));
  // const netMap = new Map(nets.map((n: INetRelatives) => [n._id, n]));
  const oponentTeamMap = new Map(teams.map((t: ITeam) => [t._id, t]));

  // Process matches efficiently
  const matchList = matches.map((m: IMatchExpRel) => {
    const matchObj = { ...m };

    // // @ts-ignore
    // matchObj.rounds = m.rounds.map((roundId) => roundMap.get(roundId) as IRoundRelatives).filter(Boolean);

    // matchObj.nets = m.nets.map((netId) => netMap.get(netId) as INetRelatives).filter(Boolean);

    if (oponentTeamMap.has(m.teamA)) {

      matchObj.teamA = oponentTeamMap.get(m.teamA) as ITeam;
      matchObj.teamB = team;
    } else if (oponentTeamMap.has(m.teamB)) {

      matchObj.teamB = oponentTeamMap.get(m.teamB) as ITeam;
      matchObj.teamA = team;
    }

    return matchObj;
  });

  const playerList = players.filter((p: IPlayer) => rankingIds.has(p._id)).map((p: IPlayer) => {
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

  return <div className="container mx-auto px-2 min-h-screen">{teamData && <TeamDetail event={eventData} team={currTeam} nets={nets} rounds={rounds} />}</div>;
}

export default TeamSinglePage;
