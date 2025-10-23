// =========================
// app/players/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";

import { ISearchFilter } from "@/types";
import PlayersMain from "@/components/player/PlayersMain";
import { SEARCH_PLAYERS } from "@/graphql/player";

interface IPlayersPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ISearchFilter>;
}

export default async function PlayersPage({
  params,
  searchParams,
}: IPlayersPageProps) {
  const { eventId } = await params;
  const { search = "", division = "", group = "" } = await searchParams;

  const initialFilter: Partial<ISearchFilter> = {
    search,
    division,
    group,
  };

  return (
    <PreloadQuery
      query={SEARCH_PLAYERS}
      variables={{ eventId: eventId, filter: initialFilter }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <PlayersMain
            queryRef={queryRef as QueryRef<{ searchPlayers: any }>} // Replace with proper type
            initialSearchParams={{ search, division, group }}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
