'use client';

import { IGetEventWithTeamsResponse, ITeam } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import React, { useEffect, useMemo, useState } from 'react';
import EventNavigation from '../layout/EventNavigation';
import SelectInput from '../elements/forms/SelectInput';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import { divisionsToOptionList, filterByDivision } from '@/utils/helper';
import PlayerAdd from './PlayerAdd';

interface IProps {
  queryRef: QueryRef<{ getEvent: IGetEventWithTeamsResponse }>;
  eventId: string;
}

function PlayerAddContainer({ eventId, queryRef }: IProps) {
  const { data } = useReadQuery(queryRef);

  const eventData = data?.getEvent?.data;

  if (!eventData) throw new Error('Event not found!');

  const [selectedDivision, setSelectedDivision] = useState<string>('');

  // -------------------- Memoized Values --------------------
  const divisionOptions = useMemo(() => divisionsToOptionList(eventData?.divisions || ''), [eventData?.divisions]);

  const filteredTeams = useMemo<ITeam[]>(() => {
    if (!selectedDivision) return eventData?.teams || [];
    return filterByDivision(eventData.teams, selectedDivision);
  }, [eventData.groups, selectedDivision]);

  // -------------------- Handlers --------------------
  const handleDivisionChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    const division = inputEl.value.trim();

    setSelectedDivision(division);

    if (!division) {
      SessionStorageService.removeItem(DIVISION);
    } else {
      SessionStorageService.setItem(DIVISION, division);
    }
  };

  // -------------------- Effects --------------------
  useEffect(() => {
    const savedDivision = SessionStorageService.getItem(DIVISION);
    if (savedDivision) {
      setSelectedDivision(String(savedDivision).trim());
    }
  }, []);

  return (
    <div>
      <div className="navigation my-8">
        <EventNavigation event={eventData} />
      </div>

      <h1>Add New Player</h1>

      <div className="mt-2 division-selection w-full">
        <SelectInput key="division-selector-add" name="division" value={selectedDivision} optionList={divisionOptions} handleSelect={handleDivisionChange} />
      </div>


      <PlayerAdd eventId={eventId} teamList={filteredTeams} division={selectedDivision} />
    </div>
  );
}

export default PlayerAddContainer;
