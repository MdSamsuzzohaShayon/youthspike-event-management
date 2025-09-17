import { notFound } from 'next/navigation';
import { getEventWithTeams } from '@/app/_requests/teams';
import { TParams } from '@/types';
import TeamListMain from './TeamListMain';




interface ITeamProps{
  params: TParams;
}
export default async function Teams({params}: ITeamProps) {
  const pathParams = await params;
  const eventDetail = await getEventWithTeams(pathParams.eventId);

  if (!eventDetail) {
    notFound();
  }

  return (
    <div className="w-full">
      <h1 className="text-4xl font-bold text-center text-white mb-6">Team Management</h1>
      <TeamListMain eventDetail={eventDetail} />
    </div>
  );
}
