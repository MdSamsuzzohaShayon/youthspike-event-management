import { notFound } from 'next/navigation';
import { getEventWithTeams } from '@/app/_requests/teams';
import { TParams } from '@/types';
import TeamListMain from './TeamListMain';




interface ITeamProps{
  params: TParams;
}
export default async function Teams({params}: ITeamProps) {
  const {eventId} = await params;
  const eventDetail = await getEventWithTeams(eventId);
  
  if (!eventDetail) {
    notFound();
  }

  if(!eventDetail?.event){
    const err =  new Error(`There is not event found with this ID !{eventId}`)
    err.name = "Event not found!";
    throw err;
  }

  return (
    <div className="w-full">
      <h1 className="text-4xl font-bold text-center text-white mb-6">Team Management</h1>
      <TeamListMain eventDetail={eventDetail} />
    </div>
  );
}
