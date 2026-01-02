'use client';

import { IGetEventWithTeamsAndGroupsResponse, IGroup, IGroupExpRel, IMatchExpRel, ITeam } from '@/types';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import React, { useEffect, useMemo, useState } from 'react';
import MatchAdd from './MatchAdd';
import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import SelectInput from '../elements/forms/SelectInput';
import { divisionsToOptionList } from '@/utils/helper';
import EventNavigation from '../layout/EventNavigation';

interface IMatchAddContainerProps {
  queryRef: QueryRef<{ getEvent: IGetEventWithTeamsAndGroupsResponse }>;
  eventId: string;
}

function MatchAddContainer({ queryRef, eventId }: IMatchAddContainerProps) {
  const { data } = useReadQuery(queryRef);
  // Event, teams, groups
  const eventData = data?.getEvent?.data;
  if (!eventData) {
    throw new Error('Event data not found');
  }


  // Local State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showMatchAddForm, setShowMatchAddForm] = useState<boolean>(false);
  const [currDivision, setCurrDivision] = useState<string>('');

  // Memoization
  const { teams, groups, divisionList } = useMemo(() => {
    const { teams: t, groups: g, divisions: d } = eventData;
    return {
      teams: t,
      groups: g,
      divisionList: divisionsToOptionList(d),
    };
  }, [eventData]);

  const { teamList, groupList } = useMemo(() => {
    const tl: ITeam[] = [];
    for (const team of teams) {
      if (currDivision && currDivision !== '' && team.division !== currDivision) {
        continue;
      }
      tl.push(team);
    }
    const gl: IGroup[] = [];
    for (const group of groups) {
      if (currDivision && currDivision !== '' && group.division !== currDivision) {
        continue;
      }
      gl.push(group);
    }
    return { teamList: tl, groupList: gl };
  }, [currDivision, teams, groups]);

  // Event handlers
  const handleMatchAdded = (newMatch: IMatchExpRel) => {
    // Note: This mutates the original matches array
    // Consider using state management if this causes issues
    //   setMatchList((prev) => [...prev, newMatch]);
  };

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setCurrDivision(inputEl.value.trim());
    if (inputEl.value) {
      SessionStorageService.setItem(DIVISION, inputEl.value.trim());
    } else {
      SessionStorageService.removeItem(DIVISION);
    }
  };

  // Component did mount
  useEffect(() => {
    // Trying find data from session storage for division
    const savedDivision = SessionStorageService.getItem(DIVISION);
    if (savedDivision) {
      setCurrDivision(String(savedDivision).trim());
    }
  }, []);
  

  return (
    <div>
      <div className="navigation my-8">
        <EventNavigation event={eventData} />
      </div>
      <h1>Add New Match</h1>
      {/* Need an input item for division selection */}
      <div className="mt-2 division-selection w-full">
        <SelectInput key="division-selector-add" handleSelect={handleDivisionSelection} value={currDivision} name="division" optionList={divisionList} />
      </div>
      <MatchAdd
        eventData={eventData}
        teamList={teamList}
        eventId={eventId}
        addMatchCB={handleMatchAdded}
        setIsLoading={setIsLoading}
        showAddMatch={setShowMatchAddForm}
        groupList={groupList as IGroupExpRel[]}
        currDivision={currDivision}
      />
    </div>
  );
}

export default MatchAddContainer;
