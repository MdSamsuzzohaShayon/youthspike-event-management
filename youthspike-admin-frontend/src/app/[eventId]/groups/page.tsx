/*
import UserMenuList from '@/components/layout/UserMenuList';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getAllGroups } from '@/app/_requests/groups';
import { notFound } from 'next/navigation';
import { divisionsToOptionList } from '@/utils/helper';
import GroupAddSidebar from '@/components/group/GroupAddSidebar';
import { TParams } from '@/types';
import EventNavigation from '@/components/layout/EventNavigation';

interface IGroupsPageProps {
  params: TParams;
}

async function GroupsPage({ params }: IGroupsPageProps) {
  const pathParams = await params;

  const eventGroups = await getAllGroups(pathParams.eventId);

  if (!eventGroups) {
    notFound();
  }

  const groupList = eventGroups?.groups || [];
  const divisionList = divisionsToOptionList(eventGroups.divisions) || [];

  return (
    <div >
     <h1 className="text-4xl md:text-5xl font-bold mb-4">Event Groups</h1> 
     <div className="navigation my-8">
        <EventNavigation event={eventGroups} />
      </div> 


      <main className="container mx-auto py-10 flex flex-col lg:flex-row gap-10">
        <GroupAddSidebar divisionList={divisionList} eventId={pathParams.eventId} groupList={groupList} />
      </main>
    </div>
  );
}

export default GroupsPage;
*/

import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { IEvent, IGetGroupsRespone, IResponse, TParams } from '@/types';
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
