import { getEventWithPlayers } from '@/app/_requests/players';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import NewTeamMain from '@/components/teams/NewTeamMain';
import { IEventPageProps } from '@/types';
import { divisionsToOptionList } from '@/utils/helper';
import { notFound } from 'next/navigation';



async function TeamsPage({ params }: IEventPageProps) {

  const eventWithPlayers = await getEventWithPlayers(params.eventId);

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
        <UserMenuList eventId={params.eventId} />
      </div>
      <NewTeamMain players={players} divisionList={divisionList} eventId={params.eventId} groups={groups} />
    </div>
  )
}

export default TeamsPage;