import { IPlayerExpRel, ITeam, TParams } from '@/types';
import { notFound } from 'next/navigation';
import PlayersMain from '@/components/player/PlayersMain';
import { getEventPlayersGroupsTeams } from '@/app/_requests/players';

interface IPlayersPageProps {
  params: TParams;
}

async function PlayersPage({ params }: IPlayersPageProps) {

  const pathParams = await params;

  const playersData = await getEventPlayersGroupsTeams(pathParams.eventId);

  if (!playersData) {
    notFound();
  }

  // Matches,
  const { event, players, groups, teams } = playersData;

  const teamMap = new Map(teams.map((t: ITeam) => [t._id, t]));

  const playerList = players.map((p: IPlayerExpRel) => {
    const playerObj = { ...p };
    let playerTeams: IPlayerExpRel[] = [];
    if (p.teams && p.teams?.length > 0) {
      if (teamMap.has(p.teams[0])) {
        // @ts-ignore
        playerTeams = [teamMap.get(p.teams[0])];
      }
    }
    // @ts-ignore
    playerObj.teams = playerTeams;

    return playerObj;
  });

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Roster</h1>
      <PlayersMain currEvent={event} players={playerList} groups={groups} teams={teams} />
    </div>
  );
}

export default PlayersPage;
