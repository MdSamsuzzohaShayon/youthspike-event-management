import { notFound } from 'next/navigation';
import { isValidObjectId } from '@/utils/helper';
import { BACKEND_URL } from '@/utils/keys';
import { GET_EVENT_WITH_TEAMS_RAW } from '@/graphql/teams';
import TeamMain from './TeamMain';

interface ITeamsOfEventPage {
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
      query: GET_EVENT_WITH_TEAMS_RAW,
      variables: { eventId },
    }),
    cache: 'no-store',
  });

  const { data } = await res.json();
  return data?.getEventWithTeams?.data || null;
}

export default async function Team({ params: { eventId } }: ITeamsOfEventPage) {
  const eventDetail = await getEvent(eventId);

  if (!eventDetail) {
    notFound();
  }

  return (
    <div className="w-full">
      <h1 className="text-4xl font-bold text-center text-white mb-6">Team Management</h1>
      <TeamMain eventDetail={eventDetail} />
    </div>
  );
}
