import { notFound } from 'next/navigation';
import { GET_TEAMS_AND_MATCHES_RAW } from '@/graphql/teams';
import TeamStandingsMain from '@/components/teams/TeamStandingsMain';
import { isValidObjectId } from '@/utils/helper';
import { BACKEND_URL } from '@/utils/keys';

interface ITeamStandingsPageProps {
  params: {
    eventId: string;
  };
}

async function getEvent(eventId: string) {
  if (!isValidObjectId(eventId)) {
    return null;
  }

  const res = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GET_TEAMS_AND_MATCHES_RAW,
      variables: { eventId },
    }),
    cache: 'no-store', // Ensures fresh data on each request
  });

  const { data } = await res.json();
  return data?.getEvent?.data || null;
}

export default async function TeamStandingsPage({ params: { eventId } }: ITeamStandingsPageProps) {
  const currEvent = await getEvent(eventId);

  if (!currEvent) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Roster</h1>
      <TeamStandingsMain eventData={currEvent} />
    </div>
  );
}
