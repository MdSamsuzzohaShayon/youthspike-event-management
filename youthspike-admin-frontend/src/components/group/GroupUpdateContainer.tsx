'use client';

import { motion } from 'framer-motion';
import React from 'react';
import GroupAddOrUpdate from './GroupAddOrUpdate';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { IEvent, IGroupAdd, IGroupResponse } from '@/types';
import EventNavigation from '../layout/EventNavigation';

interface IProps {
  queryRef: QueryRef<{ getGroup: IGroupResponse }>;
}
function GroupUpdateContainer({ queryRef }: IProps) {
  const { data } = useReadQuery(queryRef);

  const groupData = data?.getGroup?.data;
  if (!groupData) {
    throw new Error('Team not found');
  }

  const { event, teams } = groupData;

  return (
    <div>
      <div className="navigation my-8">
        <EventNavigation event={event} />
      </div>
      <h1>Update Group</h1>

      <div>
        <GroupAddOrUpdate update={true} prevGroup={groupData as unknown as IGroupAdd} teamList={teams} eventId={event?._id || ""} />
      </div>
    </div>
  );
}

export default GroupUpdateContainer;
