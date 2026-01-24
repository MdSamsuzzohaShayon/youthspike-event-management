import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { IGetGroupsRespone, TParams } from '@/types';
import GroupMainContainer from '@/components/group/GroupMainContainer';
import { GET_GROUPS } from '@/graphql/group';

interface IGroupsPageProps {
  params: TParams;
}

export default async function GroupsPage({ params }: IGroupsPageProps) {
  const { eventId } = await params;

  return (
    <PreloadQuery query={GET_GROUPS} variables={{ eventId }}>
      {(queryRef) => <GroupMainContainer queryRef={queryRef as QueryRef<{ getEvent: IGetGroupsRespone }>} eventId={eventId} />}
    </PreloadQuery>
  );
}
