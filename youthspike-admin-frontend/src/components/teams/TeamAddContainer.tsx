'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { QueryRef, useReadQuery } from '@apollo/client/react';

import {
  IGetEventWithGroupsAndUnassignedPlayersResponse,
  IGroup,
  IPlayer,
} from '@/types';

import SelectInput from '../elements/forms/SelectInput';
import TeamAdd from './TeamAdd';

import SessionStorageService from '@/utils/SessionStorageService';
import { DIVISION } from '@/utils/constant';
import { divisionsOfEvents, divisionsToOptionList, filterByDivision } from '@/utils/helper';
import Loader from '../elements/Loader';

interface TeamAddContainerProps {
  queryRef: QueryRef<{
    getEventWithGroupsAndUnassignedPlayers: IGetEventWithGroupsAndUnassignedPlayersResponse;
  }>;
}


function TeamAddContainer({ queryRef }: TeamAddContainerProps) {
  const { data } = useReadQuery(queryRef);

  if (!data?.getEventWithGroupsAndUnassignedPlayers?.data) {
    throw new Error('Event data not found!');
  }

  const eventData = data.getEventWithGroupsAndUnassignedPlayers.data;

  // -------------------- State --------------------
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('');

  const filteredPlayers = useMemo<IPlayer[]>(() => {
    if (!selectedDivision) return eventData.players;
    return filterByDivision(eventData.players, selectedDivision);
  }, [eventData.players, selectedDivision]);

  //   console.log({filteredPlayers, players: eventData.players});


  const filteredGroups = useMemo<IGroup[]>(() => {
    if (!selectedDivision) return eventData.groups;
    return filterByDivision(eventData.groups, selectedDivision);
  }, [eventData.groups, selectedDivision]);

  // -------------------- Effects --------------------
  useEffect(() => {
    const savedDivision = SessionStorageService.getItem(DIVISION);
    if (savedDivision) {
      setSelectedDivision(String(savedDivision).trim());
    }
  }, []);

  // -------------------- Handlers --------------------

  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };



  // -------------------- Render --------------------

  if (isLoading) return <Loader />
  return (
    <div>
      <h1>Add New Team</h1>

      <TeamAdd
        events={eventData?.events || []}
        currDivision={selectedDivision}
        players={filteredPlayers}
        groupList={filteredGroups}
        setIsLoading={setIsLoading}
        handleClose={handleClose}
      />
    </div>
  );
}

export default TeamAddContainer;
