import { Suspense } from "react";
import { IMatchExpRel, TParams } from "@/types";
import { PreloadQuery } from "@/lib/client";
import { GET_MATCH_DETAIL } from "@/graphql/matches";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";
import MatchScoreBoard from "@/components/scoreboard/MatchScoreboard";

interface IMatchPageProps {
  params: TParams;
}

export async function MatchPage({ params }: IMatchPageProps) {
  const { matchId } = await params;

  return (
    <PreloadQuery
      query={GET_MATCH_DETAIL}
      variables={{
        matchId: matchId,
      }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <MatchScoreBoard
            queryRef={
              queryRef as QueryRef<{ getMatch: { data: IMatchExpRel } }>
            }
            matchId={matchId} // Pass matchId for refreshing
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

export default MatchPage;