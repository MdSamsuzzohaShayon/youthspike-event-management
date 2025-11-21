// =========================
// app/players/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";

import { ISearchFilter, ISearchPlayerResponse } from "@/types";
import PlayersMain from "@/components/player/PlayersMain";
import { SEARCH_PLAYERS } from "@/graphql/player";

interface IPlayersPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ISearchFilter>;
}

// Player list -> http://localhost:3001/events/68afc5f30bf9dbb4ac0f69cb/players?search=alex+hart&limit=30
// Player stats -> http://localhost:3001/players/68c428341a3dc4cfb835d29c
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
            queryRef={queryRef as QueryRef<{ searchPlayers: ISearchPlayerResponse }>} // Replace with proper type
            initialSearchParams={{ search, division, group }}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
