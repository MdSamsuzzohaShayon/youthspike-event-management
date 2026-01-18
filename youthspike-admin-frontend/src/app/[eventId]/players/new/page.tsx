// =========================
// app/players/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";

import { IGetEventWithTeamsResponse } from "@/types";
import { GET_EVENT_WITH_TEAMS_LIGHT } from "@/graphql/teams";
import PlayerAddContainer from "@/components/player/PlayerAddContainer";

interface IProps {
  params: Promise<{ eventId: string }>;
}


export default async function NewPlayerPage({
  params,
}: IProps) {
  const { eventId } = await params;


  return (
    <PreloadQuery
      query={GET_EVENT_WITH_TEAMS_LIGHT}
      variables={{ eventId }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <PlayerAddContainer
            queryRef={queryRef as QueryRef<{ getEvent: IGetEventWithTeamsResponse }>} eventId={eventId}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
