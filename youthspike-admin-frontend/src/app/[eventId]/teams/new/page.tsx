import { getEventWithPlayers } from '@/app/_requests/players';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import TeamContainer from '@/components/teams/TeamContainer';
import { TParams } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import { notFound } from 'next/navigation';


interface ITeamsPageProps{
  params: TParams;
}

async function TeamsPage({ params }: ITeamsPageProps) {
  const pathParams = await params;

  const eventWithPlayers = await getEventWithPlayers(pathParams.eventId);

  if (!eventWithPlayers) {
    notFound();
  }



  const players = eventWithPlayers.players || [];
  const divisionList = divisionsToOptionList(eventWithPlayers?.divisions) || [];
  const groups = eventWithPlayers?.groups || [];
  
  

  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='mb-8 text-center'>Teams</h1>
      <CurrentEvent currEvent={eventWithPlayers} />
      <div className="navigator mb-4">
        <UserMenuList eventId={pathParams.eventId} />
      </div>
      <TeamContainer players={players} divisionList={divisionList} eventId={pathParams.eventId} groups={groups} />
    </div>
  )
}

export default TeamsPage;