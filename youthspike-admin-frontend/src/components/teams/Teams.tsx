// =========================
// app/events/[eventId]/teams/page.tsx
// =========================

import { Suspense } from 'react';
import { PreloadQuery } from '@/lib/client';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client/react';
import { ISearchLimitFilter, ISearchTeamResponse, ITeamFilter } from '@/types';
import { SEARCH_TEAM_LIST_LIGHT } from '@/graphql/teams';
import TeamsContainer from '@/components/teams/TeamsContainer';

interface ITeamsProps {
  eventId: string;
  search: string;
  division: string;
  group: string;
}

export default async function Teams({ division, eventId, group, search }: ITeamsProps) {
  const initialFilter: Partial<ISearchLimitFilter> = {
    limit: 30,
    offset: 0,
    search,
    division,
    group,
  };

  return (
    <PreloadQuery query={SEARCH_TEAM_LIST_LIGHT} variables={{ eventId, filter: initialFilter }}>
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <TeamsContainer queryRef={queryRef as QueryRef<{ searchTeams: ISearchTeamResponse }>} eventId={eventId} initialSearchParams={{ search, division, group }} />
        </Suspense>
      )}
    </PreloadQuery>
  );
}
