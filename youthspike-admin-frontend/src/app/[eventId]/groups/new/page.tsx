import { IGetGroupsRespone, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { GET_EVENT_WITH_GROUP } from '@/graphql/group';
import GroupAddContainer from '@/components/group/GroupAddContainer';
import { QueryRef } from '@apollo/client/react';

interface INewGroupProps {
  params: TParams;
}

async function NewGroup({ params }: INewGroupProps) {
  const pathParams = await params;

  const { eventId } = pathParams;

  return (


    <PreloadQuery query={GET_EVENT_WITH_GROUP} variables={{ eventId }}>
      {(queryRef) => (
          <GroupAddContainer queryRef={queryRef as QueryRef<{ getEvent: IGetGroupsRespone }>} eventId={eventId} />
      )}
    </PreloadQuery>
  );
}

export default NewGroup;

