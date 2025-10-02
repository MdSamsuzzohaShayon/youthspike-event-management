// app/events/[eventId]/matches/page.tsx
import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";
import { SEARCH_MATCHES } from "@/graphql/matches";
import MatchesMain from "@/components/match/MatchesMain";

interface IMatchesPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ 
    search?: string;
    division?: string;
    group?: string;
    matchFilter?: string;
    status?: string;
  }>;
}

export default async function MatchesPage({ params, searchParams }: IMatchesPageProps) {
  const { eventId } = await params;
  const { search = "", division = "", group = "", status = "" } = await searchParams;

  const filter = {
    limit: 30,
    offset: 0,
    search,
    division,
    group
  };

  return (
    <PreloadQuery
      query={SEARCH_MATCHES}
      variables={{
        eventId,
        filter
      }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <MatchesMain 
            queryRef={queryRef as QueryRef<{ searchMatches: any }>} 
            eventId={eventId}
            initialSearchParams={{ search, division, group, status }}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}