// =========================
// app/events/[eventId]/teams/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";
import { ISearchLimitFilter, ISearchTeamResponse, ITeamFilter } from "@/types";
import { SEARCH_TEAMS } from "@/graphql/teams";
import TeamStandingsContainer from "@/components/teams/TeamStandingsContainer";



interface ITeamStandingsPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ITeamFilter>;
}

export default async function TeamStandingsPage({
  params,
  searchParams,
}: ITeamStandingsPageProps) {
  const { eventId } = await params;

  console.log({eventId});
  
  const {
    search = "",
    division = "",
    group = "",
  } = await searchParams;

  const initialFilter: Partial<ISearchLimitFilter> = {
    limit: 30,
    offset: 0,
    search,
    division,
    group,
  };

  return (
    <PreloadQuery
      query={SEARCH_TEAMS}
      variables={{ eventIds: [eventId], filter: initialFilter }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamStandingsContainer
            queryRef={
              queryRef as QueryRef<{ searchTeams: ISearchTeamResponse }>
            }
            eventId={eventId}
            initialSearchParams={{ search, division, group }}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}

