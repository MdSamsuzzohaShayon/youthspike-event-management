import { getPlayerAndTeams } from '@/app/_requests/players';
import PlayerAdd from '@/components/player/PlayerAdd';
import { IPlayerExpRel } from '@/types';
import { notFound } from 'next/navigation';


interface IPlayerSingleProps{
  params: {
    eventId: string;
    playerId: string;
  }
}
// GET_A_PLAYER_RAW
async function PlayerSingle({ params }: IPlayerSingleProps) {

  const playerAndTeams = await getPlayerAndTeams(params.playerId, params.eventId);
  

  if(!playerAndTeams){
    notFound();
  }




  const {player, teams} = playerAndTeams;


  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1>Player Update</h1>
       <PlayerAdd eventId={params.eventId} update prevPlayer={player} teamList={teams} />
    </div>
  )
}

export default PlayerSingle;