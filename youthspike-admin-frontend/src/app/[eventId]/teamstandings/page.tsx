import { notFound } from 'next/navigation';
import TeamStandingsMain from '@/components/teams/TeamStandingsMain';
import { getEventWithTeamstanding } from './_fetch/teamstanding';

interface ITeamStandingsPageProps {
  params: {
    eventId: string;
  };
}



export default async function TeamStandingsPage({ params: { eventId } }: ITeamStandingsPageProps) {
  const currEvent = await getEventWithTeamstanding(eventId);

  if (!currEvent) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Team Standings</h1>
      <TeamStandingsMain eventData={currEvent} />
    </div>
  );
}
