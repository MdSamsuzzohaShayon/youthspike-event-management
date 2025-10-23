// =========================
// app/events/[eventId]/matches/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";
import { SEARCH_MATCHES } from "@/graphql/matches";
import MatchesMain from "@/components/match/MatchesMain";
import { ISearchFilter, ISearchLimitFilter, ISearchMatchResponse } from "@/types";



interface IMatchesPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ISearchFilter>;
}

export default async function MatchesPage({
  params,
  searchParams,
}: IMatchesPageProps) {
  const { eventId } = await params;
  const {
    search = "",
    division = "",
    group = "",
    status = "",
  } = await searchParams;

  const initialFilter: Partial<ISearchLimitFilter> = {
    limit: 30,
    offset: 0,
    search,
    division,
    group,
    status,
  };

  return (
    <PreloadQuery
      query={SEARCH_MATCHES}
      variables={{ eventId, filter: initialFilter }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <MatchesMain
            queryRef={
              queryRef as QueryRef<{ searchMatches: ISearchMatchResponse }>
            }
            eventId={eventId}
            initialSearchParams={{ search, division, group, status }}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
