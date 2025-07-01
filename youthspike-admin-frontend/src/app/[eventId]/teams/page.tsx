import Team from '@/components/teams/Team';
import { TParams } from '@/types';

interface ITeamsPageProps{
  params: TParams;
}

function TeamsPage({ params }: ITeamsPageProps) {
  return (
    <div className="team-main container mx-auto px-4 py-6 min-h-screen">
      <Team params={params} />
    </div>
  );
}

export default TeamsPage;
