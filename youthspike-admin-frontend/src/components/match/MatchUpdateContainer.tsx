'use client';

import { IEvent, IGetMatchResponse } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import React, { useState } from 'react';
import MatchAdd from './MatchAdd';
import EventNavigation from '../layout/EventNavigation';

interface IProps {
  queryRef: QueryRef<{ getMatch: IGetMatchResponse }>;
  eventId: string;
}
function MatchUpdateContainer({ eventId, queryRef }: IProps) {
  const { data } = useReadQuery(queryRef);

  const matchData = data?.getMatch?.data;
  if (!matchData) {
    throw new Error('Match not found');
  }

  const {event} = matchData;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Event, teams, groups

  return <div>
    <div className="navigation my-8">
        <EventNavigation event={event as unknown as IEvent} />
      </div>
      <h1>Update New Match</h1>
      {/* Need an input item for division selection */}
      {/* <div className="mt-2 division-selection w-full">
        <SelectInput key="division-selector-add" handleSelect={handleDivisionSelection} value={currDivision} name="division" optionList={divisionList} />
      </div> */}
    {matchData && <MatchAdd groupList={[]} prevMatch={matchData} eventId={eventId} setIsLoading={setIsLoading} update matchId={matchData._id} />}</div>;
}

export default MatchUpdateContainer;
