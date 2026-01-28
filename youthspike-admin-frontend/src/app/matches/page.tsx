import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { SEARCH_MATCHES } from '@/graphql/matches';
import MatchesMainContainer from '@/components/match/MatchesMainContainer';
import { ISearchFilter, ISearchLimitFilter, ISearchMatchResponse } from '@/types';

interface IMatchesPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ISearchFilter>;
}

export default async function MatchesPage({ searchParams }: IMatchesPageProps) {
  const { search = '', division = '', group = '', status = '' } = await searchParams;
  

  const initialFilter: Partial<ISearchLimitFilter> = {
    limit: 30,
    offset: 0,
    search,
    division,
    group,
    status,
  };

  return (
    <PreloadQuery query={SEARCH_MATCHES} variables={{ filter: initialFilter }}>
      {(queryRef) => <MatchesMainContainer queryRef={queryRef as QueryRef<{ searchMatches: ISearchMatchResponse }>} initialSearchParams={{ search, division, group, status }} />}
    </PreloadQuery>
  );
}
