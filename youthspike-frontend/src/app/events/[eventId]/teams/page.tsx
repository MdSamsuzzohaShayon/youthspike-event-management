// =========================
// app/events/[eventId]/teams/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";
import { ISearchFilter, ISearchLimitFilter, ISearchMatchResponse, ISearchTeamResponse, ITeamFilter } from "@/types";
import { SEARCH_TEAMS } from "@/graphql/team";
import TeamsMain from "@/components/team/TeamsMain";



interface ITeamsPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ITeamFilter>;
}

export default async function TeamsPage({
  params,
  searchParams,
}: ITeamsPageProps) {
  const { eventId } = await params;
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
      variables={{ eventId, filter: initialFilter }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamsMain
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
