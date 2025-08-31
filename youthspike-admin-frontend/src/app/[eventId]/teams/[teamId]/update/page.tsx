import { getATeam } from '@/app/_requests/teams';
import UserMenuList from '@/components/layout/UserMenuList';
import TeamUpdateMain from '@/components/teams/TeamUpdateMain';
import { TParams } from '@/types';
import { notFound } from 'next/navigation';

interface ITeamUpdatePageProps{
  params: TParams;
}

async function TeamUpdatePage({ params }: ITeamUpdatePageProps) {

  const pathParams = await params;

  const teamExist = await getATeam(pathParams.teamId);
  if(!teamExist){
    notFound();
  }
  

  const groupList = teamExist?.event?.groups ?? [];
  const players = teamExist?.players ?? [];
  const divisions = teamExist?.event?.divisions || "";



  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='mb-8 text-center'>Update Team</h1>
      <div className="navigator mb-4">
        <UserMenuList eventId={pathParams.eventId} />
      </div>
      <TeamUpdateMain groups={groupList} team={teamExist} eventId={pathParams.eventId} players={players} divisions={divisions} />
    </div>
  )
}

export default TeamUpdatePage;