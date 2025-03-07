import { notFound } from 'next/navigation';
import TeamDetail from '@/components/teams/TeamDetail';
import { divisionsToOptionList } from '@/utils/helper';
import { IMatchExpRel, INetRelatives, IPlayerExpRel, IRoundRelatives, ITeam } from '@/types';
import { getTeamData } from '../_fetch/team';

interface TeamSingleMainProps {
  params: { teamId: string; eventId: string };
}



export default async function TeamSingleMain({ params: { teamId, eventId } }: TeamSingleMainProps) {
  const teamData = await getTeamData(teamId);

  if (!teamData) {
    return notFound();
  }
  
  const { team, playerRanking, players, captain, cocaptain, group, event, matches, rankings, rounds, nets, oponentTeams } = teamData;
  const divisionList = event?.divisions ? divisionsToOptionList(event.divisions) : [];

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

  const playerList = players.map((p: IPlayerExpRel)=> {
    const playerObj = {...p, teams: [team]};
    // Captain
    if(playerObj.captainofteams && playerObj.captainofteams?.length > 0){
      playerObj.captainofteams = [team._id];
    }
    if(playerObj.cocaptainofteams && playerObj.cocaptainofteams?.length > 0){
      playerObj.cocaptainofteams = [team._id];
    }
    return playerObj;
  });
  
  

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <TeamDetail
        event={event}
        team={team}
        eventId={eventId}
        divisionList={divisionList}
        teamList={oponentTeams}
        playerList={playerList}
        playerRanking={playerRanking}
        matchList={matchList}
        rankings={rankings}
      />
    </div>
  );
}
