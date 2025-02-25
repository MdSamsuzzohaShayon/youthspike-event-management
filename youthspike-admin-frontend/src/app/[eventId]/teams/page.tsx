import Team from '@/components/teams/Team';

interface ITeamsOfEventPage {
  params: {
    eventId: string;
  };
}

function TeamsPage({ params }: ITeamsOfEventPage) {
  return (
    <div className="team-main container mx-auto px-4 py-6 min-h-screen">
      <Team params={params} />
    </div>
  );
}

export default TeamsPage;
