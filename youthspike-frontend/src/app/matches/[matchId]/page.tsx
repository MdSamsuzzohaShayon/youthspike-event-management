import { Suspense } from "react";
import { IMatchExpRel, TParams } from "@/types";
import { PreloadQuery } from "@/lib/client";
import { GET_MATCH_DETAIL } from "@/graphql/matches";
import MatchMain from "@/components/match/MatchMain";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";

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
          <MatchMain queryRef={queryRef as QueryRef<{ getMatch: { data: IMatchExpRel } }>} />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

export default MatchPage;