import Team from '@/components/teams/Team';
import { IEventPageProps } from '@/types';


function TeamsPage({ params }: IEventPageProps) {
  return (
    <div className="team-main container mx-auto px-4 py-6 min-h-screen">
      <Team params={params} />
    </div>
  );
}

export default TeamsPage;
