import { Suspense } from 'react';
import { PreloadQuery } from '@/lib/client';
import Loader from '@/components/elements/Loader';
import { QueryRef } from '@apollo/client/react';
import { ISearchLimitFilter, ISearchTeamResponse, ITeamFilter } from '@/types';
import { SEARCH_TEAM_LIST_LIGHT } from '@/graphql/teams';
import TeamsContainer from '@/components/teams/TeamsContainer';
import AdminTeamsContainer from '@/components/teams/AdminTeamsContainer';


interface ITeamsPageProps {
  searchParams: Promise<ITeamFilter>;
}



async function TeamsPage({ searchParams }: ITeamsPageProps) {

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
    <PreloadQuery query={SEARCH_TEAM_LIST_LIGHT} variables={{ eventIds: [], filter: initialFilter }}>
      {(queryRef) => (
        <Suspense fallback={<Loader />}>
          <AdminTeamsContainer queryRef={queryRef as QueryRef<{ searchTeams: ISearchTeamResponse }>} initialSearchParams={{ search, division, group }} />
          {/* <TeamsContainer queryRef={queryRef as QueryRef<{ searchTeams: ISearchTeamResponse }>} initialSearchParams={{ search, division, group }} /> */}
        </Suspense>
      )}
    </PreloadQuery>
  );
}


export default TeamsPage;
