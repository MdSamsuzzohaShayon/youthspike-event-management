// =========================
// app/players/page.tsx
// =========================

import { Suspense } from "react";
import { PreloadQuery } from "@/lib/client";
import Loader from "@/components/elements/Loader";
import { QueryRef } from "@apollo/client/react";

import { IGetTemplatesResponse, IGetTemplatesWithEventResponse, ISearchFilter } from "@/types";
import { GET_TEMPLATES, GET_TEMPLATES_WITH_EVENT } from "@/graphql/templates";
import TemplatesMainContainer from "@/components/template/TemplatesMainContainer";


interface ITemplatesPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Omit<ISearchFilter, 'ce'>>;
}

// Player list -> http://localhost:3001/events/68afc5f30bf9dbb4ac0f69cb/players?search=alex+hart&limit=30
// Player stats -> http://localhost:3001/players/68c428341a3dc4cfb835d29c
export default async function TemplatesPage({
  params,
  searchParams,
}: ITemplatesPageProps) {
  const { eventId } = await params;
  const { search = "", division = "", group = "" } = await searchParams;

  const initialFilter: Partial<Omit<ISearchFilter, 'ce'>> = {
    search,
    division,
    group,
  };

  return (
    <PreloadQuery
      query={GET_TEMPLATES_WITH_EVENT}
      variables={{ eventId: eventId, filter: initialFilter }}
    >
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TemplatesMainContainer
            queryRef={queryRef as QueryRef<{ getTemplatesWithEvent: IGetTemplatesWithEventResponse }>} // Replace with proper type
            eventId={eventId}
          />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
