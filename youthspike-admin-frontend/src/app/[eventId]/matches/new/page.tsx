import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { IGetEventWithTeamsAndGroupsResponse, ISearchFilter } from '@/types';
import { GET_AN_EVENT_WITH_TEAMS_AND_GROUPS } from '@/graphql/event';
import MatchAddContainer from '@/components/match/MatchAddContainer';

interface IMatchesPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ISearchFilter>;
}

export default async function MatchesPage({ params }: IMatchesPageProps) {
  const { eventId } = await params;

  return (
    <PreloadQuery query={GET_AN_EVENT_WITH_TEAMS_AND_GROUPS} variables={{ eventId }}>
      {(queryRef) => <MatchAddContainer queryRef={queryRef as QueryRef<{ getEvent: IGetEventWithTeamsAndGroupsResponse }>} eventId={eventId} />}
    </PreloadQuery>
  );
}
