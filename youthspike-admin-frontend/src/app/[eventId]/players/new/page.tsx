import { getEventWithPlayers } from '@/app/_requests/players';
import PlayerAddMain from '@/components/player/PlayerAddMain';
import { TParams } from '@/types';
import { notFound } from 'next/navigation';

interface IPlayerAddPageProps {
  params: TParams;
}

async function PlayerAddPage({ params }: IPlayerAddPageProps) {
  const pathParams = await params;

  const eventWithPlayers = await getEventWithPlayers(pathParams.eventId);

  if (!eventWithPlayers) {
    notFound();
  }



  const teams = eventWithPlayers?.teams || [];
  const divisions = eventWithPlayers?.divisions;

  return (<div className="container mx-auto px-4 min-h-screen">
    <PlayerAddMain teams={teams} divisions={divisions} event={eventWithPlayers} />
  </div>);
}

export default PlayerAddPage;
