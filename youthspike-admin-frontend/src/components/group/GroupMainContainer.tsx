'use client';

import { IGetGroupsRespone, IGroupExpRel } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import GroupAddSidebar from './GroupAddSidebar';
import { divisionsToOptionList } from '@/utils/helper';
import EventNavigation from '../layout/EventNavigation';

interface ITeamStandingsContainerProps {
  queryRef: QueryRef<{ getEvent: IGetGroupsRespone }>;
  eventId: string;
}

function GroupMainContainer({ queryRef, eventId }: ITeamStandingsContainerProps) {
  const { data } = useReadQuery(queryRef);

  const divisionList = divisionsToOptionList(data?.getEvent?.data?.divisions || '');
  const groupList = data?.getEvent?.data?.groups || [];

  return (
    <div>
      <div className="navigation my-8">
        <EventNavigation event={data?.getEvent?.data || null} />
      </div>
      <main className="container mx-auto py-10 flex flex-col lg:flex-row gap-10">
        <GroupAddSidebar divisionList={divisionList} eventId={eventId} groupList={groupList as IGroupExpRel[]} />
      </main>
    </div>
  );
}

export default GroupMainContainer;
