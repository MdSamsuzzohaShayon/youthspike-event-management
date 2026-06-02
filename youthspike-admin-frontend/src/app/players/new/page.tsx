import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";

import { IGetEventsWithTeamsResponse, TParams } from "@/types";
import PlayerAddContainer from "@/components/player/PlayerAddContainer";
import { GET_EVENTS_WITH_TEAMS } from "@/graphql/players";

interface INewPlayerPageProps {
  searchParams: TParams;
}



export default async function NewPlayerPage({searchParams}: INewPlayerPageProps) {


  const { ldoId } = await searchParams;

  const variables: Record<string, string> = {};
  if (ldoId) {
    variables.ldoId = ldoId;
  }



  return (
    <PreloadQuery
      query={GET_EVENTS_WITH_TEAMS}
      variables={variables}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <PlayerAddContainer
            queryRef={queryRef as QueryRef<{ getEventsWithTeams: IGetEventsWithTeamsResponse }>}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
