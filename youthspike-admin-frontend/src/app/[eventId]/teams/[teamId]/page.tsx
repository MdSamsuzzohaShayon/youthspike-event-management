import { notFound } from 'next/navigation';
import TeamDetail from '@/components/teams/TeamDetail';
import { divisionsToOptionList } from '@/utils/helper';
import {
  IMatchExpRel,
  IMatchRelatives,
  INetRelatives,
  IPlayer,
  IPlayerExpRel,
  IRoundRelatives,
  ITeam,
  TParams,
} from '@/types';
import { getTeamData } from '../../../_requests/teams';

interface TeamSingleMainProps {
  params: TParams;
}

export default async function TeamSingleMain({ params }: TeamSingleMainProps) {
  const pathParams = await params;
  const teamData = await getTeamData(pathParams.teamId);
  if (!teamData) return notFound();

  const {
    team,
    playerRanking,
    players,
    captain,
    cocaptain,
    group,
    event,
    matches,
    rankings,
    rounds,
    nets,
    oponentTeams
  } = teamData;

  const divisionList = event?.divisions ? divisionsToOptionList(event.divisions) : [];

  // Assign captain/cocaptain
  playerRanking.rankings = rankings;
  team.captain = captain;
  team.cocaptain = cocaptain;

  // --- Build lookup maps in O(n) ---
  const roundMap = new Map<string, IRoundRelatives>(
    rounds.map((r: IRoundRelatives) => [r._id, r])
  );
  const netMap = new Map<string, INetRelatives>(
    nets.map((n: INetRelatives) => [n._id, n])
  );
  const oponentTeamMap = new Map<string, ITeam>(
    oponentTeams.map((t: ITeam) => [t._id, t])
  );

  // --- Process Matches Efficiently ---
  const matchList = matches.map((m: any) => {
    const enrichedMatch: IMatchExpRel = {
      ...m,
      rounds: m.rounds.map((id: string) => roundMap.get(id)).filter(Boolean) as IRoundRelatives[],
      nets: m.nets.map((id: string) => netMap.get(id)).filter(Boolean) as INetRelatives[],
    };

    if (oponentTeamMap.has(m.teamA)) {
      enrichedMatch.teamA = oponentTeamMap.get(m.teamA)!;
      enrichedMatch.teamB = team;
    } else if (oponentTeamMap.has(m.teamB)) {
      enrichedMatch.teamB = oponentTeamMap.get(m.teamB)!;
      enrichedMatch.teamA = team;
    }

    return enrichedMatch;
  });

  

  // --- Separate Players into assigned/unassigned ---
  const classifyPlayers = (players: IPlayerExpRel[]) => {
    const teamPlayers: IPlayerExpRel[] = [];
    const unassignedPlayers: IPlayerExpRel[] = [];

    for (const p of players) {
      const playerObj = structuredClone(p);

      if (p.teams?.length && p.teams?.length > 0) {
        if(playerObj.teams?.includes(team._id) ){
          playerObj.teams = [team];
  
          if (playerObj.captainofteams?.length) {
            playerObj.captainofteams = [team._id];
          }
  
          if (playerObj.cocaptainofteams?.length) {
            playerObj.cocaptainofteams = [team._id];
          }
  
          teamPlayers.push(playerObj);
        }
      } else {
        playerObj.teams = [];
        unassignedPlayers.push(playerObj);
      }
    }

    return { teamPlayers, unassignedPlayers };
  };

  const { teamPlayers, unassignedPlayers } = classifyPlayers(players);

  

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <TeamDetail
        event={event}
        // @ts-ignore
        unassignedPlayers={unassignedPlayers}
        team={team}
        eventId={pathParams.eventId}
        divisionList={divisionList}
        teamList={oponentTeams}
        // @ts-ignore
        playerList={teamPlayers}
        playerRanking={playerRanking}
        matchList={matchList}
        rankings={rankings}
      />
    </div>
  );
}
