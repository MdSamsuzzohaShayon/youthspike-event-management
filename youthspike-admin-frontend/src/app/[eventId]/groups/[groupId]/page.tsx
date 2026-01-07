import GroupUpdateContainer from '@/components/group/GroupUpdateContainer';
import { GET_A_GROUP } from '@/graphql/group';
import { PreloadQuery } from '@/lib/client';
import { IGroupResponse, TParams } from '@/types';
import { QueryRef } from '@apollo/client/react';

interface IProps {
  params: TParams;
}

async function UpdateGroupPage({ params }: IProps) {
  const pathParams = await params;
  const { groupId } = pathParams;

  return (

    <PreloadQuery query={GET_A_GROUP} variables={{ groupId }}>
      {(queryRef) => <GroupUpdateContainer queryRef={queryRef as QueryRef<{ getGroup: IGroupResponse }>} />}
    </PreloadQuery>
  );
}

export default UpdateGroupPage;
