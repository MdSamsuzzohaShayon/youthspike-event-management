import { notFound } from 'next/navigation';
import TeamMain from './TeamMain';
import { getEventWithTeams } from '@/app/[eventId]/teams/_fetch/team';
import { IEventPageProps } from '@/types';





export default async function Team({ params: { eventId } }: IEventPageProps) {
  const eventDetail = await getEventWithTeams(eventId);

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
