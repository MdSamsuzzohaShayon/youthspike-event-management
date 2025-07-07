import { getMatch } from '@/app/_requests/matches';
import MatchUpdateMain from '@/components/match/MatchUpdateMain';
import { TParams } from '@/types';
import { notFound } from 'next/navigation';

interface MatchSinglePageProps {
  params: TParams;
}

async function MatchSinglePage({ params }: MatchSinglePageProps) {
  const pathParams = await params;

  // const [isLoading, setIsLoading] = useState<boolean>(false);
  //   const {setActErr} = useError();

  // const [fetchMatch, { data, loading, error, refetch }] = useLazyQuery(GET_A_MATCH, { variables: { matchId: pathParams.matchId } });
  const matchExist = await getMatch(pathParams.matchId);
  if (!matchExist) notFound();

  const roundList = matchExist?.rounds;

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="uppercase text-center">Match</h1>

      <MatchUpdateMain eventId={pathParams.eventId} match={matchExist} matchId={pathParams.matchId} roundList={roundList} />
    </div>
  );
}

export default MatchSinglePage;
