import { IPlayerExpRel, IPlayerRanking, IPlayerRankingExpRel, IPlayerRankingItem, ITeam, TParams } from '@/types';
import { notFound } from 'next/navigation';
import PlayersMain from '@/components/player/PlayersMain';
import { getEventPlayersGroupsTeams } from '@/app/_requests/players';
import { getUserFromCookie } from '@/utils/serverCookie';
import { cookies } from 'next/headers';
import { UserRole } from '@/types/user';

interface IPlayersPageProps {
  params: TParams;
}

async function PlayersPage({ params }: IPlayersPageProps) {
  const { eventId } = await params;
  const cookieStore = await cookies();

  // authorization: token ? `Bearer ${token}` : "",
  const userExist = await getUserFromCookie(cookieStore);
  const playersData = await getEventPlayersGroupsTeams(eventId, userExist?.token || null);

  if (!playersData) notFound();

  const { event, players, groups, teams, playerRankings, rankings } = playersData;

  // Build Maps once for quick lookup
  const teamMap = new Map<string, ITeam>(teams.map((t: ITeam) => [t._id, t]));
  const playerMap = new Map<string, IPlayerExpRel>(players.map((p: IPlayerExpRel) => [p._id, p]));

  const captainPlayerId = userExist?.info?.role === UserRole.captain ? userExist.info.captainplayer : userExist?.info?.role === UserRole.co_captain ? userExist.info.cocaptainplayer : null;

  // Show only players of captain's team is logged in as captain or co-captain
  let filteredPlayers = players;
  let playerRanking: IPlayerRankingExpRel | null = null;
  if (captainPlayerId) {
    const captain = playerMap.get(captainPlayerId);
    if (!captain) notFound();
    const teamId = captain.teams && captain.teams.length > 0 ? (typeof captain.teams[0] === 'string' ? captain.teams[0] : captain.teams[0]._id) : null;
    if (!teamId || !teamMap.has(teamId)) notFound();
    filteredPlayers = players.filter((p: IPlayerExpRel) => Array.isArray(p.teams) && p.teams.some((t) => (typeof t === 'string' ? t : t._id) === teamId));

    if(playerRankings.length > 0){
      playerRanking = playerRankings.find((pr: IPlayerRanking)=> pr.team === teamId && pr.rankLock === 0);
      if(playerRanking && rankings.length > 0){
        playerRanking.rankings = rankings.filter((r: IPlayerRankingItem)=> playerRanking && r.playerRanking === playerRanking._id);
      }
    }
  }

  // Assign a single team object (first team) to each player
  const playerList = filteredPlayers.map((p: IPlayerExpRel) => {
    const playerTeams = Array.isArray(p.teams) && p.teams.length > 0 ? [teamMap.get(typeof p.teams[0] === 'string' ? p.teams[0] : p.teams[0]._id)].filter(Boolean) : [];

    return {
      ...p,
      teams: playerTeams,
    };
  });

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Roster</h1>
      <PlayersMain currEvent={event} players={playerList} groups={groups} teams={teams} playerRanking={playerRanking} />
    </div>
  );
}

export default PlayersPage;
