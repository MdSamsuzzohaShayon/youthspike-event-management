import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { SEARCH_MATCHES } from '@/graphql/matches';
import MatchesMainContainer from '@/components/match/MatchesMainContainer';
import { IGetArchiveEvents, ISearchFilter, ISearchLimitFilter, ISearchMatchResponse } from '@/types';
import { GET_ARCHIVED_EVENTS } from '@/graphql/archive';
import ArchiveMainContainer from '@/components/archive/ArchiveMainContainer';

interface IArchiveEventsPageProps {
    params: Promise<{ eventId: string }>;
    searchParams: Promise<ISearchFilter>;
}

async function ArchiveEventsPage({ searchParams }: IArchiveEventsPageProps) {
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
        <PreloadQuery query={GET_ARCHIVED_EVENTS}
        // variables={{ filter: initialFilter }}
        >
            {(queryRef) => <ArchiveMainContainer queryRef={queryRef as QueryRef<{ getArchivedEvents: IGetArchiveEvents }>}
                // initialSearchParams={{ search, division, group, status }}
            />}
        </PreloadQuery>
    );
}


export default ArchiveEventsPage;
