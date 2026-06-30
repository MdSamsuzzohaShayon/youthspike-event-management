// =========================
// app/events/[eventId]/teams/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";
import { ISearchLimitFilter, ISearchTeamResponse, ISearchVariables, ITeamFilter } from "@/types";
import { SEARCH_TEAMS } from "@/graphql/team";
import TeamsContainer from "@/components/team/TeamsContainer";
import { CURRENT_EVENT_ID } from "@/utils/constant";



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

  const variables: ISearchVariables = {
    filter: {
      limit: 30,
      offset: 0,
      search,
      division,
      group,
    },
  };

  variables.eventIds = [eventId];

  return (
    <PreloadQuery
      query={SEARCH_TEAMS}
      variables={variables}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamsContainer
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
